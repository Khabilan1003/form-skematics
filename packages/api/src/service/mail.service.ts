import MailQueue from "../queue/mail.queue";
import { SMTP_FROM } from "../environments";
import { helper } from "@form/utils";
import { JobOptions } from "bull";
import { basename } from "path";
import { readFileSync } from "fs-extra";
import { readDirSync } from "../utils";
import { EMAIL_TEMPLATES_DIR } from "../environments";

const HTML_EXT = ".html";
const TEMPLATE_TITLE_REGEX = /-{3,}\ntitle:\s+(.+)\n-{3,}/im;

interface SubmissionNotificationOptions {
  formName: string;
  submission: string;
  link: string;
}

class MailService {
  private static readonly emailTemplates: Record<
    string,
    { subject: string; html: string }
  > = {};

  static async accountDeletionAlert(to: string) {
    await this.addQueue("account_deletion_alert", to);
  }

  static async accountDeletionRequest(to: string, code: string) {
    await this.addQueue("account_deletion_request", to, {
      code,
    });
  }

  static async emailVerificationRequest(to: string, code: string) {
    await this.addQueue("email_verification_request", to, {
      code,
    });
  }

  static async passwordChangeAlert(to: string) {
    await this.addQueue("password_change_alert", to);
  }

  static async scheduleAccountDeletionAlert(to: string, fullName: string) {
    await this.addQueue("schedule_account_deletion_alert", to, {
      fullName,
      email: to,
    });
  }

  static async submissionNotification(
    to: string,
    options: SubmissionNotificationOptions
  ) {
    await this.addQueue("submission_notification", to, options);
  }

  static init() {
    const filePaths = readDirSync(EMAIL_TEMPLATES_DIR, HTML_EXT);

    for (const filePath of filePaths) {
      const name = basename(filePath, HTML_EXT);
      const content = readFileSync(filePath).toString("utf8");
      const matches = content.match(TEMPLATE_TITLE_REGEX);

      if (matches) {
        const subject = matches[1];
        const html = content.replace(TEMPLATE_TITLE_REGEX, "");

        this.emailTemplates[name] = {
          subject,
          html,
        };
      }
    }
  }

  private static async addQueue(
    templateName: string,
    to: string,
    replacements?: Record<string, any>,
    options?: JobOptions
  ) {
    const result = MailService.emailTemplates[templateName];

    if (helper.isEmpty(result)) {
      return;
    }

    let subject = result!.subject;
    let html = result!.html;

    if (helper.isValid(replacements) && helper.isPlainObject(replacements)) {
      Object.keys(replacements!).forEach((key) => {
        const value = replacements![key];
        const regex = new RegExp(`{${key}}`, "g");

        subject = subject.replace(regex, value);
        html = html?.replace(regex, value);
      });
    }

    await MailQueue.add(
      {
        queueName: "MailQueue",
        data: {
          from: SMTP_FROM,
          to,
          subject,
          html,
        },
      },
      options
    );
  }
}

(() => {
  MailService.init();
})();

export default MailService;
