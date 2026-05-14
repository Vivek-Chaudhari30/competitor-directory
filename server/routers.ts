import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getRecentCompetitorPosts, getCompanies, addCompany, updateCompany, deleteCompany, updateUserSettings } from "./db";
import { runCompetitorMonitoringJob } from "./services/competitorMonitoring";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateSettings: protectedProcedure
      .input(z.object({ emailNotificationsEnabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await updateUserSettings(ctx.user!.openId, input);
        return { success: true };
      }),
  }),

  companies: router({
    list: publicProcedure.query(async () => {
      return getCompanies();
    }),

    add: protectedProcedure
      .input(z.object({
        id: z.string().min(1).max(64),
        name: z.string().min(1).max(255),
        category: z.enum(["ai-context", "gtm-sales", "a16z"]).default("ai-context"),
        description: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        linkedin: z.string().url(),
        twitter: z.string().url().optional().or(z.literal("")),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new Error("Only admins can add companies");
        const id = input.id || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const company = await addCompany({ ...input, id, isActive: true });
        return company;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        category: z.enum(["ai-context", "gtm-sales", "a16z"]).optional(),
        description: z.string().optional(),
        website: z.string().optional(),
        linkedin: z.string().url().optional(),
        twitter: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new Error("Only admins can update companies");
        const { id, ...data } = input;
        await updateCompany(id, data);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new Error("Only admins can delete companies");
        await deleteCompany(input.id);
        return { success: true };
      }),
  }),

  competitors: router({
    getRecentPosts: protectedProcedure.query(async () => {
      // Returns every post ever collected, ordered by postedAt desc.
      // The DB is the source of truth — no time window applied.
      return getRecentCompetitorPosts();
    }),

    runMonitoringJob: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Only admins can trigger monitoring jobs");
      await runCompetitorMonitoringJob();
      return { success: true, message: "Monitoring job started" };
    }),
  }),
});

export type AppRouter = typeof appRouter;
