/**
 * A set of functions called "actions" for `auth`
 */
import { google } from 'googleapis';
import { sanitize } from '@strapi/utils';
import { getService } from '@strapi/plugin-users-permissions/server/utils';
import { isResponseError, ResponseError } from '../../../utils/types/error';
import { ErrorElement, isGoogleError } from '../../../utils/types/google';
import { isVerifyType } from '../../../utils/types/verify';
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

const checkEmailVerificationCode: Middleware = async ctx => {
  try {
    const { email, code, type } = ctx.request.body;

    if (!email || !code) {
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

    if (!isVerifyType(type)) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 400,
          name: 'NotallowedVerifyType',
          message: `Not allowed Verifty type: ${type}`,
          details: {},
        },
      };
      ctx.status = 400;
      ctx.body = responseError;
      return;
    }

    const foundInfo = await strapi
      .query('api::email-verification.email-verification')
      .findOne({
        where: { email },
      });

    if (!foundInfo?.code) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 404,
          name: 'NotFound',
          message: `Not found verification code: ${email} / ${code}`,
          details: {},
        },
      };
      ctx.status = 404;
      ctx.body = responseError;
      return;
    }

    if (code !== foundInfo.code) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 400,
          name: 'NotMatchedcode',
          message: `Not matched verification code: ${email} / ${code}`,
          details: {},
        },
      };
      ctx.status = 400;
      ctx.body = responseError;
      return;
    }

    ctx.status = 204;
  } catch (err) {
    if (isResponseError(err)) {
      ctx.status = err.error.status ?? 500;
      ctx.body = err;
      return;
    }

    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
};

const sendEmailVerificationCode: Middleware = async ctx => {
  try {
    const { email, type } = ctx.request.body;

    if (!email) {
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

    if (!isVerifyType(type)) {
      const responseError: ResponseError = {
        data: null,
        error: {
          status: 400,
          name: 'NotallowedVerifyType',
          message: `Not allowed Verifty type: ${type}`,
          details: {},
        },
      };
      ctx.status = 400;
      ctx.body = responseError;
      return;
    }

    if (type === 'two-factor' || type === 'reset-password') {
      const foundUser = await strapi
        .query('plugin::users-permissions.user')
        .findOne({
          where: { email },
        });

      if (!foundUser) {
        const responseError: ResponseError = {
          data: null,
          error: {
            status: 404,
            name: 'NotFoundUser',
            message: 'No user found by email',
            details: {},
          },
        };
        ctx.status = 404;
        ctx.body = responseError;
        return;
      }
    }

    const generatedCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    // 1. 이메일과 인증 코드 맵핑 테이블에 저장
    //    - 저장 시 이메일 인증 코드 시작 시간 설정 후 제한 시간 설정)
    //    - 기존 동일 이메일 있을 시 삭제 후 새로 저장
    // 2. 인증 코드 전송
    console.log({
      email,
      code: generatedCode,
      type,
    });
    const foundInfo = await strapi
      .query('api::email-verification.email-verification')
      .findOne({
        where: { email },
      });

    if (foundInfo) {
      const deleteResult = await strapi.entityService.delete(
        'api::email-verification.email-verification',
        foundInfo.id,
      );
      console.log({ deleteResult });
    }

    const createCodeResult = await strapi.entityService.create(
      'api::email-verification.email-verification',
      {
        data: {
          email,
          code: generatedCode,
          type,
        },
      },
    );
    console.log({ createCodeResult });

    // const result = await strapi.plugins['email'].services.email.send({
    //   to: email,
    //   // from: strapi.config.currentEnvironment.email.defaultFrom,
    //   // replyTo: strapi.config.currentEnvironment.email.defaultReplyTo,
    //   subject: `Verify your ${type} code`,
    //   text: `
    //     Hello,
    //     Please type this ${type} code on app screen:
    //     CODE: ${generatedCode}
    //   `,
    // });
    // console.log('send result: ', result);

    ctx.status = 204;
  } catch (err) {
    if (isResponseError(err)) {
      ctx.status = err.error.status ?? 500;
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
  sendEmailVerificationCode,
  checkEmailVerificationCode,
};
