-- Migration: add people table + engagement fields on competitor_posts
-- Safe to re-run: each statement checks for existence first via IF NOT EXISTS / IGNORE

-- 1. Create people table
CREATE TABLE IF NOT EXISTS `people` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` varchar(255),
  `company` varchar(255),
  `linkedin` varchar(500) NOT NULL,
  `twitter` varchar(500),
  `notes` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `people_id` PRIMARY KEY(`id`)
);

-- 2. Add personId column (nullable FK to people)
ALTER TABLE `competitor_posts`
  ADD COLUMN IF NOT EXISTS `personId` varchar(64) DEFAULT NULL AFTER `companyId`;

-- 3. Add sourceType column
ALTER TABLE `competitor_posts`
  ADD COLUMN IF NOT EXISTS `sourceType` enum('company','person') NOT NULL DEFAULT 'company' AFTER `personId`;

-- 4. Make companyId nullable (was NOT NULL)
ALTER TABLE `competitor_posts`
  MODIFY COLUMN `companyId` varchar(64) DEFAULT NULL;

-- 5. Add engagement metric columns
ALTER TABLE `competitor_posts`
  ADD COLUMN IF NOT EXISTS `likeCount` int DEFAULT NULL AFTER `fetchedAt`,
  ADD COLUMN IF NOT EXISTS `commentCount` int DEFAULT NULL AFTER `likeCount`,
  ADD COLUMN IF NOT EXISTS `shareCount` int DEFAULT NULL AFTER `commentCount`;
