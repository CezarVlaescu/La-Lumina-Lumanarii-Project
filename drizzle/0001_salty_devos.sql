CREATE TABLE `product_inventory` (
	`sku` text PRIMARY KEY NOT NULL,
	`product_slug` text NOT NULL,
	`variant_id` text DEFAULT '' NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "product_inventory_stock_non_negative" CHECK("product_inventory"."stock" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_inventory_product_variant_unique` ON `product_inventory` (`product_slug`,`variant_id`);--> statement-breakpoint
CREATE INDEX `product_inventory_product_idx` ON `product_inventory` (`product_slug`);--> statement-breakpoint
CREATE TABLE `store_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_slug` text NOT NULL,
	`product_name` text NOT NULL,
	`product_image` text DEFAULT '' NOT NULL,
	`variant_id` text,
	`variant_name` text,
	`unit_price_cents` integer NOT NULL,
	`quantity` integer NOT NULL,
	`line_total_cents` integer NOT NULL,
	CONSTRAINT "store_order_items_quantity_positive" CHECK("store_order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE INDEX `store_order_items_order_idx` ON `store_order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `store_order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`changed_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `store_order_status_history_order_idx` ON `store_order_status_history` (`order_id`);--> statement-breakpoint
CREATE TABLE `store_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`payment_method` text DEFAULT 'cash_on_delivery' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`customer_first_name` text NOT NULL,
	`customer_last_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`address_line` text NOT NULL,
	`city` text NOT NULL,
	`county` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text DEFAULT 'România' NOT NULL,
	`customer_note` text,
	`subtotal_cents` integer NOT NULL,
	`shipping_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`consent_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `store_orders_order_number_unique` ON `store_orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `store_orders_created_at_idx` ON `store_orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `store_orders_status_idx` ON `store_orders` (`status`);--> statement-breakpoint
CREATE INDEX `store_orders_email_idx` ON `store_orders` (`customer_email`);