import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate saving preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to manage settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You need to be signed in to manage your notification preferences.
            </p>
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
          <p className="text-muted-foreground mt-2">
            Manage your notification preferences and monitoring settings
          </p>
        </div>

        {/* Account Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="text-foreground font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Name</Label>
              <p className="text-foreground font-medium">{user?.name || "Not set"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive email updates when competitors post new content
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-medium">Daily Digest</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get a daily summary of all competitor updates at 9:00 AM UTC
                  </p>
                </div>
                <Switch
                  checked={dailyDigest}
                  onCheckedChange={setDailyDigest}
                  disabled={!emailNotifications}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Schedule</Label>
              <p className="text-foreground font-medium">Daily at 9:00 AM UTC</p>
              <p className="text-sm text-muted-foreground mt-1">
                Competitor monitoring runs automatically every day
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Companies Monitored</Label>
              <p className="text-foreground font-medium">7 companies</p>
              <p className="text-sm text-muted-foreground mt-1">
                Glean AI, Contextual AI, Context AI, Hockeystack, Attio, Sentra, Meridian
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Platforms</Label>
              <p className="text-foreground font-medium">LinkedIn & Twitter</p>
              <p className="text-sm text-muted-foreground mt-1">
                Posts from both LinkedIn and Twitter are monitored
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
