import { Request, Response } from "express";
import { runCompetitorMonitoringJob } from "../services/competitorMonitoring";
import { sdk } from "../_core/sdk";

/**
 * Scheduled handler for daily competitor monitoring
 * This endpoint is called by the Manus heartbeat scheduler
 * 
 * Endpoint: POST /api/scheduled/competitor-monitoring
 * Cron: 0 0 9 * * * (Daily at 9:00 AM UTC)
 */
export async function scheduledCompetitorMonitoringHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron task
    const user = await sdk.authenticateRequest(req);
    
    // Verify this is a cron request
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    console.log(`[Scheduled Handler] Competitor monitoring task triggered: ${user.taskUid}`);

    // Run the monitoring job
    await runCompetitorMonitoringJob();

    // Return success
    res.json({
      ok: true,
      message: "Competitor monitoring job completed successfully",
      taskUid: user.taskUid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error("[Scheduled Handler] Error in competitor monitoring:", error);

    // Return error in the format expected by the platform
    res.status(500).json({
      error: errorMessage,
      stack,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req)).taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
