import { eq, sql } from "drizzle-orm";
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
// Inline migrations — no file I/O so this works reliably inside Railway's container.
// Each step is idempotent: errors for "already exists / duplicate column" are swallowed.

// Drizzle wraps MySQL errors: the MySQL error code is on err.code or err.cause.code,
// NOT in err.message (which just says "Failed query: ...").
const IDEMPOTENT_CODES = new Set([
  "ER_DUP_FIELDNAME",      // column already exists
  "ER_TABLE_EXISTS_ERROR", // table already exists
  "ER_DUP_KEYNAME",        // index already exists
]);

async function runSql(db: ReturnType<typeof drizzle>, statement: string): Promise<void> {
  try {
    await db.execute(sql.raw(statement));
  } catch (err: any) {
    const code: string = err?.code ?? err?.cause?.code ?? "";
    const msg: string = (err?.message ?? "") + (err?.cause?.sqlMessage ?? "");
    if (IDEMPOTENT_CODES.has(code) || msg.includes("Duplicate column") || msg.includes("already exists")) {
      return; // already applied — safe to skip
    }
    throw err;
  }
}

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Migrations] No database — skipping");
    return;
  }

  try {
    console.log("[Migrations] Running startup migrations…");

    // ── 0001: companies table + emailNotificationsEnabled (already applied on existing DBs,
    //          but safe to re-run thanks to IF NOT EXISTS / idempotent runSql)
    await runSql(db, `
      CREATE TABLE IF NOT EXISTS companies (
        id varchar(64) NOT NULL,
        name varchar(255) NOT NULL,
        category enum('ai-context','gtm-sales','a16z') NOT NULL DEFAULT 'ai-context',
        description text,
        website varchar(500),
        linkedin varchar(500) NOT NULL,
        twitter varchar(500),
        isActive boolean NOT NULL DEFAULT true,
        createdAt timestamp NOT NULL DEFAULT (now()),
        updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT companies_id PRIMARY KEY (id)
      )
    `);
    await runSql(db, `ALTER TABLE users ADD COLUMN emailNotificationsEnabled boolean NOT NULL DEFAULT true`);

    // ── 0002: people table + engagement columns on competitor_posts
    await runSql(db, `
      CREATE TABLE IF NOT EXISTS people (
        id varchar(64) NOT NULL,
        name varchar(255) NOT NULL,
        title varchar(255),
        company varchar(255),
        linkedin varchar(500) NOT NULL,
        twitter varchar(500),
        notes text,
        isActive boolean NOT NULL DEFAULT true,
        createdAt timestamp NOT NULL DEFAULT (now()),
        updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT people_id PRIMARY KEY (id)
      )
    `);

    // Make companyId nullable (was NOT NULL)
    await runSql(db, `ALTER TABLE competitor_posts MODIFY COLUMN companyId varchar(64) DEFAULT NULL`);

    // New columns on competitor_posts — each individually so partial failures don't block the rest
    await runSql(db, `ALTER TABLE competitor_posts ADD COLUMN personId varchar(64) DEFAULT NULL AFTER companyId`);
    await runSql(db, `ALTER TABLE competitor_posts ADD COLUMN sourceType enum('company','person') NOT NULL DEFAULT 'company' AFTER personId`);
    await runSql(db, `ALTER TABLE competitor_posts ADD COLUMN likeCount int DEFAULT NULL`);
    await runSql(db, `ALTER TABLE competitor_posts ADD COLUMN commentCount int DEFAULT NULL`);
    await runSql(db, `ALTER TABLE competitor_posts ADD COLUMN shareCount int DEFAULT NULL`);

    console.log("[Migrations] ✓ All migrations applied");
  } catch (error) {
    console.error("[Migrations] Migration error (server will continue):", error);
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
    // `return await` (not just `return`) is required so the catch block actually
    // catches DB errors instead of forwarding a rejected promise to the caller.
    return await db.select().from(competitorPosts).orderBy(desc(competitorPosts.postedAt));
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
