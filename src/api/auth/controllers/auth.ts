/**
 * A set of functions called "actions" for `auth`
 */

import type { Middleware } from 'koa';

const login: Middleware = (ctx, next) => {
  try {
    ctx.body = 'ok';
  } catch (err) {
    ctx.body = err;
  }
};

export default {
  // exampleAction: async (ctx, next) => {
  //   try {
  //     ctx.body = 'ok';
  //   } catch (err) {
  //     ctx.body = err;
  //   }
  // }
  login,
};
