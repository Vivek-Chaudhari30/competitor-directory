/**
 * Scheduled Tasks Configuration
 * 
 * This file defines all scheduled tasks for the competitor monitoring system.
 * Tasks are executed by the Manus scheduler at specified intervals.
 */

import { runCompetitorMonitoringJob } from "./services/competitorMonitoring";

/**
 * Daily Competitor Monitoring Task
 * Runs every day at 9:00 AM UTC
 * Fetches latest posts from competitor social media accounts
 */
export const dailyCompetitorMonitoring = {
  name: "daily-competitor-monitoring",
  schedule: "0 9 * * *", // Cron: Every day at 9:00 AM UTC
  handler: async () => {
    console.log("[Scheduled Task] Starting daily competitor monitoring...");
    try {
      await runCompetitorMonitoringJob();
      console.log("[Scheduled Task] Daily competitor monitoring completed successfully");
    } catch (error) {
      console.error("[Scheduled Task] Daily competitor monitoring failed:", error);
      throw error;
    }
  },
};

/**
 * Hourly Competitor Monitoring Task (Optional)
 * Uncomment to enable hourly monitoring
 * Runs every hour
 */
export const hourlyCompetitorMonitoring = {
  name: "hourly-competitor-monitoring",
  schedule: "0 * * * *", // Cron: Every hour
  handler: async () => {
    console.log("[Scheduled Task] Starting hourly competitor monitoring...");
    try {
      await runCompetitorMonitoringJob();
      console.log("[Scheduled Task] Hourly competitor monitoring completed successfully");
    } catch (error) {
      console.error("[Scheduled Task] Hourly competitor monitoring failed:", error);
      throw error;
    }
  },
};

// Export all scheduled tasks
export const scheduledTasks = [
  dailyCompetitorMonitoring,
  // hourlyCompetitorMonitoring, // Uncomment to enable
];
