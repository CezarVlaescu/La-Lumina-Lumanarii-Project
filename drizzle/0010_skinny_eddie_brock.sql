ALTER TABLE `catalog_products` ADD `scent_ids_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_order_items` ADD `scent_id` text;--> statement-breakpoint
ALTER TABLE `store_order_items` ADD `scent_name` text;