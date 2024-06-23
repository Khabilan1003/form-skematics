import Bull from "bull";

import { redisOptions } from "../config";
import { smtpSendMail } from "../utils";

// Defining Queue
const MailQueue = new Bull("MailQueue", redisOptions);

// Register Process
MailQueue.process(async (payload, done) => {
  try {
    const result = await smtpSendMail(payload.data.data);
    done();
  } catch (err) {
    console.log(`Mail Sending Error : ${err}`);
  }
});

export default MailQueue;
