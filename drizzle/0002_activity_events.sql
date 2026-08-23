CREATE TABLE `activity_events` (
  `id` text PRIMARY KEY NOT NULL,
  `event_id` text NOT NULL,
  `action` text NOT NULL,
  `source` text DEFAULT 'direct' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_activity_event_created` ON `activity_events` (`event_id`,`created_at`);
