import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { FormModel } from './form.model';

export const SubmissionModel = sqliteTable('submission', {
	id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),

	formid: integer('formid', { mode: 'number' }).references(() => FormModel.id),

	ip: text('ip', { mode: 'text' }).notNull(),

	startat: integer('startat', { mode: 'number' }).notNull(),

	endat: integer('endat', { mode: 'number' }).notNull(),

	createdAt: integer('createdAt', { mode: 'number' }).default(sql`unixepoch()`),

	updatedAt: integer('updatedAt', { mode: 'number' }).default(sql`unixepoch()`),
});