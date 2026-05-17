import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "../db";
import * as openaiService from "./openaiService";

vi.mock("../_core/env", () => ({
  ENV: {
    openaiApiKey: "test-key",
    aiReportEnabled: true,
    openaiModel: "gpt-4o-mini",
    openaiMaxTokens: 4096,
  },
}));

vi.mock("../db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../db")>();
  return {
    ...actual,
    createTaskLog: vi.fn(),
    updateTaskLog: vi.fn(),
    getPostsNotInAnyReport: vi.fn(),
    getAiReportForDate: vi.fn(),
    createAiReport: vi.fn(),
    updateAiReport: vi.fn(),
    linkReportPosts: vi.fn(),
    getCompanies: vi.fn(),
    getPeople: vi.fn(),
  };
});
vi.mock("./openaiService");

const { runDailyAiReportJob } = await import("./aiReportService");

describe("AI Report Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates skipped report when no unreported posts", async () => {
    vi.mocked(db.createTaskLog).mockResolvedValue({
      id: 1,
      taskName: "daily-ai-report",
      status: "running",
      postsFound: 0,
      emailsSent: 0,
      error: null,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(db.getPostsNotInAnyReport).mockResolvedValue([]);
    vi.mocked(db.getAiReportForDate).mockResolvedValue(null);
    vi.mocked(db.createAiReport).mockResolvedValue({
      id: 1,
      reportDate: new Date("2026-05-17T12:00:00.000Z"),
      status: "skipped",
      postCount: 0,
      summaryMarkdown: null,
      summaryJson: null,
      model: null,
      promptTokens: null,
      completionTokens: null,
      error: null,
      generatedAt: new Date(),
      createdAt: new Date(),
    });
    vi.mocked(db.updateTaskLog).mockResolvedValue(undefined);

    const result = await runDailyAiReportJob();

    expect(result.status).toBe("skipped");
    expect(db.createAiReport).toHaveBeenCalledWith(
      expect.objectContaining({ status: "skipped", postCount: 0 }),
    );
  });

  it("generates report and links posts on success", async () => {
    const mockPost = {
      id: 10,
      companyId: "glean",
      personId: null,
      sourceType: "company" as const,
      platform: "linkedin" as const,
      postId: "post-1",
      content: "We launched a new feature",
      authorName: "Glean",
      authorUrl: "https://linkedin.com/company/glean",
      postUrl: "https://linkedin.com/posts/1",
      postedAt: new Date(),
      fetchedAt: new Date(),
      likeCount: 5,
      commentCount: 1,
      shareCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.createTaskLog).mockResolvedValue({
      id: 1,
      taskName: "daily-ai-report",
      status: "running",
      postsFound: 0,
      emailsSent: 0,
      error: null,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(db.getPostsNotInAnyReport).mockResolvedValue([mockPost]);
    vi.mocked(db.createAiReport).mockResolvedValue({
      id: 2,
      reportDate: new Date("2026-05-17T12:00:00.000Z"),
      status: "generating",
      postCount: 1,
      summaryMarkdown: null,
      summaryJson: null,
      model: null,
      promptTokens: null,
      completionTokens: null,
      error: null,
      generatedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(db.getCompanies).mockResolvedValue([
      {
        id: "glean",
        name: "Glean",
        category: "ai-context",
        description: null,
        website: null,
        linkedin: "https://linkedin.com/company/glean",
        twitter: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    vi.mocked(db.getPeople).mockResolvedValue([]);
    vi.mocked(openaiService.generateCompetitorReport).mockResolvedValue({
      output: {
        executiveSummary: ["Glean launched a feature"],
        highlights: [],
        themes: [],
        worthWatching: [],
        lowSignalDay: false,
        summaryMarkdown: "# Report\n\nGlean update",
      },
      model: "gpt-4o-mini",
      promptTokens: 100,
      completionTokens: 50,
    });
    vi.mocked(db.updateAiReport).mockResolvedValue(undefined);
    vi.mocked(db.linkReportPosts).mockResolvedValue(undefined);
    vi.mocked(db.updateTaskLog).mockResolvedValue(undefined);

    const result = await runDailyAiReportJob();

    expect(result.status).toBe("success");
    expect(result.postCount).toBe(1);
    expect(openaiService.generateCompetitorReport).toHaveBeenCalled();
    expect(db.linkReportPosts).toHaveBeenCalledWith(2, [10]);
  });
});
