import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { FormModel } from './form.model';

export const FormVariableModel = sqliteTable('formvariable', {
	id: integer('id').primaryKey({ autoIncrement: true }).notNull(),

	formid: integer('formid')
		.notNull()
		.references(() => FormModel.id),

	name: text('name').notNull(),

	kind: text('kind', { enum: ['STRING', 'NUMBER'] }).notNull(),

	value: text('value').notNull(),
});
