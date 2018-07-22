#!/usr/bin/env node
import db from 'db';
import uuid4 from 'uuid/v4';
import User from 'server/models/User.js';

class Worker {
  constructor(opts) {
    const {offset, retry, steal, log, autostart} = opts || {};

    // Wait this long before starting, in ms.
    this.offset = offset || 0;

    // Wait this long to retry after a failed commit, in ms.
    this.retry = retry || 500;

    // Wait this long before stealing another worker's task, in ms.
    // Guards against dead workers orphaning tasks.
    // Use CAS on commit so it's only completed once.
    this.steal = steal || 1000 * 60 * 2; // 2 mins

    // Generate a worker ID, don't trample other workers.
    this.id = uuid4();

    // Set the logger function. Called with status line strings.
    this.log = log || ((worker, msg) => console.log(`worker ${worker.id}:`, msg));

    // Start of fetch. Base timeout on this. Unix ms, from Date.now().
    this._startTime = null;

    this._continue = true;

    // If autostart, run start after delay
    if (autostart !== false) {
      this._pause(offset)
        .then(e => this.start())
        .catch(e => console.error(e));
    }
  }

  // Logging function
  _log(msg) {
    this.log(this, msg);
  }

  // Main loop.
  async start() {
    while (this._continue) {
      this._log('claiming user...');
      const user = await this._claim();
      if (user === null) {
        // Nothing can be claimed right now. Wait for a bit
        this._log(`got null user. pausing for ${this.pause}...`);
        await this._pause();
        this._log(`done pause`);
      } else {
        // Fetch the user's courses
        this._log(`got user ${user.id}`);
        this._log('fetching courses...');
        const courses = this._fetch(user);

        // Save them to the user with a CAS.
        this._log('committing courses...');
        this._commit(user, courses);
      }
    }
  }

  stop() {
    this._continue = false;
  }

  // Claim work to do. Returns a claimed User, or null if nothing can be claimed.
  async _claim() {
    this._startTime = new Date().toUTCString();

    return await db.transaction(async tx => {
      this._log('getting candidate');

      const candidate =
        (await db('users')
          .transacting(tx)
          .whereRaw(
            `((updated + check_interval) <= now() OR updated IS null)
               AND (
                 worker_lock_start is null
                 OR worker_lock_start < (now() - (:steal * interval '1 millisecond'))
               )`,
            {steal: this.steal}
          )
          .orderByRaw(`(updated + check_interval) asc`)
          .limit(1)
          .first(User.fields)) || null;

      if (candidate === null) {
        return null; // commit tx
      }

      const user = new User(candidate, {db: tx});

      // Lock the candidate.
      user.workerLockStart = new Date();
      user.workerId = this.id;
      await user.save();

      try {
        user.ctx.db = null; // disconnect user from tx
        return user; // commit tx
      } catch (e) {
        // Couldn't commit. Try again after pause.
        await pause(this.retry);
        return await this._claim();
      }
    });
  }

  // Save updated courses to a currently locked user.
  // If everything works out, return true. If something breaks, false.
  async _commit(user, courses) {
    return await db.transaction(async tx => {
      const jobId = (await db('users')
        .transacting(tx)
        .where({id: user.id})
        .first('workerId')).workerId;

      this._log(`Job ID: ${jobId}  matches: ${this.id === jobId}`);

      if (this.id === jobId) {
        // Still us, we're good to swap out the info
        user.courses = courses;

        // Clear out lock, but not last worker.
        user.workerLockStart = null;

        // Update "updated"
        user.updated = this._startTime;

        try {
          user.ctx.db = tx;
          await user.save();
          user.ctx.db = null; // detach user from db
          await tx.commit(true); //  return true
        } catch (e) {
          // Couldn't commit, fail.
          this._log(`could not commit: ${e.toString}`);
          console.error(e);
          return false;
        }
      } else {
        // Another worker stole the job. Quietly die.
        this._log(`job stolen by ${jobId}, this worker will quietly die`);
        return false;
      }
    });
  }

  // Pause execution for a little bit.
  async _pause(duration) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, duration);
    });
  }

  // Fetches courses for a user's profile.
  async _fetch(user) {
    // TODO: make this real
    await this._pause(10 * 1000 * Math.random());
    return [{dummy: true, from: this.id, when: new Date()}];
  }
}

export default Worker;
