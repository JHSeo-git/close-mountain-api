export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      },
      settings: {
        defaultFrom: 'closemountain@sample.com',
        defaultReplyTo: 'closemountain@sample.com',
      },
    },
  },
});
