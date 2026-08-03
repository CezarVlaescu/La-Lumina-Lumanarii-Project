CREATE TABLE `customer_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`account_email` text NOT NULL,
	`label` text DEFAULT 'Acasă' NOT NULL,
	`address_line` text NOT NULL,
	`city` text NOT NULL,
	`county` text NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`country` text DEFAULT 'România' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`account_email`) REFERENCES `customer_profiles`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `customer_addresses_account_idx` ON `customer_addresses` (`account_email`);--> statement-breakpoint
CREATE INDEX `customer_addresses_default_idx` ON `customer_addresses` (`account_email`,`is_default`);--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_profiles_role_idx` ON `customer_profiles` (`role`);--> statement-breakpoint
CREATE INDEX `customer_profiles_updated_at_idx` ON `customer_profiles` (`updated_at`);