import "dotenv/config";
import { sendDailyDigestEmailsBatch } from "./server/services/emailService";

// Mock a single post to test the layout and linkifying
const mockPosts = [
  {
    id: 1,
    companyId: 1,
    personId: null,
    sourceType: "company",
    platform: "linkedin",
    postId: "test-post-123",
    content: "We are thrilled to announce our new product launch! 🎉\n\nCheck out the full details and documentation here: https://example.com/launch \n\nLet us know what you think below!",
    authorName: "Acme Corp",
    authorUrl: "https://linkedin.com/company/acme",
    postUrl: "https://linkedin.com/posts/acme-123",
    postedAt: new Date(),
    likeCount: 156,
    commentCount: 24,
    shareCount: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Replace this with the email address where you want to receive the test
const mockSubscribers = [
  { email: "YOUR_EMAIL@EXAMPLE.COM", name: "Test User" }
];

async function runTest() {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Error: RESEND_API_KEY is not set in your environment or .env file.");
    process.exit(1);
  }

  console.log(`Sending test digest email to ${mockSubscribers[0].email}...`);
  
  const count = await sendDailyDigestEmailsBatch(mockSubscribers, mockPosts as any);
  
  if (count > 0) {
    console.log(`✅ Success! Email was sent via Resend.`);
  } else {
    console.log(`❌ Failed to send email. Check your Resend logs.`);
  }
}

runTest();
