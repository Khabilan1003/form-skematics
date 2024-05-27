import { FormAnalyticModel } from "../model";
import { db } from "../config";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { date, decodeUUIDToId } from "@form/utils";

interface FormAnalyticOptions {
  formId: string | number;
  endAt: Date;
  range: number;
}

export class FormAnalyticService {
  private static async findFormAnalyticInToday(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const today = date();

    const formAnalytic = await db
      .select()
      .from(FormAnalyticModel)
      .where(
        and(
          eq(FormAnalyticModel.formId, formId),
          gte(FormAnalyticModel.createdAt, today.startOf("day").unix()),
          lte(FormAnalyticModel.createdAt, today.endOf("day").unix())
        )
      );

    if (formAnalytic.length === 0) return null;

    return formAnalytic[0];
  }

  public static async summary({ formId, endAt, range }: FormAnalyticOptions) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    return await db
      .select()
      .from(FormAnalyticModel)
      .where(
        and(
          eq(FormAnalyticModel.formId, formId),
          lte(FormAnalyticModel.createdAt, Math.floor(endAt.getTime() / 1e3))
        )
      )
      .limit(range)
      .orderBy(desc(FormAnalyticModel.createdAt));
  }
  
  public static async updateTotalVisits(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const formAnalytic = await this.findFormAnalyticInToday(formId);

    if (formAnalytic) {
      await db
        .update(FormAnalyticModel)
        .set({
          totalVisits: sql`totalVisits + 1`,
        })
        .where(eq(FormAnalyticModel.formId, formId));
    } else {
      const formAnalytic = await db;

      await db.insert(FormAnalyticModel).values({
        formId: formId,
        totalVisits: 1,
        submissionCount: 0,
        averageTime: 0,
      });
    }
  }

  public static async updateCountAndAverageTime(
    formId: string | number,
    duration: number
  ) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const formAnalytic = await this.findFormAnalyticInToday(formId);

    let submissionCount = 0;
    let prevAverageTime = 0;

    if (formAnalytic) {
      submissionCount = formAnalytic?.submissionCount || 0;
      prevAverageTime = formAnalytic?.averageTime || 0;
    }

    const averageTime = Math.floor(
      (duration + submissionCount * prevAverageTime) / (submissionCount + 1)
    );

    if (formAnalytic) {
      await db
        .update(FormAnalyticModel)
        .set({
          submissionCount: sql`submissionCount + 1`,
          averageTime: averageTime,
        })
        .where(eq(FormAnalyticModel.formId, formId));
    } else {
      await db.insert(FormAnalyticModel).values({
        formId,
        totalVisits: 1,
        submissionCount: 1,
        averageTime,
      });
    }
  }
}
