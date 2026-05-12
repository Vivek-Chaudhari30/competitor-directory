CREATE TABLE `competitor_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`platform` enum('linkedin','twitter') NOT NULL,
	`postId` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`authorName` varchar(255),
	`authorUrl` text,
	`postUrl` text NOT NULL,
	`postedAt` timestamp NOT NULL,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitor_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `competitor_posts_postId_unique` UNIQUE(`postId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`emailSent` timestamp,
	`emailStatus` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`emailError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskName` varchar(255) NOT NULL,
	`status` enum('running','success','failed') NOT NULL,
	`postsFound` int DEFAULT 0,
	`emailsSent` int DEFAULT 0,
	`error` text,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
