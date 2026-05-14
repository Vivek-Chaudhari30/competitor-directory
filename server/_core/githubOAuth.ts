import type { Express, Request, Response } from "express";
import axios from "axios";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";

export function registerGitHubOAuthRoutes(app: Express) {
  // Step 1 — redirect user to GitHub
  app.get("/api/auth/github", (_req: Request, res: Response) => {
    if (!ENV.githubClientId) {
      return res.status(500).send("GitHub OAuth not configured (missing GITHUB_CLIENT_ID)");
    }
    const params = new URLSearchParams({
      client_id: ENV.githubClientId,
      redirect_uri: ENV.githubCallbackUrl,
      scope: "read:user user:email",
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  });

  // Step 2 — GitHub redirects back here with a code
  app.get("/api/auth/github/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;

    if (!code) {
      return res.status(400).send("Missing OAuth code from GitHub");
    }

    try {
      // Exchange code for access token
      const tokenRes = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: ENV.githubClientId,
          client_secret: ENV.githubClientSecret,
          code,
          redirect_uri: ENV.githubCallbackUrl,
        },
        { headers: { Accept: "application/json" } }
      );

      const accessToken = tokenRes.data.access_token as string;
      if (!accessToken) {
        return res.status(400).send("Failed to get access token from GitHub");
      }

      // Fetch user profile
      const [userRes, emailsRes] = await Promise.all([
        axios.get("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
        }),
        axios.get("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" },
        }),
      ]);

      const ghUser = userRes.data;
      const emails: Array<{ email: string; primary: boolean; verified: boolean }> = emailsRes.data;
      const primaryEmail = emails.find(e => e.primary && e.verified)?.email ?? emails[0]?.email ?? null;

      const openId = `github_${ghUser.id}`;

      await db.upsertUser({
        openId,
        name: ghUser.name ?? ghUser.login,
        email: primaryEmail,
        loginMethod: "github",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: ghUser.name ?? ghUser.login ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[GitHub OAuth] Callback failed:", error?.message);
      res.status(500).send("GitHub login failed. Please try again.");
    }
  });
}
