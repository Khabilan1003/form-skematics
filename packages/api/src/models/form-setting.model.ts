import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { FormModel } from './form.model';

export const FormSettingModel = sqliteTable('formsetting', {
	formid: integer('formid')
		.primaryKey()
		.references(() => FormModel.id),

	allowarchive: integer('allowarchive', { mode: 'boolean' }).default(true),

	requirepassword: integer('requirepassword', { mode: 'boolean' }).default(false),

	password: text('password'),

	enableiplimit: integer('enableiplimit', { mode: 'boolean' }).default(false),

	iplimitcount: integer('iplimitcount', { mode: 'number' }),

	published: integer('published', { mode: 'boolean' }).default(false),

	createdAt: integer('createdAt', { mode: 'number' }).default(sql`unixepoch()`),

	updatedAt: integer('updatedAt', { mode: 'number' }).default(sql`unixepoch()`),
});
