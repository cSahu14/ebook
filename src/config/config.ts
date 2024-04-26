import { config as conf } from "dotenv";

conf();

const _config = {
  port: process.env.PORT,
  databaseUrl: process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  cloudinary_cloud: process.env.COUDINARY_CLOUD,
  cloudinary_api_key: process.env.COUDINARY_API_KEY,
  cloudinary_api_secret: process.env.COUDINARY_API_SECRET,
  frontendDomain: process.env.FRONTEND_DOMAIN,
};

export const config = Object.freeze(_config);
