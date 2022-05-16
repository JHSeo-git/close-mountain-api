export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/oauth/login',
      handler: 'auth.login',
      config: {
        auth: false,
        // policies: [],
        // middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify/send-code',
      handler: 'auth.sendEmailVerificationCode',
      config: {
        auth: false,
        // policies: [],
        // middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify/check-code',
      handler: 'auth.checkEmailVerificationCode',
      config: {
        auth: false,
        // policies: [],
        // middlewares: [],
      },
    },
  ],
};
