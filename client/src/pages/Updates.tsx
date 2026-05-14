import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CATEGORY_LABELS: Record<string, string> = {
  "ai-context":  "AI & Context",
  "gtm-sales":   "GTM / Sales",
  "a16z":        "a16z Speedrun",
  "research":    "Research",
  "product":     "Product",
  "general":     "General",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function CompanyAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = ((hash * 31) + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-serif font-semibold shrink-0 select-none"
      style={{
        width: size, height: size,
        background: `oklch(0.93 0.02 ${hue})`,
        color: `oklch(0.32 0.04 ${hue})`,
        fontSize: Math.max(11, Math.round(size * 0.42)),
      }}
    >
      {letter}
    </span>
  );
}

function FilterChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="transition-colors focus-ring"
      style={{
        padding: "4px 12px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        border: "1px solid",
        borderColor: active ? "rgb(var(--ink-text))" : "rgb(var(--ink-line))",
        background: active ? "rgb(var(--ink-text))" : "transparent",
        color: active ? "rgb(var(--ink-bg))" : "rgb(var(--ink-muted))",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function PostBody({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const LINE_HEIGHT_EM = 1.65;
  const LINES = 4;
  const COLLAPSE_H = `${LINE_HEIGHT_EM * LINES}em`;

  return (
    <div>
      <div
        style={{
          maxHeight: expanded ? "none" : COLLAPSE_H,
          overflow: "hidden",
          position: "relative",
          maskImage: expanded
            ? "none"
            : `linear-gradient(to bottom, #000 ${Math.round(LINE_HEIGHT_EM * (LINES - 1.2) / (LINE_HEIGHT_EM * LINES) * 100)}%, transparent 100%)`,
          WebkitMaskImage: expanded
            ? "none"
            : `linear-gradient(to bottom, #000 ${Math.round(LINE_HEIGHT_EM * (LINES - 1.2) / (LINE_HEIGHT_EM * LINES) * 100)}%, transparent 100%)`,
          lineHeight: LINE_HEIGHT_EM,
          fontSize: 13.5,
          color: "rgb(var(--ink-text))",
          whiteSpace: "pre-line",
        }}
      >
        {content}
      </div>
      {content.length > 260 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="focus-ring"
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: 500,
            color: "rgb(var(--ink-accent))",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const catLabel = CATEGORY_LABELS[post.category] ?? post.category ?? null;

  return (
    <article
      className="anim-fade-in"
      style={{
        padding: "20px 0",
        borderBottom: "1px solid rgb(var(--ink-line))",
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <CompanyAvatar name={post.authorName ?? post.companyId} size={36} />
        <div className="flex flex-col min-w-0 flex-1">
          {/* Name + badges + time */}
          <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgb(var(--ink-text))", letterSpacing: "-0.01em" }}>
              {post.authorName ?? post.companyId}
            </span>
            {/* Platform badge */}
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: "1px 7px",
                borderRadius: 4,
                background: post.platform === "linkedin"
                  ? "rgb(var(--ink-hair))"
                  : "rgb(var(--ink-hair))",
                color: post.platform === "linkedin"
                  ? "rgb(59 130 246 / 0.9)"
                  : "rgb(var(--ink-muted))",
                letterSpacing: "0.02em",
                textTransform: "capitalize",
              }}
            >
              {post.platform}
            </span>
            {catLabel && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  padding: "1px 7px",
                  borderRadius: 4,
                  background: "rgb(var(--ink-hair))",
                  color: "rgb(var(--ink-muted))",
                  letterSpacing: "0.01em",
                }}
              >
                {catLabel}
              </span>
            )}
            <span
              style={{
                fontSize: 11.5,
                color: "rgb(var(--ink-faint))",
                marginLeft: "auto",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {relativeTime(post.postedAt)}
            </span>
          </div>

          {/* Content */}
          <div style={{ marginTop: 6 }}>
            <PostBody content={post.content ?? ""} />
          </div>

          {/* Footer: engagement + link */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Like count */}
            {post.likeCount != null && (
              <span style={{ fontSize: 11.5, color: "rgb(var(--ink-faint))", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                </svg>
                {post.likeCount.toLocaleString()}
              </span>
            )}
            {/* Comment count */}
            {post.commentCount != null && (
              <span style={{ fontSize: 11.5, color: "rgb(var(--ink-faint))", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {post.commentCount.toLocaleString()}
              </span>
            )}
            {/* Share count */}
            {post.shareCount != null && (
              <span style={{ fontSize: 11.5, color: "rgb(var(--ink-faint))", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                {post.shareCount.toLocaleString()}
              </span>
            )}
            {/* Source type badge */}
            {post.sourceType === "person" && (
              <span style={{ fontSize: 10.5, fontWeight: 500, padding: "1px 7px", borderRadius: 4, background: "rgb(var(--ink-hair))", color: "rgb(var(--ink-muted))" }}>
                Individual
              </span>
            )}
            {/* View post link */}
            {post.postUrl && (
              <a
                href={post.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring"
                style={{ fontSize: 11.5, color: "rgb(var(--ink-faint))", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto" }}
                onMouseOver={e => (e.currentTarget.style.color = "rgb(var(--ink-accent))")}
                onMouseOut={e => (e.currentTarget.style.color = "rgb(var(--ink-faint))")}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View post
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

type SortOrder = "newest" | "oldest";

export default function Updates() {
  const { user, isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const { data: posts, isLoading, refetch } = trpc.competitors.getRecentPosts.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { mutate: runMonitoring } = trpc.competitors.runMonitoringJob.useMutation({
    onSuccess: () => { refetch(); setIsRefreshing(false); },
    onError: () => setIsRefreshing(false),
  });

  const handleRefresh = () => { setIsRefreshing(true); runMonitoring(); };

  const sources = useMemo(() => {
    if (!posts) return [];
    const seen = new Map<string, string>();
    for (const p of posts) {
      const key = p.companyId ?? p.personId ?? "unknown";
      if (!seen.has(key)) seen.set(key, p.authorName ?? key);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    const filtered = selectedCompany
      ? posts.filter(p => p.companyId === selectedCompany || p.personId === selectedCompany)
      : posts;
    return [...filtered].sort((a, b) => {
      const diff = new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
  }, [posts, selectedCompany, sortOrder]);

  // Last fetched time
  const lastFetched = useMemo(() => {
    if (!posts || posts.length === 0) return null;
    const latest = posts.reduce((a, b) =>
      new Date(a.fetchedAt) > new Date(b.fetchedAt) ? a : b
    );
    return relativeTime(latest.fetchedAt);
  }, [posts]);

  if (!isAuthenticated) {
    return (
      <div
        className="anim-fade-in flex flex-col items-center justify-center"
        style={{ minHeight: "60vh", gap: 12, textAlign: "center" }}
      >
        <p style={{ fontSize: 18, fontWeight: 600, color: "rgb(var(--ink-text))" }}>
          Sign in to view updates
        </p>
        <p style={{ fontSize: 14, color: "rgb(var(--ink-muted))" }}>
          You need to be signed in to view competitor updates.
        </p>
      </div>
    );
  }

  return (
    <div className="anim-fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* ── Heading ── */}
      <div style={{ marginBottom: 32 }}>
        <div className="flex items-start justify-between gap-4">
          <h1
            className="font-serif"
            style={{ fontSize: 34, fontWeight: 600, color: "rgb(var(--ink-text))", letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            Updates
          </h1>
          {user?.role === "admin" && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="focus-ring"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 500,
                border: "1px solid rgb(var(--ink-line))",
                background: "transparent",
                color: isRefreshing ? "rgb(var(--ink-faint))" : "rgb(var(--ink-muted))",
                cursor: isRefreshing ? "not-allowed" : "pointer",
                letterSpacing: "-0.01em",
                transition: "border-color 150ms, color 150ms",
              }}
            >
              {isRefreshing ? (
                <>
                  <svg className="spin-slow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Refreshing…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  Refresh now
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          marginBottom: 36,
          border: "1px solid rgb(var(--ink-line))",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* Total posts */}
        <div
          style={{
            padding: "18px 20px",
            background: "rgb(var(--ink-surface))",
            borderRight: "1px solid rgb(var(--ink-line))",
          }}
        >
          <div style={{ fontSize: 11, color: "rgb(var(--ink-faint))", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Total posts
          </div>
          {isLoading ? (
            <div style={{ height: 36, display: "flex", alignItems: "center" }}>
              <svg className="spin-slow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgb(var(--ink-faint))" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          ) : (
            <span className="font-serif" style={{ fontSize: 32, fontWeight: 600, color: "rgb(var(--ink-text))", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {posts?.length ?? 0}
            </span>
          )}
        </div>

        {/* Last updated */}
        <div
          style={{
            padding: "18px 20px",
            background: "rgb(var(--ink-surface))",
            borderRight: "1px solid rgb(var(--ink-line))",
          }}
        >
          <div style={{ fontSize: 11, color: "rgb(var(--ink-faint))", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Last updated
          </div>
          <span className="font-serif" style={{ fontSize: 20, fontWeight: 500, color: "rgb(var(--ink-text))", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {lastFetched ?? "Never"}
          </span>
        </div>

        {/* Monitoring */}
        <div
          style={{
            padding: "18px 20px",
            background: "rgb(var(--ink-surface))",
          }}
        >
          <div style={{ fontSize: 11, color: "rgb(var(--ink-faint))", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Monitoring
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
            <span className="relative inline-flex">
              <span className="w-2 h-2 rounded-full bg-green-500/90" />
              <span className="absolute inset-0 w-2 h-2 rounded-full bg-green-500/40 animate-ping" />
            </span>
            <span style={{ fontSize: 13, color: "rgb(var(--ink-text))", fontWeight: 500 }}>Active</span>
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: "rgb(var(--ink-faint))", marginTop: 4 }}>
            Daily · 9:00 UTC
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      {!isLoading && posts && posts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 24 }}>
          <FilterChip
            label="All"
            active={selectedCompany === null}
            onClick={() => setSelectedCompany(null)}
          />
          {sources.map(c => (
            <FilterChip
              key={c.id}
              label={c.name}
              active={selectedCompany === c.id}
              onClick={() => setSelectedCompany(selectedCompany === c.id ? null : c.id)}
            />
          ))}

          {/* Sort pill */}
          <div
            className="flex items-center gap-0.5 ml-auto"
            style={{
              border: "1px solid rgb(var(--ink-line))",
              borderRadius: 9999,
              padding: "3px 4px",
              background: "rgb(var(--ink-hair))",
              gap: 2,
            }}
          >
            {(["newest", "oldest"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortOrder(s)}
                className="focus-ring"
                style={{
                  padding: "3px 10px",
                  borderRadius: 9999,
                  fontSize: 11.5,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  border: "none",
                  background: sortOrder === s ? "rgb(var(--ink-bg))" : "transparent",
                  color: sortOrder === s ? "rgb(var(--ink-text))" : "rgb(var(--ink-faint))",
                  cursor: "pointer",
                  transition: "background 150ms, color 150ms",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Feed ── */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
          <svg className="spin-slow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgb(var(--ink-faint))" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div>
          {filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      ) : (
        <div style={{ textAlign: "center", paddingTop: 72, paddingBottom: 72 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgb(var(--ink-line))", margin: "0 auto 16px" }}>
            <path d="M22 13h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 4.84 2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-8.16A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.85.84Z" />
          </svg>
          <p style={{ fontSize: 15, fontWeight: 600, color: "rgb(var(--ink-text))", marginBottom: 6 }}>
            {selectedCompany ? "No posts from this company" : "No posts yet"}
          </p>
          <p style={{ fontSize: 13, color: "rgb(var(--ink-muted))" }}>
            {user?.role === "admin"
              ? "Click Refresh now to pull the latest posts."
              : "Check back after the daily monitoring job runs at 9:00 UTC."}
          </p>
        </div>
      )}
    </div>
  );
}
