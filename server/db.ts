import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  competitorPosts, CompetitorPost, InsertCompetitorPost,
  notifications, Notification, InsertNotification,
  taskLogs, TaskLog, InsertTaskLog,
  companies, Company, InsertCompany,
  people, Person, InsertPerson,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import fs from "fs";
import path from "path";

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

// ─── Auto-migration on startup ────────────────────────────────────────────────
// Runs every pending SQL migration file in drizzle/ in filename order.
// Uses a simple `__migrations` table to track what's already been applied.

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Migrations] No database — skipping migrations");
    return;
  }

  try {
    // Ensure tracking table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS __migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        appliedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read all .sql files from drizzle/ folder, sorted by name
    const migrationsDir = path.resolve(process.cwd(), "drizzle");
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      // Check if already applied
      const rows: any[] = await db.execute(
        `SELECT id FROM __migrations WHERE filename = '${file}'`
      ) as any;
      const already = Array.isArray(rows[0]) ? rows[0].length > 0 : false;
      if (already) continue;

      console.log(`[Migrations] Applying ${file}…`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      // Split on Drizzle's statement-breakpoint marker OR semicolons
      const statements = sql
        .split(/-->.*statement-breakpoint|;/)
        .map(s => s.replace(/--[^\n]*/g, "").trim())
        .filter(Boolean);

      for (const stmt of statements) {
        await db.execute(stmt);
      }

      await db.execute(
        `INSERT IGNORE INTO __migrations (filename) VALUES ('${file}')`
      );
      console.log(`[Migrations] ✓ ${file}`);
    }

    console.log("[Migrations] All migrations up to date");
  } catch (error) {
    console.error("[Migrations] Migration failed:", error);
    // Don't crash the server — log and continue
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

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

// ─── People CRUD ──────────────────────────────────────────────────────────────

export async function getPeople(): Promise<Person[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(people).where(eq(people.isActive, true));
}

export async function addPerson(data: InsertPerson): Promise<Person | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(people).values(data);
    const result = await db.select().from(people).where(eq(people.id, data.id)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to add person:", error);
    return null;
  }
}

export async function updatePerson(id: string, data: Partial<InsertPerson>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(people).set(data).where(eq(people.id, id));
}

export async function deletePerson(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(people).set({ isActive: false }).where(eq(people.id, id));
}

// ─── Competitor posts ─────────────────────────────────────────────────────────

export async function addCompetitorPost(post: InsertCompetitorPost): Promise<CompetitorPost | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(competitorPosts).values(post);
    const inserted = await db
      .select()
      .from(competitorPosts)
      .where(eq(competitorPosts.id, Number(result[0].insertId)))
      .limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error: any) {
    // Duplicate postId — already stored from a previous run. Expected, skip silently.
    if (error?.code === "ER_DUP_ENTRY" || error?.message?.includes("Duplicate entry")) {
      return null;
    }
    console.error("[Database] Failed to add competitor post:", error);
    return null;
  }
}

export async function getRecentCompetitorPosts(_hours?: number): Promise<CompetitorPost[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { desc } = await import("drizzle-orm");
    // Return ALL stored posts ordered by postedAt desc — no time filter ever.
    return db.select().from(competitorPosts).orderBy(desc(competitorPosts.postedAt));
  } catch (error) {
    console.error("[Database] Failed to get competitor posts:", error);
    return [];
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(notification: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(notifications).values(notification);
    const inserted = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, Number(result[0].insertId)))
      .limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    return null;
  }
}

export async function updateNotificationStatus(
  notificationId: number,
  status: "pending" | "sent" | "failed",
  error?: string,
): Promise<void> {
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

// ─── Task logs ────────────────────────────────────────────────────────────────

export async function createTaskLog(log: InsertTaskLog): Promise<TaskLog | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(taskLogs).values(log);
    const inserted = await db
      .select()
      .from(taskLogs)
      .where(eq(taskLogs.id, Number(result[0].insertId)))
      .limit(1);
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
