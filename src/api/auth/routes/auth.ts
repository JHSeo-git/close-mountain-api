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
      path: '/auth/verify/check-code',
      handler: 'auth.checkVerificationCode',
      config: {
        auth: false,
        // policies: [],
        // middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify/send-code',
      handler: 'auth.sendVerificationCode',
      config: {
        auth: false,
        // policies: [],
        // middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify/check-username',
      handler: 'auth.checkUsername',
      config: {
        auth: false,
        // policies: [],
        // middlewares: [],
      },
    },

    // not use
    // {
    //   method: 'POST',
    //   path: '/auth/verify/send-code',
    //   handler: 'auth.sendEmailVerificationCode',
    //   config: {
    //     auth: false,
    //     // policies: [],
    //     // middlewares: [],
    //   },
    // },
    // {
    //   method: 'POST',
    //   path: '/auth/verify/check-code',
    //   handler: 'auth.checkEmailVerificationCode',
    //   config: {
    //     auth: false,
    //     // policies: [],
    //     // middlewares: [],
    //   },
    // },
  ],
};
