import { Request, Response } from "express";
import { runCompetitorMonitoringJob } from "../services/competitorMonitoring";
import { sdk } from "../_core/sdk";
import { ENV } from "../_core/env";

/**
 * Scheduled handler for daily competitor monitoring.
 *
 * Supports two callers:
 *  - GitHub Actions: Authorization: Bearer <CRON_SECRET>
 *  - Manus heartbeat (legacy): Manus cron JWT in session cookie
 *
 * Endpoint: POST /api/scheduled/competitor-monitoring
 */
export async function scheduledCompetitorMonitoringHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const authHeader = req.headers.authorization ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (bearerToken) {
      // GitHub Actions / external cron path
      if (!ENV.cronSecret || bearerToken !== ENV.cronSecret) {
        return res.status(403).json({ error: "Invalid cron secret" });
      }
      taskUid = "github-actions";
    } else {
      // Manus heartbeat path — keep working on Manus
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }
      taskUid = user.taskUid;
    }

    console.log(`[Scheduled Handler] Competitor monitoring triggered by: ${taskUid}`);

    await runCompetitorMonitoringJob();

    res.json({
      ok: true,
      message: "Competitor monitoring job completed successfully",
      taskUid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[Scheduled Handler] Error:", error);
    res.status(500).json({ error: errorMessage, stack, context: { taskUid }, timestamp: new Date().toISOString() });
  }
}
