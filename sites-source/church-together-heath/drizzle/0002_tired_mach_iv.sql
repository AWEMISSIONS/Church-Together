CREATE TABLE `churches` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`church_key` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `items` ADD `church_key` text DEFAULT 'midway' NOT NULL;