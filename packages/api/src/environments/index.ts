import { resolve } from "path";

// environment
export const NODE_ENV: string = process.env.NODE_ENV || "development";
export const ROOT_PATH = process.cwd();

// App
export const APP_HOST: string = process.env.APP_HOST || "localhost";
export const PORT: number = process.env.PORT ? +process.env.PORT : 8000;

// Redis InMemory DB Service
export const REDIS_PORT: number = process.env.REDIS_PORT
  ? +process.env.REDIS_PORT
  : 6379;
export const REDIS_HOST: string = process.env.REDIS_HOST || "127.0.0.1";

// Mail Service
export const SMTP_FROM: string =
  process.env.SMTP_FROM || "khabilansomasundar@gmail.com";
export const SMTP_HOST: string = process.env.SMTP_HOST || "smtp.gmail.com";
export const SMTP_SECURE: boolean =
  process.env.SMTP_SECURE === "true" ? true : false;
export const SMTP_PORT: number = SMTP_SECURE ? 465 : 587;
export const SMTP_USER: string = process.env.SMTP_USER || "";
export const SMTP_PASSWORD: string = process.env.SMTP_PASSWORD || "";

// Cookie
export const COOKIE_MAX_AGE: string = process.env.COOKIE_MAX_AGE || "15d";
export const SESSION_MAX_AGE: string = process.env.SESSION_MAX_AGE || "15d";
export const SESSION_KEY: string = process.env.SESSION_KEY || "key1";

// Verification code
export const VERIFICATION_CODE_EXPIRE: string =
  process.env.VERIFICATION_CODE_EXPIRE || "10m";
export const VERIFICATION_CODE_LIMIT: number = process.env
  .VERIFICATION_CODE_LIMIT
  ? +process.env.VERIFICATION_CODE_LIMIT
  : 5;

// Email templates
export const EMAIL_TEMPLATES_DIR: string = resolve(
  ROOT_PATH,
  "resources/email-templates"
);

// Bcrypt
export const BCRYPT_SALT: number = process.env.BCRYPT_SALT
  ? +process.env.BCRYPT_SALT
  : 10;

// Account Deletion
export const ACCOUNT_DELETION_SCHEDULE_INTERVAL: string =
  process.env.ACCOUNT_DELETION_SCHEDULE_INTERVAL || "2d";
