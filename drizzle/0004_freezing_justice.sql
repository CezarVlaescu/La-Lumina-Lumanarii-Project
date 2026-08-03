ALTER TABLE `store_orders` ADD `shipping_method` text DEFAULT 'sameday_address' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_orders` ADD `shipping_point_id` text;--> statement-breakpoint
ALTER TABLE `store_orders` ADD `shipping_point_name` text;