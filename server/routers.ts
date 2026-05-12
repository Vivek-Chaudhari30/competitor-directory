import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getRecentCompetitorPosts } from "./db";
import { runCompetitorMonitoringJob } from "./services/competitorMonitoring";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  competitors: router({
    getRecentPosts: protectedProcedure.query(async () => {
      const posts = await getRecentCompetitorPosts(24);
      return posts;
    }),
    runMonitoringJob: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Only admins can trigger monitoring jobs');
      }

      await runCompetitorMonitoringJob();
      return { success: true, message: 'Monitoring job started' };
    }),
  }),
});

export type AppRouter = typeof appRouter;
