CREATE TABLE `celebrations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`birthday` text NOT NULL,
	`age` integer,
	`sender` text NOT NULL,
	`blessing` text NOT NULL,
	`theme` text DEFAULT 'cherry' NOT NULL,
	`edit_token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`celebration_id` text NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`kind` text NOT NULL,
	`color` text NOT NULL,
	`sender_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_board_date` ON `messages` (`celebration_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `messages_sender_date` ON `messages` (`sender_hash`,`created_at`);