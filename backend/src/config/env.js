const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error('missing env');

export const env = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  upload: process.env.upload || './uploads',
  jwtSecret: process.env.JWT_SECRET,
  jwtExp: process.env.JWT_EXPIRES || '15d'
};