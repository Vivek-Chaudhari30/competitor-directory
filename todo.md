# Competitor Directory - Full Stack Upgrade TODO

## Phase 1: Database & Backend Setup
- [x] Resolve merge conflicts in Home.tsx and shared/const.ts
- [x] Create database schema for competitor posts and notifications
- [x] Set up tRPC procedures for fetching and storing competitor data
- [x] Configure database migration and apply schema

## Phase 2: Social Media Integration
- [x] Create backend service to aggregate competitor posts (simulated)
- [x] Store fetched posts in database with timestamps
- [ ] Implement LinkedIn post fetching (using LinkedIn API or scraping)
- [ ] Implement Twitter/X post fetching (using Twitter API)

## Phase 3: Scheduled Tasks
- [x] Set up daily scheduled task using Manus scheduler
- [x] Configure task to run competitor monitoring job daily
- [x] Implement error handling and retry logic for API calls
- [x] Add logging for scheduled task execution

## Phase 4: Email Notifications
- [x] Set up email notification system (basic template)
- [x] Create email template for competitor updates
- [ ] Configure email delivery service (SendGrid/AWS SES integration)
- [ ] Test email notifications

## Phase 5: Frontend Updates
- [x] Restore competitor directory UI components
- [x] Add competitor posts/updates display section
- [x] Create notifications page/dashboard
- [x] Add settings page for notification preferences
- [x] Display last update timestamp

## Phase 6: Testing & Deployment
- [x] Write vitest tests for backend procedures
- [x] Test scheduled task execution (Manus heartbeat created)
- [ ] Verify email notifications work correctly
- [x] Test full end-to-end workflow
- [x] Deploy and monitor in production
