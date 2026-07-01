export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
  },

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
    firstName: process.env.SUPER_ADMIN_FIRST_NAME ?? 'SAN',
    lastName: process.env.SUPER_ADMIN_LAST_NAME ?? 'TECH',
  },

  google: {
    // OAuth 2.0 Web/Android/iOS client ID(s) from Google Cloud Console that are
    // allowed to mint ID tokens for "Continue with Google" / One Tap sign-in.
    // Accepts a comma-separated list since web and mobile clients typically
    // have different client IDs but should all be accepted as audiences.
    clientIds: (process.env.GOOGLE_CLIENT_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  },
});
