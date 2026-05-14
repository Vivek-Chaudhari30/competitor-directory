import axios from "axios";
import { getCompanies, addCompetitorPost, createTaskLog, updateTaskLog, getUsersWithEmailEnabled } from "../db";
import { sendDailyDigestEmail } from "./emailService";
import { ENV } from "../_core/env";
import type { Company } from "../../drizzle/schema";

// ─── Apify helpers ────────────────────────────────────────────────────────────

async function runApifyActor(actorId: string, input: object): Promise<any[]> {
  if (!ENV.apifyApiKey) {
    console.warn(`[Apify] APIFY_API_KEY not set — skipping ${actorId}`);
    return [];
  }

  try {
    const slug = actorId.replace("/", "~");
    const response = await axios.post(
      `https://api.apify.com/v2/acts/${slug}/run-sync-get-dataset-items`,
      input,
      {
        params: { token: ENV.apifyApiKey },
        headers: { "Content-Type": "application/json" },
        timeout: 5 * 60 * 1000, // actors can take up to 5 min
      }
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`[Apify] Actor ${actorId} failed:`, error);
    return [];
  }
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

function extractLinkedInCompanySlug(url: string): string {
  return url.replace(/\/$/, "").split("/").pop() ?? url;
}

async function fetchLinkedInPosts(trackedCompanies: Company[]) {
  const linkedinUrls = trackedCompanies.map(c => c.linkedin);

  const items = await runApifyActor("harvestapi/linkedin-company-posts", {
    targetUrls: linkedinUrls,
    maxPosts: 5,
    postedLimit: "week",
    scrapeReactions: false,
    scrapeComments: false,
  });

  return items.flatMap(item => {
    // author.linkedinUrl looks like "https://www.linkedin.com/company/gleanwork/posts"
    // strip trailing /posts before extracting the slug
    const rawAuthorUrl: string = item.author?.linkedinUrl ?? item.authorUrl ?? item.companyUrl ?? "";
    const cleanedAuthorUrl = rawAuthorUrl.replace(/\/posts\/?$/, "");
    const itemSlug = extractLinkedInCompanySlug(cleanedAuthorUrl);

    const company = trackedCompanies.find(c =>
      extractLinkedInCompanySlug(c.linkedin) === itemSlug ||
      c.linkedin.includes(itemSlug)
    );

    if (!company) return [];

    const postUrl: string = item.linkedinUrl ?? item.postUrl ?? item.url ?? company.linkedin;
    const postedAtRaw = item.postedAt?.date ?? item.postedAt ?? item.publishedAt ?? item.date;

    return [{
      companyId: company.id,
      platform: "linkedin" as const,
      postId: `linkedin-${item.id ?? item.activityId ?? postUrl}`,
      content: item.content ?? item.text ?? "",
      authorName: item.author?.name ?? item.authorName ?? company.name,
      authorUrl: cleanedAuthorUrl || company.linkedin,
      postUrl,
      postedAt: new Date(postedAtRaw ?? Date.now()),
    }];
  });
}

// ─── Twitter/X ────────────────────────────────────────────────────────────────

function twitterHandleFromUrl(url: string): string {
  return url.replace(/\/$/, "").split("/").pop()?.replace("@", "") ?? "";
}

async function fetchTwitterPosts() {
  // Twitter/X blocks Apify free-tier proxies — skip to avoid wasting time/credits
  console.log("[Twitter] Skipping Twitter scraping (X anti-scraping blocks free proxies)");
  return [];
}

// ─── Main job ─────────────────────────────────────────────────────────────────

export async function runCompetitorMonitoringJob() {
  const startTime = new Date();
  const taskName = "daily-competitor-monitoring";

  console.log(`[${taskName}] Starting competitor monitoring job...`);

  try {
    const taskLog = await createTaskLog({
      taskName,
      status: "running",
      startedAt: startTime,
    });

    if (!taskLog) {
      console.warn(`[${taskName}] No database — task log skipped, continuing job`);
    }

    // Load companies from DB
    const trackedCompanies = await getCompanies();
    console.log(`[${taskName}] Tracking ${trackedCompanies.length} companies`);

    // Fetch LinkedIn and Twitter posts in parallel
    const [linkedinPosts, twitterPosts] = await Promise.all([
      fetchLinkedInPosts(trackedCompanies),
      fetchTwitterPosts(),
    ]);

    const allPosts = [...linkedinPosts, ...twitterPosts];
    console.log(`[${taskName}] Fetched ${allPosts.length} posts (${linkedinPosts.length} LinkedIn, ${twitterPosts.length} Twitter)`);

    const insertedPostIds: number[] = [];
    for (const post of allPosts) {
      const added = await addCompetitorPost(post);
      if (added) insertedPostIds.push(added.id);
    }

    const postsAdded = insertedPostIds.length;
    console.log(`[${taskName}] Successfully added ${postsAdded} new posts to database`);

    if (postsAdded > 0) {
      const recentPosts = allPosts.filter((_, i) => insertedPostIds.length > 0);
      const subscribers = await getUsersWithEmailEnabled();
      let emailsSentCount = 0;

      for (const subscriber of subscribers) {
        if (!subscriber.email) continue;
        const sent = await sendDailyDigestEmail(subscriber.email, subscriber.name ?? "", recentPosts as any);
        if (sent) emailsSentCount++;
      }

      console.log(`[${taskName}] Sent digest emails to ${emailsSentCount}/${subscribers.length} subscribers`);
    }

    if (taskLog) {
      await updateTaskLog(taskLog.id, {
        status: "success",
        postsFound: postsAdded,
        completedAt: new Date(),
      });
    }

    console.log(`[${taskName}] Job completed successfully`);
  } catch (error) {
    console.error(`[${taskName}] Job failed:`, error);

    await createTaskLog({
      taskName,
      status: "failed",
      error: String(error),
      startedAt: startTime,
      completedAt: new Date(),
    });

    console.error(`[${taskName}] Monitoring failed:`, error);
  }
}

export async function sendCompetitorUpdateEmail(userEmail: string, posts: any[]) {
  console.log(`[Email Service] Preparing to send email to ${userEmail} with ${posts.length} competitor updates`);

  const emailContent = `
    <h2>Daily Competitor Updates</h2>
    <p>Here are the latest posts from your competitors:</p>
    ${posts.map(post => `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
        <h3>${post.authorName}</h3>
        <p>${post.content}</p>
        <p><a href="${post.postUrl}">View Post</a></p>
      </div>
    `).join("")}
  `;

  console.log(`[Email Service] Email prepared for ${userEmail}`);

  return true;
}
