CREATE TABLE `companies` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('ai-context','gtm-sales','a16z') NOT NULL DEFAULT 'ai-context',
	`description` text,
	`website` varchar(500),
	`linkedin` varchar(500) NOT NULL,
	`twitter` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotificationsEnabled` boolean DEFAULT true NOT NULL;