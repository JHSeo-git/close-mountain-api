"use strict";
/**
 * A set of functions called "actions" for `auth`
 */
Object.defineProperty(exports, "__esModule", { value: true });
const login = (ctx, next) => {
    try {
        ctx.body = 'ok';
    }
    catch (err) {
        ctx.body = err;
    }
};
exports.default = {
    // exampleAction: async (ctx, next) => {
    //   try {
    //     ctx.body = 'ok';
    //   } catch (err) {
    //     ctx.body = err;
    //   }
    // }
    login,
};
