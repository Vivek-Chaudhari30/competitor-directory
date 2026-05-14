import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BarChart3, Home as HomeIcon, LogOut, Settings as SettingsIcon } from "lucide-react";

export function Navigation() {
  const [location, navigate] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-lg text-foreground">CompDir</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <HomeIcon className="w-4 h-4" />
              Directory
            </Button>
            {isAuthenticated && (
              <>
                <Button
                  variant={location === "/updates" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/updates")}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Updates
                </Button>
                <Button
                  variant={location === "/settings" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/settings")}
                  className="gap-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
