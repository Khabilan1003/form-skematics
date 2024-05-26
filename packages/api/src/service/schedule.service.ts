import {
  DeleteFormInTrashScheduler,
  DeleteUserAccountScheduler,
} from "../schedule";

export class SchedulerService {
  public static async start() {
    // Delete Form In Trash
    DeleteFormInTrashScheduler.add(
      "delete form in trash",
      {},
      {
        repeat: {
          cron: "0 0 * * * *",
        },
      }
    );

    // Delete Form In Trash
    DeleteUserAccountScheduler.add(
      "delete scheduled users",
      {},
      {
        repeat: {
          cron: "0 0 */1 * * *",
        },
      }
    );
  }
}
