CREATE TABLE `formanalytic` (
	`formid` integer PRIMARY KEY NOT NULL,
	`totalvisits` integer DEFAULT 0,
	`submissioncount` integer DEFAULT 0,
	`averagetime` integer DEFAULT 0,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`formid`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formfield` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`formid` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text,
	`description` text,
	`kind` text,
	`required` integer DEFAULT false,
	`layoutmediatype` text,
	`layoutmediaurl` text,
	`layoutbrightness` integer,
	`layoutalign` text,
	`property` text,
	FOREIGN KEY (`formid`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formfieldreport` (
	`fieldid` integer PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0,
	`average` integer DEFAULT 0,
	`chooses` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`fieldid`) REFERENCES `formfield`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formlogic` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`formid` integer NOT NULL,
	`fieldid` integer NOT NULL,
	`comparision` text,
	`expected` text,
	`kind` text,
	`navigatefieldid` integer,
	`variableid` integer,
	`operator` text,
	`value` text,
	FOREIGN KEY (`formid`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fieldid`) REFERENCES `formfield`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`navigatefieldid`) REFERENCES `formfield`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variableid`) REFERENCES `formvariable`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `form` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userid` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text,
	`retentionAt` integer DEFAULT 0,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`userid`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formsetting` (
	`formid` integer PRIMARY KEY NOT NULL,
	`allowarchive` integer DEFAULT true,
	`requirepassword` integer DEFAULT false,
	`password` text,
	`enableiplimit` integer DEFAULT false,
	`iplimitcount` integer,
	`published` integer DEFAULT false,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`formid`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formthemesetting` (
	`formid` integer PRIMARY KEY NOT NULL,
	`fontfamily` text NOT NULL,
	`screenfontsize` text,
	`fieldfontsize` text,
	`questiontextcolor` text NOT NULL,
	`answertextcolor` text NOT NULL,
	`buttontextcolor` text NOT NULL,
	`buttonbackgroundcolor` text NOT NULL,
	`backgroundcolor` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`formid`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `formvariable` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`formid` integer NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`formid`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `submissionfield` (
	`submissionid` integer,
	`fieldid` integer,
	`kind` text NOT NULL,
	`value` text,
	PRIMARY KEY(`fieldid`, `submissionid`),
	FOREIGN KEY (`submissionid`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fieldid`) REFERENCES `formfield`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `submission` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`formid` integer,
	`ip` text NOT NULL,
	`startat` integer NOT NULL,
	`endat` integer NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`formid`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`avatar` text NOT NULL,
	`phoneNumber` text,
	`isEmailVerified` integer DEFAULT false,
	`isDeletionScheduled` integer DEFAULT false,
	`isSocialAccount` integer DEFAULT false,
	`deletionScheduledAt` integer DEFAULT 0,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);