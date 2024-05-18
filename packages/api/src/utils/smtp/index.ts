import { mailer } from "../../config";

export interface SmtpMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export async function smtpSendMail(
  message: SmtpMessage
): Promise<string | unknown> {
  const result = await mailer.sendMail(message);
  return result.messageId;
}
