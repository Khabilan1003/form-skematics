import Bull from "bull";

import { redisOptions } from "../config";
import { smtpSendMail } from "../utils";

// Defining Queue
const MailQueue = new Bull("MailQueue", redisOptions);

// Register Process
MailQueue.process(async (payload, done) => {
  return smtpSendMail(payload.data.data);
});

export default MailQueue;
