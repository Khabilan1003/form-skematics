import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { SubmissionModel } from './submission.model';
import { FormFieldModel } from './form-field.model';

export const SubmissionFieldModel = sqliteTable(
	'submissionfield',
	{
		submissionid: integer('submissionid').references(() => SubmissionModel.id),

		fieldid: integer('fieldid').references(() => FormFieldModel.id),

		kind: text('kind', { enum: ['FORM_FIELD', 'FORM_VARIABLE'] }).notNull(),

		value: text('value', { mode: 'json' }).$type<
			| string // This type is for SHORT_TEXT, LONG_TEXT, EMAIL, URL, YES/NO, date, rating, opinionScale, fileUpload, country
			| { firstname: string; lastname: string } // This type is for FULL_NAME
			| { countryCode: string; phoneNumber: string } // This type is for PHONE_NUMBER
			| { startDate: number; endDate: number } // This type is for DATE_RANGE
			| { address1: string; address2: string; city: string; state: string; country: string; pincode: string } // This type is for ADDRESS
			| any[] // This type is for MULTIPLE_CHOICE, PICTURE_CHOICE. In Future make the type more clear.
		>(),
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.submissionid, table.fieldid] }),
		};
	}
);
