import { COMPETITORS } from "../../shared/const";
import { addCompetitorPost, createTaskLog, updateTaskLog, createNotification, getUserByOpenId } from "../db";
import { notifyOwner } from "../_core/notification";
import { ENV } from "../_core/env";

/**
 * Simulated social media post fetching
 * In production, this would integrate with LinkedIn API and Twitter API
 */
async function fetchCompetitorPosts() {
  const posts = [];

  for (const company of COMPETITORS) {
    // Simulate fetching posts from LinkedIn and Twitter
    // In production, this would call actual APIs

    // LinkedIn post example
    const linkedinPost = {
      companyId: company.id,
      platform: "linkedin" as const,
      postId: `${company.id}-linkedin-${Date.now()}`,
      content: `Latest update from ${company.name}: Advancing AI capabilities and enterprise solutions.`,
      authorName: company.founders?.[0]?.name || company.name,
      authorUrl: company.founders?.[0]?.linkedin || company.linkedin,
      postUrl: company.linkedin,
      postedAt: new Date(),
    };

    // Twitter post example
    const twitterPost = {
      companyId: company.id,
      platform: "twitter" as const,
      postId: `${company.id}-twitter-${Date.now()}`,
      content: `Excited to announce new features from ${company.name}! 🚀`,
      authorName: company.founders?.[0]?.name || company.name,
      authorUrl: company.founders?.[0]?.twitter || company.twitter,
      postUrl: company.twitter,
      postedAt: new Date(),
    };

    posts.push(linkedinPost, twitterPost);
  }

  return posts;
}

/**
 * Main competitor monitoring job - runs daily
 */
export async function runCompetitorMonitoringJob() {
  const startTime = new Date();
  const taskName = "daily-competitor-monitoring";

  console.log(`[${taskName}] Starting competitor monitoring job...`);

  try {
    // Create task log entry
    const taskLog = await createTaskLog({
      taskName,
      status: "running",
      startedAt: startTime,
    });

    if (!taskLog) {
      console.error(`[${taskName}] Failed to create task log`);
      return;
    }

    // Fetch competitor posts
    const posts = await fetchCompetitorPosts();
    console.log(`[${taskName}] Fetched ${posts.length} posts from competitors`);

    let postsAdded = 0;
    for (const post of posts) {
      const added = await addCompetitorPost(post);
      if (added) postsAdded++;
    }

    console.log(`[${taskName}] Successfully added ${postsAdded} posts to database`);

    // Get owner user
    const owner = await getUserByOpenId(ENV.ownerOpenId);

    if (owner && postsAdded > 0) {
      // Create notifications for new posts
      let emailsSent = 0;
      for (let i = 0; i < postsAdded; i++) {
        const notification = await createNotification({
          userId: owner.id,
          postId: i + 1, // In production, use actual post IDs
          emailStatus: "pending",
        });

        if (notification) {
          emailsSent++;
        }
      }

      console.log(`[${taskName}] Created ${emailsSent} notifications`);

      // Notify owner of the monitoring run
      await notifyOwner({
        title: "Daily Competitor Monitoring Complete",
        content: `Found ${postsAdded} new posts from ${COMPETITORS.length} competitors. ${emailsSent} notifications created.`,
      });
    }

    // Update task log with success
    await updateTaskLog(taskLog.id, {
      status: "success",
      postsFound: postsAdded,
      emailsSent: postsAdded,
      completedAt: new Date(),
    });

    console.log(`[${taskName}] Job completed successfully`);
  } catch (error) {
    console.error(`[${taskName}] Job failed:`, error);

    // Log error to database
    const taskLog = await createTaskLog({
      taskName,
      status: "failed",
      error: String(error),
      startedAt: startTime,
      completedAt: new Date(),
    });

    // Notify owner of failure
    await notifyOwner({
      title: "Daily Competitor Monitoring Failed",
      content: `Error: ${String(error)}`,
    });
  }
}

/**
 * Email notification service
 * In production, this would integrate with email service like SendGrid or AWS SES
 */
export async function sendCompetitorUpdateEmail(userEmail: string, posts: any[]) {
  console.log(`[Email Service] Preparing to send email to ${userEmail} with ${posts.length} competitor updates`);

  // In production, this would:
  // 1. Format posts into a nice email template
  // 2. Send via email service (SendGrid, AWS SES, etc.)
  // 3. Track delivery status

  const emailContent = `
    <h2>Daily Competitor Updates</h2>
    <p>Here are the latest posts from your competitors:</p>
    ${posts.map(post => `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
        <h3>${post.authorName}</h3>
        <p>${post.content}</p>
        <p><a href="${post.postUrl}">View Post</a></p>
      </div>
    `).join('')}
  `;

  console.log(`[Email Service] Email prepared for ${userEmail}`);

  return true;
}
