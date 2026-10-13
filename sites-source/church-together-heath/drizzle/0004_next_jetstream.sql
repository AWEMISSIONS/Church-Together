CREATE INDEX `idx_items_church_key` ON `items` (`church_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_memberships_email_church` ON `memberships` (`email`,`church_key`);