import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ── tiny icon primitives ────────────────────────────────────────────────────
type IconProps = { size?: number; strokeWidth?: number; className?: string };

const Home = ({ size = 16, strokeWidth = 1.6, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
  </svg>
);
const Inbox = ({ size = 16, strokeWidth = 1.6, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M22 13h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 4.84 2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-8.16A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.85.84Z" />
  </svg>
);
const SettingsIcon = ({ size = 16, strokeWidth = 1.6, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" />
  </svg>
);
const Sun = ({ size = 13, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2m-14.07 7.07 1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const Moon = ({ size = 13, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);
const PanelLeftClose = ({ size = 15, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" /><path d="m16 15-3-3 3-3" />
  </svg>
);
const ChevronRight = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const SignOut = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
  </svg>
);

// ── Avatar (letter mark) ────────────────────────────────────────────────────
function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = ((hash * 31) + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-medium select-none shrink-0"
      style={{
        width: size, height: size,
        background: `oklch(0.93 0.02 ${hue})`,
        color: `oklch(0.32 0.04 ${hue})`,
        fontSize: Math.max(10, Math.round(size * 0.42)),
        letterSpacing: "0.01em",
      }}
    >
      {letter}
    </span>
  );
}

// ── Nav items ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: "/",         label: "Directory", Icon: Home },
  { path: "/updates",  label: "Updates",   Icon: Inbox },
  { path: "/settings", label: "Settings",  Icon: SettingsIcon },
];

// ── Sidebar ─────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, theme, onToggleTheme }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <aside
      className="shrink-0 border-r flex flex-col h-screen sticky top-0 transition-[width] duration-200 ease-out"
      style={{
        width: collapsed ? 64 : 244,
        background: "rgb(var(--ink-bg))",
        borderColor: "rgb(var(--ink-line))",
      }}
    >
      {/* Logo + collapse toggle */}
      <div
        className="flex items-center h-[60px] border-b"
        style={{
          borderColor: "rgb(var(--ink-line) / 0.7)",
          padding: collapsed ? "0 8px" : "0 16px",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        <div className={`flex items-center gap-2.5 select-none ${collapsed ? "justify-center" : ""}`}>
          <span
            className="inline-flex items-center justify-center rounded-[6px] text-white dark:text-ink-bg shrink-0 font-serif font-semibold"
            style={{ width: 26, height: 26, background: "rgb(var(--ink-accent))", fontSize: 14, lineHeight: 1 }}
          >
            C
          </span>
          {!collapsed && (
            <span className="flex flex-col leading-tight">
              <span className="font-serif text-[15px] tracking-tightish" style={{ color: "rgb(var(--ink-text))" }}>
                CompDir
              </span>
              <span className="text-[10.5px] tracking-[0.05em] uppercase" style={{ color: "rgb(var(--ink-faint))" }}>
                Competitor Directory
              </span>
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="h-7 w-7 rounded-[5px] flex items-center justify-center focus-ring transition-colors"
            style={{ color: "rgb(var(--ink-faint))" }}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 py-3" style={{ padding: collapsed ? "12px 8px" : "12px" }}>
        {!collapsed && (
          <div className="text-[10.5px] tracking-[0.08em] uppercase px-2.5 pb-1.5"
            style={{ color: "rgb(var(--ink-faint))" }}>
            Workspace
          </div>
        )}
        {NAV_ITEMS.map(({ path, label, Icon: IconComp }) => {
          const active = location === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="group w-full flex items-center gap-3 rounded-[7px] focus-ring transition-colors duration-150 tracking-tightish"
              style={{
                height: 36,
                padding: collapsed ? "0" : "0 10px",
                justifyContent: collapsed ? "center" : undefined,
                background: active ? "rgb(var(--ink-hair))" : undefined,
                color: active ? "rgb(var(--ink-text))" : "rgb(var(--ink-muted))",
              }}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
            >
              <span style={{ color: active ? "rgb(var(--ink-accent))" : undefined, display: "contents" }}>
                <IconComp
                  size={16}
                  strokeWidth={active ? 1.9 : 1.6}
                  className={active ? "" : "group-hover:text-ink-text"}
                />
              </span>
              {!collapsed && <span className="text-[13px]">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Monitoring status */}
      {!collapsed && (
        <div className="mx-3 mt-2 mb-1 px-2.5 py-2.5 rounded-[7px] border flex flex-col gap-1"
          style={{ borderColor: "rgb(var(--ink-line))" }}>
          <div className="flex items-center gap-1.5 text-[11px] tracking-tightish"
            style={{ color: "rgb(var(--ink-muted))" }}>
            <span className="relative inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/90" />
              <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500/40 animate-ping" />
            </span>
            <span>Monitoring active</span>
          </div>
          <div className="text-[11px] font-mono" style={{ color: "rgb(var(--ink-faint))" }}>
            Next sync · 9:00 UTC
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Footer: theme + user */}
      <div className="flex flex-col gap-2 py-3 border-t"
        style={{ borderColor: "rgb(var(--ink-line) / 0.7)", padding: collapsed ? "12px 8px" : "12px" }}>

        {/* Theme toggle */}
        {collapsed ? (
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 mx-auto rounded-[7px] flex items-center justify-center focus-ring transition-colors"
            style={{ color: "rgb(var(--ink-muted))" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2.5 h-9 rounded-[7px] border"
            style={{ borderColor: "rgb(var(--ink-line))" }}>
            <span className="text-[12px] tracking-tightish" style={{ color: "rgb(var(--ink-muted))" }}>
              Appearance
            </span>
            <div className="flex items-center gap-0.5 p-0.5 rounded-[5px]"
              style={{ background: "rgb(var(--ink-hair))" }}>
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => t !== theme && onToggleTheme()}
                  className="h-6 w-6 rounded-[4px] flex items-center justify-center transition-colors focus-ring"
                  style={{
                    background: theme === t ? "rgb(var(--ink-bg))" : "transparent",
                    color: theme === t ? "rgb(var(--ink-text))" : "rgb(var(--ink-faint))",
                  }}
                  aria-label={t}
                >
                  {t === "dark" ? <Moon size={13} /> : <Sun size={13} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User row */}
        {isAuthenticated && user ? (
          <div className={`flex items-center gap-2.5 rounded-[7px] ${collapsed ? "justify-center px-0 py-1" : "px-2 py-1.5"}`}>
            <Avatar name={user.name || user.email || "U"} size={collapsed ? 26 : 28} />
            {!collapsed && (
              <>
                <div className="flex flex-col min-w-0 leading-tight flex-1">
                  <span className="text-[12.5px] truncate tracking-tightish" style={{ color: "rgb(var(--ink-text))" }}>
                    {user.name || user.email}
                  </span>
                  <span className="text-[11px] truncate" style={{ color: "rgb(var(--ink-faint))" }}>
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-auto p-1.5 rounded-[5px] transition-colors focus-ring flex-shrink-0"
                  style={{ color: "rgb(var(--ink-faint))" }}
                  title="Sign out"
                >
                  <SignOut size={14} />
                </button>
              </>
            )}
          </div>
        ) : null}

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-9 h-8 mx-auto rounded-[6px] flex items-center justify-center focus-ring transition-colors"
            style={{ color: "rgb(var(--ink-faint))" }}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
