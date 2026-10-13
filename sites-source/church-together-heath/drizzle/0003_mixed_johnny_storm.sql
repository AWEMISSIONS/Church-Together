ALTER TABLE `items` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `updated_at` text DEFAULT '' NOT NULL;