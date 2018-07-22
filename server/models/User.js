import pick from 'lodash/pick';
import assert from 'assert';

class User {
  static fields = [
    'id',
    'turnitinEmail',
    'turnitinPassword',
    'turnitinTz',
    'phone',
    'checkInterval',
    'updated',
    'workerId',
    'workerLockStart',
    'courses'
  ];

  constructor(props, ctx) {
    // non-enumerable but read/writable.
    Object.defineProperty(this, 'ctx', {value: ctx || {}, enumerable: false});

    const defaults = {courses: null, updated: null};
    Object.assign(this, defaults, pick(props, User.fields));
    assert(this.id, 'User must have `id`');
    assert(this.turnitinEmail, 'User must have `turnitinEmail`');
    assert(this.turnitinPassword, 'User must have `turnitinPassword`');
    assert(this.turnitinTz, 'User must have `turnitinTz`');
    assert(this.phone, 'User must have `phone`');
    assert(this.checkInterval, 'User must have `checkInterval`');
  }

  static async get(id, ctx) {
    if (!this.ctx.db) {
      throw new Error("Can't get() without this.ctx.db");
    }

    const res = await ctx
      .db('users')
      .where({id})
      .select(User.fields);
    console.log(res);

    const props = res[0];
    if (typeof props === 'undefined') {
      return null;
    } else {
      return new User(res[0], ctx);
    }
  }

  async save() {
    if (!this.ctx.db) {
      throw new Error("Can't save() without this.ctx.db");
    }

    // Stringify the courses, so node-postgres doesn't think it's a pg array.
    const data = {...pick(this, User.fields), courses: JSON.stringify(this.courses)};

    // Try updating
    const rowsChanged = await this.ctx
      .db('users')
      .where({id: this.id})
      .update(data);

    if (rowsChanged === 0) {
      // insert record instead
      await this.ctx.db('users').insert(data);
    }
  }
}

export default User;
