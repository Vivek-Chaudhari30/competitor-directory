import { Resend } from "resend";
import { CompetitorPost } from "../../drizzle/schema";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "Competitor Directory <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL ?? "https://competitor-directory-production.up.railway.app";

export async function sendDailyDigestEmail(
  toEmail: string,
  toName: string,
  posts: CompetitorPost[]
): Promise<boolean> {
  if (!resend) {
    console.log(`[Email] RESEND_API_KEY not set — would have emailed ${toEmail} with ${posts.length} posts`);
    return false;
  }

  if (!toEmail || posts.length === 0) return false;

  const postRows = posts
    .slice(0, 20)
    .map(
      (p) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-weight:600;color:#1e293b;margin-bottom:4px;">${p.authorName ?? p.companyId}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:8px;">
          ${p.platform.toUpperCase()} · ${new Date(p.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div style="color:#374151;font-size:14px;line-height:1.5;">${(p.content ?? "").slice(0, 300)}${(p.content ?? "").length > 300 ? "…" : ""}</div>
        <a href="${p.postUrl}" style="display:inline-block;margin-top:8px;font-size:12px;color:#10b981;">View post →</a>
      </td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:24px 32px;">
            <div style="color:#10b981;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">CompDir</div>
            <div style="color:#fff;font-size:22px;font-weight:700;">Daily Competitor Update</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:4px;">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
          </td>
        </tr>
        <!-- Summary -->
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #f0f0f0;">
            <p style="margin:0;color:#374151;font-size:15px;">Hi ${toName || "there"},</p>
            <p style="color:#374151;font-size:15px;">Here are <strong>${posts.length} new post${posts.length !== 1 ? "s" : ""}</strong> from your tracked competitors:</p>
          </td>
        </tr>
        <!-- Posts -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${postRows}
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              You're receiving this because you enabled email notifications in
              <a href="${APP_URL}/settings" style="color:#10b981;">CompDir Settings</a>.
              <br>Turn off anytime from your settings page.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${posts.length} new competitor post${posts.length !== 1 ? "s" : ""} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }

    console.log(`[Email] Sent digest to ${toEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}
