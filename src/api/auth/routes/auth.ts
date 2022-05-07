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
      method: 'GET',
      path: '/auth/login',
      handler: 'auth.login',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
