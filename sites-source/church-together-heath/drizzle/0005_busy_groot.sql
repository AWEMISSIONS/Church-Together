CREATE TABLE `participation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` integer NOT NULL,
	`church_key` text NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_participation_opportunity_church` ON `participation` (`opportunity_id`,`church_key`);