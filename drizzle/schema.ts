import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Competitor posts table - stores social media posts from competitors
export const competitorPosts = mysqlTable("competitor_posts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  platform: mysqlEnum("platform", ["linkedin", "twitter"]).notNull(),
  postId: varchar("postId", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  authorName: varchar("authorName", { length: 255 }),
  authorUrl: text("authorUrl"),
  postUrl: text("postUrl").notNull(),
  postedAt: timestamp("postedAt").notNull(),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorPost = typeof competitorPosts.$inferSelect;
export type InsertCompetitorPost = typeof competitorPosts.$inferInsert;

// Notifications table - tracks which posts have been sent to the user
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  emailSent: timestamp("emailSent"),
  emailStatus: mysqlEnum("emailStatus", ["pending", "sent", "failed"]).default("pending").notNull(),
  emailError: text("emailError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Scheduled task logs - tracks when monitoring tasks run
export const taskLogs = mysqlTable("task_logs", {
  id: int("id").autoincrement().primaryKey(),
  taskName: varchar("taskName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["running", "success", "failed"]).notNull(),
  postsFound: int("postsFound").default(0),
  emailsSent: int("emailsSent").default(0),
  error: text("error"),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskLog = typeof taskLogs.$inferSelect;
export type InsertTaskLog = typeof taskLogs.$inferInsert;