import Bull from "bull";

import { redisOptions } from "../config";
import { UserService } from "../service/user.service";

// Defining Queue
export const DeleteUserAccountScheduler = new Bull(
  "DeleteUserAccountScheduler",
  redisOptions
);

// Register Process
DeleteUserAccountScheduler.process(async (payload, done) => {
  const users = await UserService.findAllDeletionScheduled();

  for (const user of users) {
    await UserService.delete(user.id);
  }
});
