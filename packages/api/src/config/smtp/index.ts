import {
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_HOST,
  SMTP_SECURE,
} from "../../environments";
import * as nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});
