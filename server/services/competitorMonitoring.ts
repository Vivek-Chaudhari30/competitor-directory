import axios from "axios";
import { COMPETITORS, Company } from "../../shared/const";
import { addCompetitorPost, createTaskLog, updateTaskLog, createNotification, getUserByOpenId } from "../db";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

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

async function fetchLinkedInPosts() {
  const linkedinUrls = COMPETITORS.map(c => c.linkedin);

  const items = await runApifyActor("harvestapi/linkedin-company-posts", {
    targetUrls: linkedinUrls,
    maxPosts: 5,
    postedLimit: "24h",
    scrapeReactions: false,
    scrapeComments: false,
  });

  return items.flatMap(item => {
    // Match result back to a company by comparing slugs in the URL
    const itemSlug = extractLinkedInCompanySlug(item.authorUrl ?? item.companyUrl ?? "");
    const company = COMPETITORS.find(c =>
      extractLinkedInCompanySlug(c.linkedin) === itemSlug ||
      c.linkedin.includes(itemSlug)
    );

    if (!company) return [];

    return [{
      companyId: company.id,
      platform: "linkedin" as const,
      // Use the real post URL as a stable dedup key
      postId: `linkedin-${item.id ?? item.activityId ?? item.postUrl ?? item.url}`,
      content: item.text ?? item.content ?? "",
      authorName: item.author?.name ?? item.authorName ?? company.name,
      authorUrl: item.author?.url ?? item.authorUrl ?? company.linkedin,
      postUrl: item.postUrl ?? item.url ?? company.linkedin,
      postedAt: new Date(item.postedAt ?? item.publishedAt ?? item.date ?? Date.now()),
    }];
  });
}

// ─── Twitter/X ────────────────────────────────────────────────────────────────

function twitterHandleFromUrl(url: string): string {
  return url.replace(/\/$/, "").split("/").pop()?.replace("@", "") ?? "";
}

async function fetchTwitterPosts() {
  const handles = COMPETITORS.map(c => twitterHandleFromUrl(c.twitter)).filter(Boolean);

  const items = await runApifyActor("pear_fight/twitter-scraper", {
    usernames: handles,
    maxTweets: 5,
    proxyConfig: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
  });

  return items.flatMap(item => {
    const handle = (item.user?.screen_name ?? item.username ?? "").toLowerCase();
    const company = COMPETITORS.find(c =>
      twitterHandleFromUrl(c.twitter).toLowerCase() === handle
    );

    if (!company) return [];

    const tweetId = item.id ?? item.id_str;
    return [{
      companyId: company.id,
      platform: "twitter" as const,
      postId: `twitter-${tweetId}`,
      content: item.text ?? item.full_text ?? "",
      authorName: item.user?.name ?? handle ?? company.name,
      authorUrl: `https://x.com/${handle}`,
      postUrl: item.url ?? (tweetId ? `https://x.com/${handle}/status/${tweetId}` : company.twitter),
      postedAt: new Date(item.created_at ?? item.createdAt ?? Date.now()),
    }];
  });
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

    // Fetch LinkedIn and Twitter posts in parallel
    const [linkedinPosts, twitterPosts] = await Promise.all([
      fetchLinkedInPosts(),
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

    const owner = await getUserByOpenId(ENV.ownerOpenId);

    if (owner && postsAdded > 0) {
      let notificationsCreated = 0;
      for (const postId of insertedPostIds) {
        const notification = await createNotification({
          userId: owner.id,
          postId,
          emailStatus: "pending",
        });
        if (notification) notificationsCreated++;
      }

      console.log(`[${taskName}] Created ${notificationsCreated} notifications`);

      await notifyOwner({
        title: "Daily Competitor Monitoring Complete",
        content: `Found ${postsAdded} new posts from ${COMPETITORS.length} competitors (${linkedinPosts.length} LinkedIn, ${twitterPosts.length} Twitter).`,
      });
    }

    if (taskLog) {
      await updateTaskLog(taskLog.id, {
        status: "success",
        postsFound: postsAdded,
        emailsSent: postsAdded,
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

    await notifyOwner({
      title: "Daily Competitor Monitoring Failed",
      content: `Error: ${String(error)}`,
    });
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
