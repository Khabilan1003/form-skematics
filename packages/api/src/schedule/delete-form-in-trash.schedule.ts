import Bull from "bull";

import { redisOptions } from "../config";
import { FormService } from "../service/form.service";

// Defining Queue
export const DeleteFormInTrashScheduler = new Bull(
  "DeleteFormInTrashScheduler",
  redisOptions
);

// Register Process
DeleteFormInTrashScheduler.process(async (payload, done) => {
  const forms = await FormService.findAllInTrash();

  for (const form of forms) {
    await FormService.delete(
      "",
      forms.map((form) => form.id),
      true
    );
  }
});
