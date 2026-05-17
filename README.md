# Competitor Directory

Competitor Directory is a full-stack competitor intelligence application for tracking companies and people, collecting recent social activity, and delivering daily digest updates.

It combines:
- A **directory UI** for companies and people
- A **monitoring pipeline** that fetches competitor posts
- A **scheduled job endpoint** for automated daily runs
- **Email digests** for subscribed users

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [Running the App](#running-the-app)
- [Scripts](#scripts)
- [Authentication and Authorization](#authentication-and-authorization)
- [Monitoring and Scheduling](#monitoring-and-scheduling)
- [Email Digest Flow](#email-digest-flow)
- [API Surface](#api-surface)
- [Frontend Pages](#frontend-pages)
- [Deployment](#deployment)
- [Testing and Validation](#testing-and-validation)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project helps teams monitor selected competitors and key individuals (e.g., founders/executives) from social platforms, then centralize updates in one place.

Core behavior:
1. Track competitor companies and people in the directory.
2. Periodically fetch latest LinkedIn posts.
3. Store unique posts in MySQL.
4. Display posts on the Updates feed.
5. Send daily digest emails to users who enabled notifications.

---

## Key Features

- **Directory Management**
  - Track companies and people
  - Categorize companies (`ai-context`, `gtm-sales`, `a16z`)
  - Admin CRUD controls for companies/people
- **Updates Feed**
  - Unified timeline of collected posts
  - Filter by source (company/person)
  - Sort newest/oldest
  - Engagement metrics when available (likes/comments/shares)
- **Scheduled Monitoring**
  - Daily monitoring endpoint at `/api/scheduled/competitor-monitoring`
  - Supports external cron (GitHub Actions + bearer secret)
  - Supports Manus heartbeat cron path
- **Notifications**
  - Daily digest emails via Resend when enabled
  - User-level email notification toggle in settings
- **Auth**
  - OAuth callback support
  - GitHub OAuth support
  - Role-based admin controls (`user` / `admin`)

---

## Tech Stack

- **Frontend**
  - React 19 + TypeScript
  - Vite
  - Wouter routing
  - tRPC client + React Query
  - Tailwind-based UI primitives
- **Backend**
  - Node.js + Express
  - tRPC server
  - Axios for external API calls
- **Database**
  - MySQL
  - Drizzle ORM + Drizzle Kit
- **Infra/Delivery**
  - Railway (deploy target)
  - GitHub Actions scheduled workflow
  - Nixpacks build config
- **Email**
  - Resend API

---

## Architecture

High-level components:

- `client/`: SPA frontend
- `server/`: Express API, tRPC router, auth, scheduler handler, monitoring services
- `drizzle/`: database schema and migration artifacts
- `shared/`: shared constants and types

Main runtime entry:
- Server: `server/_core/index.ts`
- Client: `client/src/main.tsx`

Request flow:
1. Browser calls tRPC endpoint (`/api/trpc`) for directory/update/settings data.
2. Server reads/writes MySQL using Drizzle-backed data functions.
3. Scheduled endpoint triggers monitoring service.
4. Monitoring service fetches posts, stores uniques, and sends digests.

---

## Repository Structure

```text
client/
  src/
    pages/             # Directory, Updates, Settings pages
    components/        # UI and layout components
server/
  _core/               # server bootstrap, auth, env, SDK, cookies
  services/            # competitor monitoring + email integrations
  handlers/            # scheduled endpoint handlers
  db.ts                # DB access and startup migrations
  routers.ts           # tRPC router definitions
drizzle/
  schema.ts            # canonical table definitions
.github/workflows/
  daily-monitoring.yml # scheduled workflow trigger
```

---

## Getting Started

### Prerequisites

- Node.js **>= 22** (required by project engines)
- pnpm (Corepack recommended)
- MySQL database

### Install

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm install
```

---

## Environment Variables

Configure these variables before running in production-like mode:

### Required/Important
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - session signing secret
- `VITE_APP_ID` - app identifier used in login URL generation
- `VITE_OAUTH_PORTAL_URL` - OAuth portal base URL

### Auth
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID` (owner mapped to admin role if matched)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (default: `http://localhost:3000/api/auth/github/callback`)

### Scheduled job security
- `CRON_SECRET` (required for bearer-auth scheduled trigger path)

### Monitoring integrations
- `APIFY_API_KEY` (required for live Apify actor calls)

### Email
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `APP_URL`

### Internal integration
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

### Optional frontend analytics placeholders
If your `index.html` references them, define:
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

---

## Database and Migrations

Canonical schema is in:
- `drizzle/schema.ts`

Primary tables:
- `users`
- `companies`
- `people`
- `competitor_posts`
- `notifications`
- `task_logs`

Startup migration behavior:
- Server boot calls `runMigrations()` in `server/db.ts`
- Migration SQL is applied idempotently at startup

Drizzle command-based migration path:
```bash
pnpm run db:push
```

---

## Running the App

### Development

```bash
pnpm run dev
```

Runs server in development mode with Vite integration.

### Production build

```bash
pnpm run build
pnpm run start
```

---

## Scripts

From `package.json`:

- `pnpm run dev` - start local development server
- `pnpm run build` - build frontend and bundle server to `dist/`
- `pnpm run start` - run production server from `dist/index.js`
- `pnpm run check` - TypeScript type check (`tsc --noEmit`)
- `pnpm run test` - run Vitest suite
- `pnpm run format` - format repository with Prettier
- `pnpm run db:push` - generate + apply Drizzle migrations

---

## Authentication and Authorization

Supported paths:

- OAuth callback route:
  - `GET /api/oauth/callback`
- GitHub OAuth routes:
  - `GET /api/auth/github`
  - `GET /api/auth/github/callback`

Session:
- Session cookie name: `app_session_id`
- Cookie TTL default: 1 year

Roles:
- `admin` users can:
  - Add/update/remove companies
  - Add/update/remove people
  - Manually trigger monitoring job
- `user` users can browse/read and manage personal notification settings

Development helper:
- Non-production path: `POST /api/auth/dev-login`

---

## Monitoring and Scheduling

Scheduled endpoint:
- `POST /api/scheduled/competitor-monitoring`

Auth modes:
1. **Bearer mode** (for GitHub Actions/external cron)
   - `Authorization: Bearer <CRON_SECRET>`
2. **Manus heartbeat mode**
   - validated through SDK cron auth path

Workflow file:
- `.github/workflows/daily-monitoring.yml`
- Cron schedule: `0 9 * * *` (daily at 9:00 UTC)

Monitoring service:
- `server/services/competitorMonitoring.ts`
- Pulls tracked companies/people
- Fetches LinkedIn posts via Apify actors
- Stores deduplicated posts (`postId` unique)
- Sends digest emails to enabled users with email addresses

---

## Email Digest Flow

Email service:
- `server/services/emailService.ts`
- Uses Resend when `RESEND_API_KEY` is configured
- If key is missing, logs and skips actual sending

Digest contents:
- Up to 20 latest fetched posts in email body
- Author, platform, date, excerpt, and link to original post
- Settings link for notification control

---

## API Surface

tRPC router: `server/routers.ts`

### Auth
- `auth.me` (public query)
- `auth.logout` (public mutation)
- `auth.updateSettings` (protected mutation)

### Companies
- `companies.list` (public query)
- `companies.add` (protected admin mutation)
- `companies.update` (protected admin mutation)
- `companies.remove` (protected admin mutation)

### People
- `people.list` (public query)
- `people.add` (protected admin mutation)
- `people.update` (protected admin mutation)
- `people.remove` (protected admin mutation)

### Competitors
- `competitors.getRecentPosts` (protected query)
- `competitors.runMonitoringJob` (protected admin mutation)

---

## Frontend Pages

- `/` — **Directory**
  - Companies and People tabs
  - Search and filtering
  - Admin add/edit/remove flows
- `/updates` — **Updates**
  - Timeline of monitored posts
  - Source filter and sort controls
  - Admin-triggered refresh action
- `/settings` — **Settings**
  - Account details
  - Email digest toggle
  - Monitoring schedule/status summary

---

## Deployment

Configured for Railway + Nixpacks:
- `railway.json`
- `nixpacks.toml`

Build/start:
- Build: `pnpm run build`
- Start: `node dist/index.js`

Health check path:
- `/`

---

## Testing and Validation

Standard commands:

```bash
pnpm run check
pnpm run test
pnpm run build
```

Note: at the time of this update, type-check and build pass, while existing tests in `server/services/competitorMonitoring.test.ts` fail due to pre-existing mismatches with current service behavior.

---

## Known Limitations

- Twitter/X scraping is currently skipped in monitoring service.
- Email sending requires `RESEND_API_KEY`; otherwise digest delivery is no-op.
- Some monitoring behavior depends on external APIs/services (Apify, OAuth providers).

---

## Troubleshooting

### Build warnings about analytics env vars
If you see undefined `%VITE_ANALYTICS_*%` placeholders during build, define:
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

### No posts in Updates
- Ensure tracking entries exist in `companies`/`people`
- Verify `APIFY_API_KEY` is set
- Trigger manual refresh as admin
- Check `task_logs` table for failures

### Scheduled endpoint returns 403
- Verify `CRON_SECRET` is set and matches caller header
- Confirm caller sends `Authorization: Bearer <secret>`

### No digest emails
- Verify `RESEND_API_KEY` and `EMAIL_FROM`
- Ensure user has an email and notifications enabled
- Confirm posts were inserted for that cycle

---

If you need a product-facing version of this README (shorter, with screenshots and quickstart only), you can keep this as `README.md` and add an additional `docs/` guide for operators and contributors.
