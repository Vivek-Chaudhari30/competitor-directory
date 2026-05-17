import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { Sidebar } from "./components/Sidebar";
import Home from "./pages/Home";
import Updates from "./pages/Updates";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/"         component={Home} />
      <Route path="/updates"  component={Updates} />
      <Route path="/reports"  component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/404"      component={NotFound} />
      <Route                  component={NotFound} />
    </Switch>
  );
}

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex" style={{ background: "rgb(var(--ink-bg))", color: "rgb(var(--ink-text))" }}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto max-w-[1100px] px-8 lg:px-12 py-12">
            <Router />
          </div>
        </main>
      </div>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
