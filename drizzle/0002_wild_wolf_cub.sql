CREATE TABLE `store_email_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`event_key` text NOT NULL,
	`kind` text NOT NULL,
	`order_status` text,
	`recipient` text NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider_id` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`sent_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `store_email_deliveries_event_key_unique` ON `store_email_deliveries` (`event_key`);--> statement-breakpoint
CREATE INDEX `store_email_deliveries_order_idx` ON `store_email_deliveries` (`order_id`);--> statement-breakpoint
CREATE INDEX `store_email_deliveries_status_idx` ON `store_email_deliveries` (`status`);