import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const UserModel = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),

	name: text('name' ,).notNull(),

	email: text('email').notNull().unique(),

	password: text('password'),

	avatar: text('avatar').notNull(),

	phoneNumber: text('phoneNumber'),

	isEmailVerified: integer('isEmailVerified', { mode: 'boolean' }).default(false),

	isDeletionScheduled: integer('isDeletionScheduled', { mode: 'boolean' }).default(false),

	isSocialAccount: integer('isSocialAccount', { mode: 'boolean' }).default(false),

	deletionScheduledAt: integer('deletionScheduledAt', { mode: 'number' }).default(0),

	createdAt: integer('createdAt', { mode: 'number' }).default(sql`unixepoch()`),

	updatedAt: integer('updatedAt', { mode: 'number' }).default(sql`unixepoch()`),
});
