CREATE TABLE `catalog_collections` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_slug` text,
	`description` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_cents` integer,
	`image` text DEFAULT '' NOT NULL,
	`gallery_json` text DEFAULT '[]' NOT NULL,
	`category` text DEFAULT 'Decorativă' NOT NULL,
	`collection` text DEFAULT '' NOT NULL,
	`burn_time` text,
	`weight` text,
	`details_json` text DEFAULT '[]' NOT NULL,
	`themes_json` text DEFAULT '[]' NOT NULL,
	`variants_json` text DEFAULT '[]' NOT NULL,
	`tag` text,
	`stock` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_products_slug_unique` ON `catalog_products` (`slug`);--> statement-breakpoint
CREATE TABLE `store_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
