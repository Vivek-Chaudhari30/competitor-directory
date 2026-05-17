# Competitor Directory - Daily Monitoring System

## Overview

The Competitor Directory is a full-stack application that monitors your competitors' social media activity and sends you daily email updates. It tracks 6 competitors across LinkedIn and Twitter, automatically fetching new posts every day at 9:00 AM UTC.

## System Architecture

### Database Schema

**competitor_posts** - Stores all fetched posts from competitors
- `id`: Unique identifier
- `companyId`: Reference to competitor
- `platform`: "linkedin" or "twitter"
- `postId`: Platform-specific post ID
- `content`: Post text content
- `authorName`: Person who posted
- `authorUrl`: Link to author profile
- `postUrl`: Direct link to the post
- `postedAt`: When the post was published
- `fetchedAt`: When we fetched it
- `createdAt`, `updatedAt`: Timestamps

**notifications** - Tracks which posts have been sent to users
- `id`: Unique identifier
- `userId`: User who should receive notification
- `postId`: Reference to competitor_posts
- `emailSent`: When email was sent
- `emailStatus`: "pending", "sent", or "failed"
- `emailError`: Error message if failed
- `createdAt`, `updatedAt`: Timestamps

**task_logs** - Records scheduled task execution
- `id`: Unique identifier
- `taskName`: Name of the scheduled task
- `status`: "running", "success", or "failed"
- `postsCount`: How many posts were fetched
- `error`: Error message if failed
- `startedAt`, `completedAt`: Execution timestamps

### Backend Services

**competitorMonitoring.ts** - Core monitoring service
- `runCompetitorMonitoringJob()` - Main function that runs daily
  - Fetches posts from all competitors
  - Stores new posts in database
  - Creates notifications for the owner
  - Sends email summary
  
- `sendCompetitorUpdateEmail()` - Email notification service
  - Formats posts into HTML email
  - Sends to owner email address

### Scheduled Task

**Manus Heartbeat Scheduler**
- Task UID: `VLd5PoymimWnZWyqLeb5pB`
- Cron: `0 0 9 * * *` (Daily at 9:00 AM UTC)
- Endpoint: `/api/scheduled/competitor-monitoring`
- Handler: `scheduledCompetitorMonitoringHandler`

When triggered, the scheduler:
1. Authenticates as a cron task (GitHub Actions bearer or Manus cron JWT)
2. Calls `runCompetitorMonitoringJob()` (Apify → `competitor_posts`)
3. Calls `runDailyAiReportJob()` (OpenAI → `ai_daily_reports`) — failures are logged but do not fail the scrape
4. Returns success/error response with `aiReport` status
5. Logs execution in `task_logs` table

### AI Daily Reports

**Tables:** `ai_daily_reports`, `ai_report_posts` (junction for idempotency)

**Services:**
- `server/services/openaiService.ts` — OpenAI API (`OPENAI_API_KEY`)
- `server/services/aiReportService.ts` — `runDailyAiReportJob()` summarizes only posts not yet in any report

**Environment variables:**
- `OPENAI_API_KEY` — required for report generation
- `OPENAI_MODEL` — default `gpt-4o-mini`
- `AI_REPORT_ENABLED` — set `false` to skip AI step

**Frontend:** `/reports` — archive of daily AI summaries (auth required)

### Frontend Pages

**Home (/)** - Competitor Directory
- Searchable list of 6 competitors
- Filter by category (AI & Context, GTM/Sales, a16z)
- View company details, founders, and social profiles
- Direct links to LinkedIn and Twitter

**Updates (/updates)** - Competitor Posts Dashboard
- Displays latest posts from all competitors
- Shows post content, author, and platform
- Direct links to original posts
- "Refresh Now" button to manually trigger monitoring

**Reports (/reports)** - AI-Generated Daily Summaries
- Executive summary, highlights by company/person, themes
- Archive of past reports
- Admin "Generate report" triggers `runDailyAiReportJob()` manually
- Stats: Total posts, last updated, monitoring status

**Settings (/settings)** - Notification Preferences
- Email notification toggle
- Daily digest toggle
- Monitoring schedule info
- Companies monitored list
- Platforms monitored (LinkedIn & Twitter)

## API Endpoints

### tRPC Procedures

**competitors.getRecentPosts** (Protected)
- Returns: Array of recent competitor posts
- Used by: Updates page
- Requires: User authentication

**competitors.runMonitoringJob** (Protected, Admin only)
- Manually triggers the monitoring job
- Returns: Job result with post count
- Used by: Updates page "Refresh Now" button

### Scheduled Endpoint

**POST /api/scheduled/competitor-monitoring** (Cron only)
- Called by Manus scheduler daily at 9:00 AM UTC
- Authenticates using `sdk.authenticateRequest()`
- Runs the full monitoring workflow
- Returns: JSON response with status

## How It Works

### Daily Monitoring Flow

1. **9:00 AM UTC** - Manus scheduler triggers the endpoint
2. **Fetch Posts** - Service fetches posts from competitor accounts
3. **Store Data** - New posts saved to `competitor_posts` table
4. **Create Notifications** - Entries added to `notifications` table
5. **Send Email** - Email summary sent to owner
6. **Log Results** - Execution logged in `task_logs` table

### User Workflow

1. **Sign In** - User authenticates via Manus OAuth
2. **View Directory** - Browse all 6 competitors on home page
3. **Check Updates** - Visit Updates page to see latest posts
4. **Manage Settings** - Configure notification preferences
5. **Receive Emails** - Daily email at 9:00 AM UTC with new posts

## Competitors Monitored

| Company | Category | Founder | Location |
|---------|----------|---------|----------|
| Glean AI | AI & Context | Arvind Jain | Palo Alto, CA |
| Contextual AI | AI & Context | Douwe Kiela | Mountain View, CA |
| Context AI | AI & Context | Joseph Semrai | San Francisco, CA |
| Hockeystack | GTM / Sales | - | San Francisco, CA |
| Sentra | a16z Speedrun | Ashwin Gopinath, Andrey Starenky | San Francisco, CA |
| Meridian | a16z Speedrun | Kashyap Nathan, Chris Farrington | San Francisco, CA |

## Testing

### Run Tests
```bash
pnpm test
```

### Test Coverage
- **competitorMonitoring.test.ts** - Service tests
  - Job creation and post fetching
  - Error handling
  - Email formatting
  
- **auth.logout.test.ts** - Authentication tests
  - Session cookie clearing
  - Logout functionality

### Manual Testing

1. **Trigger Monitoring Job**
   - Go to Updates page
   - Click "Refresh Now" button
   - Verify posts appear in the list

2. **Check Database**
   - View competitor_posts table
   - View notifications table
   - View task_logs table

3. **Verify Scheduler**
   ```bash
   manus-heartbeat list
   manus-heartbeat logs --task-uid VLd5PoymimWnZWyqLeb5pB
   ```

## Configuration

### Scheduler Task UID
Stored in `.scheduler-config.json`:
```json
{
  "dailyCompetitorMonitoring": {
    "taskUid": "VLd5PoymimWnZWyqLeb5pB",
    "name": "daily-competitor-monitoring",
    "cron": "0 0 9 * * *",
    "path": "/api/scheduled/competitor-monitoring"
  }
}
```

### Environment Variables
- `DATABASE_URL` - MySQL connection string
- `BUILT_IN_FORGE_API_URL` - Manus API endpoint
- `BUILT_IN_FORGE_API_KEY` - Manus API key
- `JWT_SECRET` - Session signing secret

## Deployment

### Prerequisites
- Node.js 22+
- MySQL database
- Manus account with API access

### Deploy Steps
1. Save checkpoint
2. Click "Publish" button in Management UI
3. Wait for deployment to complete
4. Verify scheduler is active

### Post-Deployment
- Monitor `/api/scheduled/competitor-monitoring` responses
- Check task_logs table for execution records
- Verify emails are being sent
- Monitor database growth

## Future Enhancements

### Real API Integration
- LinkedIn API for authentic post fetching
- Twitter API v2 for real tweets
- Error handling and retry logic

### Advanced Features
- Sentiment analysis on competitor posts
- Competitor activity trends
- Custom alert rules
- Slack/Teams notifications
- Historical analytics dashboard

### Email Improvements
- SendGrid/AWS SES integration
- HTML email templates
- Unsubscribe management
- Email preference tracking

## Troubleshooting

### Scheduler Not Running
```bash
# Check if task exists
manus-heartbeat list

# View recent execution logs
manus-heartbeat logs --task-uid VLd5PoymimWnZWyqLeb5pB --with-body

# Manually trigger
manus-heartbeat update --task-uid VLd5PoymimWnZWyqLeb5pB --enable=true
```

### No Posts Appearing
1. Check `competitor_posts` table is populated
2. Verify `notifications` table has entries
3. Check `task_logs` for errors
4. Manually run monitoring job from Updates page

### Email Not Sending
1. Verify owner email is set in database
2. Check `notifications.emailStatus` in database
3. Review `task_logs` for error messages
4. Check email service configuration

## Support

For issues or questions:
1. Check the logs in `.manus-logs/` directory
2. Review task execution history: `manus-heartbeat logs --task-uid VLd5PoymimWnZWyqLeb5pB`
3. Verify database connectivity and schema
4. Check environment variables are set correctly
