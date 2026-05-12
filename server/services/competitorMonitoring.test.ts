import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCompetitorMonitoringJob, sendCompetitorUpdateEmail } from "./competitorMonitoring";
import * as db from "../db";
import * as notification from "../_core/notification";

// Mock dependencies
vi.mock("../db");
vi.mock("../_core/notification");

describe("Competitor Monitoring Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runCompetitorMonitoringJob", () => {
    it("should create a task log and process posts", async () => {
      const mockTaskLog = { id: 1, taskName: "daily-competitor-monitoring", status: "running" as const, startedAt: new Date() };
      const mockOwner = { id: 1, openId: "owner-123", email: "owner@example.com" };

      vi.mocked(db.createTaskLog).mockResolvedValue(mockTaskLog);
      vi.mocked(db.addCompetitorPost).mockResolvedValue({
        id: 1,
        companyId: "glean",
        platform: "linkedin",
        postId: "post-123",
        content: "Test post",
        authorName: "Test Author",
        authorUrl: "https://example.com",
        postUrl: "https://example.com/post",
        postedAt: new Date(),
        fetchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.getUserByOpenId).mockResolvedValue(mockOwner);
      vi.mocked(db.createNotification).mockResolvedValue({
        id: 1,
        userId: 1,
        postId: 1,
        emailSent: null,
        emailStatus: "pending",
        emailError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.updateTaskLog).mockResolvedValue(undefined);
      vi.mocked(notification.notifyOwner).mockResolvedValue(true);

      await runCompetitorMonitoringJob();

      expect(db.createTaskLog).toHaveBeenCalled();
      expect(db.addCompetitorPost).toHaveBeenCalled();
      expect(notification.notifyOwner).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const mockTaskLog = { id: 1, taskName: "daily-competitor-monitoring", status: "running" as const, startedAt: new Date() };
      const error = new Error("Test error");

      vi.mocked(db.createTaskLog).mockResolvedValue(mockTaskLog);
      vi.mocked(db.addCompetitorPost).mockRejectedValue(error);
      vi.mocked(notification.notifyOwner).mockResolvedValue(true);

      await runCompetitorMonitoringJob();

      expect(db.createTaskLog).toHaveBeenCalled();
      expect(notification.notifyOwner).toHaveBeenCalled();
    });
  });

  describe("sendCompetitorUpdateEmail", () => {
    it("should format and send email with competitor posts", async () => {
      const mockPosts = [
        {
          authorName: "Company A",
          content: "New update from Company A",
          postUrl: "https://linkedin.com/posts/123",
        },
        {
          authorName: "Company B",
          content: "Exciting announcement from Company B",
          postUrl: "https://twitter.com/posts/456",
        },
      ];

      const result = await sendCompetitorUpdateEmail("user@example.com", mockPosts);

      expect(result).toBe(true);
    });

    it("should handle empty post list", async () => {
      const result = await sendCompetitorUpdateEmail("user@example.com", []);

      expect(result).toBe(true);
    });
  });
});
