CREATE TABLE `ai_daily_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` date NOT NULL,
	`status` enum('pending','generating','success','failed','skipped') NOT NULL,
	`postCount` int NOT NULL DEFAULT 0,
	`summaryMarkdown` text,
	`summaryJson` text,
	`model` varchar(64),
	`promptTokens` int,
	`completionTokens` int,
	`error` text,
	`generatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_daily_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_report_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_report_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_report_posts_report_post_unique` UNIQUE(`reportId`,`postId`)
);
