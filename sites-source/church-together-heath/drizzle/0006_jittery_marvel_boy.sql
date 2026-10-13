CREATE TABLE `local_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_local_sessions_user` ON `local_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `local_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `local_users_email_unique` ON `local_users` (`email`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`email` text PRIMARY KEY NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`window_start` integer DEFAULT 0 NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_invites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `login_invites_token_hash_unique` ON `login_invites` (`token_hash`);