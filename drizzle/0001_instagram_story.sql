ALTER TABLE `events` ADD `instagram_image_key` text;
--> statement-breakpoint
ALTER TABLE `events` ADD `instagram_text` text DEFAULT 'Eu fui!' NOT NULL;
