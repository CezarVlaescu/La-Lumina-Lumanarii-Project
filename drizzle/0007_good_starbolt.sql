CREATE TABLE `newsletter_subscribers` (
	`email` text PRIMARY KEY NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'subscribed' NOT NULL,
	`source` text DEFAULT 'footer' NOT NULL,
	`consent_at` text NOT NULL,
	`unsubscribed_at` text,
	`provider_contact_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_status_idx` ON `newsletter_subscribers` (`status`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_sync_status_idx` ON `newsletter_subscribers` (`sync_status`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_created_at_idx` ON `newsletter_subscribers` (`created_at`);