import { DrizzleD1Database } from "drizzle-orm/d1";
import { UserModel } from "../model";
import { and, eq, gt, inArray, lte } from "drizzle-orm";

import { encodeIdToUUID, decodeUUIDToId, timestamp } from "@form/utils";
import { db } from "../config";

export class UserService {
  static async findById(id: string | number) {
    if (typeof id === "string") id = decodeUUIDToId(id);

    const user = await db.select().from(UserModel).where(eq(UserModel.id, id));

    if (user.length === 0) return null;

    const result = { ...user[0], id: encodeIdToUUID(user[0].id) };

    return result;
  }

  static async findAll(ids: string[]) {
    const decoded_ids = ids.map((id) => decodeUUIDToId(id));

    const users = await db
      .select()
      .from(UserModel)
      .where(inArray(UserModel.id, decoded_ids));

    const result = users.map((user) => ({
      ...user,
      id: encodeIdToUUID(user.id),
    }));

    return result;
  }

  static async findAllDeletionScheduled() {
    const users = await db
      .select()
      .from(UserModel)
      .where(
        and(
          eq(UserModel.isDeletionScheduled, true),
          gt(UserModel.deletionScheduledAt, 0),
          lte(UserModel.deletionScheduledAt, timestamp())
        )
      );

    const result = users.map((user) => ({
      ...user,
      id: encodeIdToUUID(user.id),
    }));

    return result;
  }

  static async findByEmail(email: string) {
    const user = await db
      .select()
      .from(UserModel)
      .where(eq(UserModel.email, email));

    if (user.length === 0) return null;

    return user[0];
  }

  static async create(user: {
    name: string;
    email: string;
    password: string;
    avatar: string;
  }) {
    const newUser = await db
      .insert(UserModel)
      .values(user)
      .returning({ id: UserModel.id });

    if (newUser.length === 0) return null;

    return encodeIdToUUID(newUser[0].id);
  }

  static async update(
    id: string | number,
    updates: Record<string, any>
  ): Promise<boolean> {
    if (typeof id === "string") {
      id = decodeUUIDToId(id);
    }

    const updatedUserId = await db
      .update(UserModel)
      .set(updates)
      .where(eq(UserModel.id, id))
      .returning({ updatedId: UserModel.id });

    if (updatedUserId.length === 0) return false;

    return true;
  }

  static async delete(id: string | number): Promise<boolean> {
    if (typeof id === "string") {
      
      id = decodeUUIDToId(id);
    }

    const deletedUserId = await db
      .delete(UserModel)
      .where(eq(UserModel.id, id))
      .returning({ delectedId: UserModel.id });

    if (deletedUserId.length === 0) return false;

    return true;
  }
}
