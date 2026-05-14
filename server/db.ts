import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, competitorPosts, notifications, taskLogs, companies, CompetitorPost, InsertCompetitorPost, Notification, InsertNotification, TaskLog, InsertTaskLog, InsertCompany, Company } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Competitor posts helpers
export async function addCompetitorPost(post: InsertCompetitorPost): Promise<CompetitorPost | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(competitorPosts).values(post);
    const inserted = await db.select().from(competitorPosts).where(eq(competitorPosts.id, Number(result[0].insertId))).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to add competitor post:", error);
    return null;
  }
}

export async function getRecentCompetitorPosts(hours: number = 24): Promise<CompetitorPost[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { gt } = await import('drizzle-orm');
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await db.select().from(competitorPosts).where(
      gt(competitorPosts.fetchedAt, cutoffTime)
    );
    return result;
  } catch (error) {
    console.error("[Database] Failed to get recent posts:", error);
    return [];
  }
}

// Notifications helpers
export async function createNotification(notification: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(notifications).values(notification);
    const inserted = await db.select().from(notifications).where(eq(notifications.id, Number(result[0].insertId))).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    return null;
  }
}

export async function updateNotificationStatus(notificationId: number, status: "pending" | "sent" | "failed", error?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(notifications).set({
      emailStatus: status,
      emailSent: status === "sent" ? new Date() : undefined,
      emailError: error || null,
    }).where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("[Database] Failed to update notification status:", error);
  }
}

// Task logs helpers
export async function createTaskLog(log: InsertTaskLog): Promise<TaskLog | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(taskLogs).values(log);
    const inserted = await db.select().from(taskLogs).where(eq(taskLogs.id, Number(result[0].insertId))).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create task log:", error);
    return null;
  }
}

export async function updateTaskLog(taskLogId: number, updates: Partial<TaskLog>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(taskLogs).set(updates).where(eq(taskLogs.id, taskLogId));
  } catch (error) {
    console.error("[Database] Failed to update task log:", error);
  }
}

// ─── User settings ────────────────────────────────────────────────────────────

export async function updateUserSettings(openId: string, settings: { emailNotificationsEnabled?: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(settings).where(eq(users.openId, openId));
}

export async function getUsersWithEmailEnabled(): Promise<typeof users.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.emailNotificationsEnabled, true));
}

// ─── Companies CRUD ───────────────────────────────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.isActive, true));
}

export async function addCompany(data: InsertCompany): Promise<Company | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(companies).values(data);
    const result = await db.select().from(companies).where(eq(companies.id, data.id)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to add company:", error);
    return null;
  }
}

export async function updateCompany(id: string, data: Partial<InsertCompany>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(companies).set(data).where(eq(companies.id, id));
}

export async function deleteCompany(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(companies).set({ isActive: false }).where(eq(companies.id, id));
}

export async function seedCompaniesIfEmpty(seedData: InsertCompany[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(companies).limit(1);
  if (existing.length > 0) return;
  for (const company of seedData) {
    await db.insert(companies).values(company).onDuplicateKeyUpdate({ set: { name: company.name } });
  }
}
