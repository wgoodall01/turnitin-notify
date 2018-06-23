import Datetime from './Datetime.js';
import {DoesNotExistError} from '../lib/errors.js';
import turnitin from '../lib/turnitin.js';
import diff from '../lib/diff.js';
import format from '../lib/format.js';

import User from '../models/User.js';

const assertExists = (item, label) => {
  if (item == null) {
    throw new DoesNotExistError({label});
  }
};

const resolvers = {
  Query: {
    async me(root, args, ctx) {
      const user = await User.get(ctx.user.id, ctx);
      return user;
    }
  },

  Mutation: {
    async createUser(root, args, ctx) {
      const user = new User(args.user, ctx);
      await user.save();
      await ctx.db.commit();
      return user;
    },

    async _triggerFetch(root, args, ctx) {
      const user = await User.get(args.id, ctx);

      let logs = [];
      const newCourses = await turnitin.fetch({
        email: user.turnitinEmail,
        password: user.turnitinPassword,
        tz: user.turnitinTz,

        status(line) {
          logs.push(line);
        }
      });

      const delta = diff.compareCourses(user.courses, newCourses);

      user.updated = new Date();
      user.courses = newCourses;
      await user.save();

      await ctx.db.commit();
      return [
        JSON.stringify(newCourses, null, 2),
        JSON.strinfity(delta, null, 2),
        delta.map(e => format.formatMessage(e)).join('\n'),
        logs.join('\n')
      ];
    }
  },

  Datetime
};

export default resolvers;
