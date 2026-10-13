ALTER TABLE `items` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `preferred_contact` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `assigned_to` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `due_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `priority` text DEFAULT 'normal' NOT NULL;