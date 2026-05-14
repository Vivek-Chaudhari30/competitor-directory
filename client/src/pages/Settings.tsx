import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Bell, User, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [emailEnabled, setEmailEnabled] = useState(user?.emailNotificationsEnabled ?? true);
  const utils = trpc.useUtils();

  const updateSettings = trpc.auth.updateSettings.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const handleToggle = (value: boolean) => {
    setEmailEnabled(value);
    updateSettings.mutate({ emailNotificationsEnabled: value });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Sign in to manage settings</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You need to be signed in to manage your settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and notification preferences</p>
        </div>

        {/* Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-4 h-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Name</Label>
              <p className="text-foreground font-medium mt-1">{user?.name || "Not set"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
              <p className="text-foreground font-medium mt-1">{user?.email || "Not set"}</p>
              <p className="text-xs text-muted-foreground mt-1">This is the email we'll send daily digests to.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Role</Label>
              <p className="text-foreground font-medium mt-1 capitalize">{user?.role ?? "user"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-4 h-4" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <Label className="text-foreground font-medium">Daily Competitor Digest</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive a daily email at 9:00 AM UTC with new posts from all tracked competitors.
                  {!user?.email && (
                    <span className="block text-amber-600 mt-1">
                      ⚠ No email address found on your account. Sign in with GitHub to enable this.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {updateSettings.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <Switch
                  checked={emailEnabled}
                  onCheckedChange={handleToggle}
                  disabled={updateSettings.isPending || !user?.email}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-4 h-4" />
              Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Schedule</Label>
              <p className="text-foreground font-medium mt-1">Daily at 9:00 AM UTC</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Platforms</Label>
              <p className="text-foreground font-medium mt-1">LinkedIn</p>
              <p className="text-xs text-muted-foreground mt-1">Twitter/X scraping is currently unavailable due to API restrictions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
