import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, ExternalLink, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";

type SortOrder = "newest" | "oldest";

function PostCard({ post }: { post: any }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (post.content ?? "").length > 280;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{post.authorName}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                post.platform === "linkedin"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-sky-100 text-sky-700"
              }`}>
                {post.platform}
              </span>
            </div>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {expanded || !isLong ? post.content : `${(post.content ?? "").slice(0, 280)}…`}
            </p>

            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show more</>
                )}
              </button>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
              <span>Posted: {new Date(post.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span>Fetched: {new Date(post.fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          </div>

          <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

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

  // Build unique company list from posts
  const companies = useMemo(() => {
    if (!posts) return [];
    const seen = new Map<string, string>();
    for (const p of posts) {
      if (!seen.has(p.companyId)) seen.set(p.companyId, p.authorName ?? p.companyId);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    const filtered = selectedCompany ? posts.filter(p => p.companyId === selectedCompany) : posts;
    return [...filtered].sort((a, b) => {
      const diff = new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
  }, [posts, selectedCompany, sortOrder]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Sign in to view updates</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You need to be signed in to view competitor updates.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Competitor Updates</h1>
            <p className="text-muted-foreground mt-1">Latest posts from your competitors on LinkedIn</p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={handleRefresh} disabled={isRefreshing || isLoading} variant="outline" size="sm">
              {isRefreshing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Refreshing…</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Refresh Now</>
              )}
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{posts?.length ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-foreground">
                {posts && posts.length > 0
                  ? new Date(posts[0].fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Never"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Daily Monitoring</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm">Active (9:00 AM UTC)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {!isLoading && posts && posts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Company filter chips */}
            <div className="flex flex-wrap gap-2 flex-1">
              <button
                onClick={() => setSelectedCompany(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCompany === null
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground"
                }`}
              >
                All companies
              </button>
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(selectedCompany === c.id ? null : c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCompany === c.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-foreground font-medium mb-2">
                    {selectedCompany ? "No posts from this company yet" : "No posts yet"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === "admin"
                      ? "Click Refresh Now to pull the latest posts."
                      : "Check back after the daily monitoring job runs at 9:00 AM UTC."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
