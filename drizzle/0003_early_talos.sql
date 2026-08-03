ALTER TABLE `store_orders` ADD `checkout_attempt_id` text;--> statement-breakpoint
ALTER TABLE `store_orders` ADD `stripe_checkout_session_id` text;--> statement-breakpoint
ALTER TABLE `store_orders` ADD `stripe_payment_intent_id` text;--> statement-breakpoint
ALTER TABLE `store_orders` ADD `paid_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `store_orders_checkout_attempt_unique` ON `store_orders` (`checkout_attempt_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `store_orders_stripe_session_unique` ON `store_orders` (`stripe_checkout_session_id`);