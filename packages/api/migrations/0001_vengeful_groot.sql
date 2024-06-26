CREATE TABLE `formanalytic` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`formId` integer NOT NULL,
	`totalVisits` integer DEFAULT 0,
	`submissionCount` integer DEFAULT 0,
	`averageTime` integer DEFAULT 0,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `formfieldgroup` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`formId` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text,
	`description` text,
	FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `formfield` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fieldGroupId` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`title` text,
	`description` text,
	`kind` text,
	`required` integer DEFAULT false,
	`property` text,
	FOREIGN KEY (`fieldGroupId`) REFERENCES `formfieldgroup`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `formfieldreport` (
	`fieldId` integer PRIMARY KEY NOT NULL,
	`total` integer,
	`count` integer,
	`average` integer,
	`chooses` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`fieldId`) REFERENCES `formfield`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `form` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text,
	`retentionAt` integer DEFAULT 0,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `formsetting` (
	`formId` integer PRIMARY KEY NOT NULL,
	`allowArchive` integer DEFAULT true,
	`requirePassword` integer DEFAULT false,
	`password` text,
	`enableIpLimit` integer DEFAULT false,
	`ipLimitCount` integer DEFAULT 1,
	`published` integer DEFAULT false,
	`enableExpirationDate` integer DEFAULT false,
	`enabledAt` integer DEFAULT 0,
	`closedAt` integer DEFAULT 0,
	`enableQuotaLimit` integer DEFAULT false,
	`quotaLimit` integer DEFAULT 0,
	`closedFormTitle` text,
	`closedFormDescription` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `submissionfield` (
	`submissionId` integer,
	`fieldId` integer,
	`kind` text NOT NULL,
	`value` text,
	PRIMARY KEY(`fieldId`, `submissionId`),
	FOREIGN KEY (`submissionId`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fieldId`) REFERENCES `formfield`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `submission` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`formId` integer,
	`ip` text NOT NULL,
	`startAt` integer NOT NULL,
	`endAt` integer NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`formId`) REFERENCES `form`(`id`) ON UPDATE no action ON DELETE cascade
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