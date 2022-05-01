export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '46de3c5a081e25781edb85fe892433e5'),
  },
});
