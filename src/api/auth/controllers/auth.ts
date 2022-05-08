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
        status: 400,
        name: 'MissingRequiredFields',
        message: 'Missing required body item',
        details: {},
      };
      ctx.status = 400;
      ctx.body = responseError;
      return;
    }

    const people = google.people('v1');
    const { data } = await people.people.get(
      {
        oauth_token:
          'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZjYmQ3ZjQ4MWE4MjVkMTEzZTBkMDNkZDk0ZTYwYjY5ZmYxNjY1YTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyMTU4ODUzMzM0NzQtcTRlYXMzdjBrY2wyNTZsNTdiNWowaWloY2pwYTZyODEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMTU4ODUzMzM0NzQtcTRlYXMzdjBrY2wyNTZsNTdiNWowaWloY2pwYTZyODEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDM4NzgwMzAzNzY2OTIwNjkzNDUiLCJlbWFpbCI6ImRldi5uYW1lemluQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiSVhwX2tFaEg3bVRNNm9qdVZ4NWZXUSIsIm5vbmNlIjoiU1JfMHhHN2xlYmY0aEMwRDdjWWdabWRvcEF2SFZuX1pOU3oycG45ejlCSSIsIm5hbWUiOiJKdW5oeXVuZyBTZW8iLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKek5teGNnYm5fajFsOGtQU3lUVFJsdXFEYlNXNy1tYkxLTUxmZjM9czk2LWMiLCJnaXZlbl9uYW1lIjoiSnVuaHl1bmciLCJmYW1pbHlfbmFtZSI6IlNlbyIsImxvY2FsZSI6ImtvIiwiaWF0IjoxNjUyMDEzMDcxLCJleHAiOjE2NTIwMTY2NzF9.CAWVxzS2IaZsCk79GhDTTVhp6gMO14s4v_wJPb11_4B-kDvCy35HmeiFNS9vgxsSlaeNKhVDm14aVTCIQ-NfhudcYA1XdwpSVjEp1O0holHE5qKbBX-nf_Vjpe1nn_BY5faFOSIg0DYX3AY55L-feWoxgbjtxDEulSl6SiTd2dDlfncn5RpJXurWiVzQCL93TPcXMrtnqzQH6W8zfi-hKDohF9jzfd8xVhweEivkmhq0pae0mJCvPJrRYo_JCuPnrUnHFCif3NtMYk5IsyYlGbFSOS0JDC7pMflUjB-ff-dBw4TyXLYf6ni83vFakH8xTCfXGvmyDkHLm9vkKFPbPA',
        access_token:
          'ya29.A0ARrdaM9ZA-n3Nqzc-1KOqItW4yzbFPRChXHEceqT2_FYwLepv1kT3F7PHD4Xpq9T2U2yb7JlJy3Ygdr7GVIveSGS6T7aFYVn_YFws2W5MoaFGn8_XRG5X42HGA4U8Q4B4OlGG9uX8LyPQykdrUMloqe2kAN8',
        resourceName: 'people/me',
        personFields: 'emailAddresses,names',
      },
      {
        headers: {
          Authorization: `Bearer ya29.A0ARrdaM9ZA-n3Nqzc-1KOqItW4yzbFPRChXHEceqT2_FYwLepv1kT3F7PHD4Xpq9T2U2yb7JlJy3Ygdr7GVIveSGS6T7aFYVn_YFws2W5MoaFGn8_XRG5X42HGA4U8Q4B4OlGG9uX8LyPQykdrUMloqe2kAN8`,
        },
      },
    );

    if (!data.emailAddresses || data.emailAddresses.length === 0) {
      const responseError: ResponseError = {
        status: 404,
        name: 'NotFoundGoogleEmail',
        message: 'No google email address found',
        details: {},
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
        status: 404,
        name: 'NotFoundPrimaryGoogleEmail',
        message: 'No primary google email address found',
        details: {},
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
        status: 404,
        name: 'NotFoundUser',
        message: 'No user found by google email',
        details: {},
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
        status: err.code,
        name: error.message,
        message: `reasen: ${error.reason} | location: ${error.location} | locationType: ${error.locationType}`,
        details: err.errors,
      };

      ctx.status = err.code;
      ctx.body = responseError;
      return;
    } else if (isResponseError(err)) {
      ctx.status = err.status;
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
