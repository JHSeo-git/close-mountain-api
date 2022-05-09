/**
 * A set of functions called "actions" for `auth`
 */
import { google } from 'googleapis';
import { sanitize } from '@strapi/utils';
import { getService } from '@strapi/plugin-users-permissions/server/utils';
import { isResponseError, ResponseError } from '../../../utils/types/error';
import { ErrorElement, isGoogleError } from '../../../utils/types/google';
import type { Middleware } from 'koa';

const sanitizeUser = (user: any, ctx: any) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

const login: Middleware = async ctx => {
  try {
    const { oauthToken, accessToken, email } = ctx.request.body;

    if (!oauthToken || !accessToken || !email) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 400,
          name: 'MissingRequiredFields',
          message: 'Missing required body item',
          details: {},
        },
      };
      ctx.status = 400;
      ctx.body = responseError;
      return;
    }

    const people = google.people('v1');
    const { data } = await people.people.get(
      {
        oauth_token: oauthToken,
        access_token: accessToken,
        resourceName: 'people/me',
        personFields: 'emailAddresses,names',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!data.emailAddresses || data.emailAddresses.length === 0) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 404,
          name: 'NotFoundGoogleEmail',
          message: 'No google email address found',
          details: {},
        },
      };
      ctx.status = 404;
      ctx.body = responseError;
      return;
    }

    const primaryEmail = data.emailAddresses.find(
      email => email.metadata.primary,
    );

    if (!primaryEmail?.value) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 404,
          name: 'NotFoundPrimaryGoogleEmail',
          message: 'No primary google email address found',
          details: {},
        },
      };
      ctx.status = 404;
      ctx.body = responseError;
      return;
    }

    // 1. if user is not found, throw 404
    // 2. if user is found, generate JWT token
    const foundUser = await strapi
      .query('plugin::users-permissions.user')
      .findOne({
        where: { email: primaryEmail.value },
        populate: ['roles'],
      });

    // https://forum.strapi.io/t/v4-0-0-sanitize-user-data/13326/6
    console.log({ foundUser });

    if (!foundUser) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 404,
          name: 'NotFoundUser',
          message: 'No user found by google email',
          details: {},
        },
      };
      ctx.status = 404;
      ctx.body = responseError;
      return;
    }

    /**
     * node_modules/@strapi/plugin-users-permissions/server/controllers/auth.js#98
     */
    // const connectedUser = await getService('providers').connect(
    //   'google',
    //   ctx.query,
    // );
    // console.log({ connectedUser });

    ctx.status = 200;
    ctx.body = {
      jwt: getService('jwt').issue({ id: foundUser.id }),
      user: await sanitizeUser(foundUser, ctx),
    };
  } catch (err) {
    if (isGoogleError(err)) {
      const error: ErrorElement =
        err.errors.length > 0
          ? err.errors[0]
          : {
              message: 'Unknown error',
              domain: 'global',
              reason: 'unknown',
              location: 'unknown',
              locationType: 'unknown',
            };

      const responseError: ResponseError = {
        data: null,
        error: {
          status: err.code,
          name: error.message,
          message: `reasen: ${error.reason} | location: ${error.location} | locationType: ${error.locationType}`,
          details: err.errors,
        },
      };

      ctx.status = err.code;
      ctx.body = responseError;
      return;
    } else if (isResponseError(err)) {
      ctx.status = err.error.status;
      ctx.body = err;
      return;
    }

    console.error(err);
    ctx.status = 500;
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
