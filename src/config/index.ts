/* eslint-disable import/no-default-export */
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  appEnv: process.env.APP_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DB_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    expireTime: process.env.EXPIRE_TIME,
  },
  facebook: {
    id: process.env.FB_APP_ID,
    secret: process.env.FB_APP_SECRET,
  },
  google: {
    id: process.env.GOOGLE_ID,
    secret: process.env.GOOGLE_SECRET,
  },
  apple: {
    id: process.env.APPLE_ID,
  },
  sendgrid: process.env.SENDGRID_KEY,
  aws: {
    accessKeyId: 'AKIAYRNGXGNODA5RJO7E',
    secretAccessKey: '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',
    bucket: 'vestiums-uploaded-images-staging',
  },
});
