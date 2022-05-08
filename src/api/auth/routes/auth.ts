export default {
  routes: [
    // {
    //  method: 'GET',
    //  path: '/auth',
    //  handler: 'auth.exampleAction',
    //  config: {
    //    policies: [],
    //    middlewares: [],
    //  },
    // },
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
  ],
};
