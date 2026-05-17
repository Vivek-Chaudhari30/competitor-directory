import { z } from "zod";

export const dailyReportHighlightSchema = z.object({
  entityName: z.string(),
  entityType: z.enum(["company", "person"]),
  summary: z.string(),
  postUrls: z.array(z.string()),
});

export const dailyReportOutputSchema = z.object({
  executiveSummary: z.array(z.string()),
  highlights: z.array(dailyReportHighlightSchema),
  themes: z.array(z.string()),
  worthWatching: z.array(z.string()),
  lowSignalDay: z.boolean(),
  summaryMarkdown: z.string(),
});

export type DailyReportOutput = z.infer<typeof dailyReportOutputSchema>;

export function parseDailyReportOutput(raw: string): DailyReportOutput {
  const parsed = JSON.parse(raw);
  return dailyReportOutputSchema.parse(parsed);
}
