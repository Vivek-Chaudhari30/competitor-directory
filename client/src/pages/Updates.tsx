import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, ExternalLink, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Updates() {
  const { user, isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch recent competitor posts
  const { data: posts, isLoading, refetch } = trpc.competitors.getRecentPosts.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Manually trigger monitoring job (admin only)
  const { mutate: runMonitoring } = trpc.competitors.runMonitoringJob.useMutation({
    onSuccess: () => {
      refetch();
      setIsRefreshing(false);
    },
    onError: () => {
      setIsRefreshing(false);
    },
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    runMonitoring();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to view updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You need to be signed in to view competitor updates and manage notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Competitor Updates</h1>
              <p className="text-muted-foreground mt-2">
                Latest posts from your competitors across LinkedIn and Twitter
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              variant="outline"
              size="sm"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {posts?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-foreground">
                {posts && posts.length > 0
                  ? new Date(posts[0]?.fetchedAt).toLocaleDateString()
                  : "Never"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-foreground">Active (9:00 AM UTC)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-foreground">
                          {post.authorName}
                        </span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-muted-foreground px-2 py-1 rounded">
                          {post.platform}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-3 line-clamp-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Posted: {new Date(post.postedAt).toLocaleDateString()}
                        </span>
                        <span>
                          Fetched: {new Date(post.fetchedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-foreground font-medium mb-2">No posts yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Competitor posts will appear here once the daily monitoring job runs.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Next run: Daily at 9:00 AM UTC
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
