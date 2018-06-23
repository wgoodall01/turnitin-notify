import pick from 'lodash/pick';
import assert from 'assert';

class User {
  _fields = ['id', 'turnitinEmail', 'turnitinPassword', 'phone', 'prefs', 'updated', 'courses'];

  constructor(props, ctx) {
    this._ctx = ctx || {};

    const defaults = {prefs: {}, courses: [], updated: null};
    Object.assign(this, defaults, pick(props, this._fields));
    assert(this.id, 'User must have `id`');
    assert(this.turnitinEmail, 'User must have `turnitinEmail`');
    assert(this.turnitinPassword, 'User must have `turnitinPassword`');
  }

  static async get(id, ctx) {
    const res = await ctx
      .db('users')
      .where({id})
      .select(this._fields);
    console.log(res);

    const props = res[0];
    if (typeof props === 'undefined') {
      return null;
    } else {
      return new User(res[0], ctx);
    }
  }

  async save() {
    const data = pick(this, this._fields);

    // Try updating
    const rowsChanged = await this._ctx
      .db('users')
      .where({id: this.id})
      .update(data);

    if (rowsChanged === 0) {
      // insert record instead
      await this._ctx.db('users').insert(data);
    }
  }
}

export default User;
