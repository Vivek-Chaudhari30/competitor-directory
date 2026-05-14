import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ── Custom Switch ────────────────────────────────────────────────────────────
function Switch({
  checked,
  onCheckedChange,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className="focus-ring"
      style={{
        width: 42,
        height: 24,
        borderRadius: 9999,
        border: "none",
        padding: 3,
        background: checked ? "rgb(var(--ink-accent))" : "rgb(var(--ink-line))",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 200ms",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 3px rgb(0 0 0 / 0.2)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 200ms cubic-bezier(.4,0,.2,1)",
        }}
      />
    </button>
  );
}

// ── Profile row ──────────────────────────────────────────────────────────────
function ProfileRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 16,
        alignItems: "start",
        padding: "14px 0",
        borderBottom: "1px solid rgb(var(--ink-line))",
      }}
    >
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: "rgb(var(--ink-faint))",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <div>
        <span style={{ fontSize: 13.5, color: "rgb(var(--ink-text))", fontWeight: 500 }}>
          {value}
        </span>
        {note && (
          <p style={{ fontSize: 12, color: "rgb(var(--ink-faint))", marginTop: 3 }}>{note}</p>
        )}
      </div>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "rgb(var(--ink-faint))",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          border: "1px solid rgb(var(--ink-line))",
          borderRadius: 10,
          overflow: "hidden",
          background: "rgb(var(--ink-surface))",
          padding: "0 20px",
        }}
      >
        {children}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, isAuthenticated, logout } = useAuth();
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
      <div
        className="anim-fade-in flex flex-col items-center justify-center"
        style={{ minHeight: "60vh", gap: 12, textAlign: "center" }}
      >
        <p style={{ fontSize: 18, fontWeight: 600, color: "rgb(var(--ink-text))" }}>
          Sign in to manage settings
        </p>
        <p style={{ fontSize: 14, color: "rgb(var(--ink-muted))" }}>
          You need to be signed in to manage your settings.
        </p>
      </div>
    );
  }

  return (
    <div className="anim-fade-in" style={{ maxWidth: 600 }}>
      {/* ── Heading ── */}
      <h1
        className="font-serif"
        style={{
          fontSize: 34,
          fontWeight: 600,
          color: "rgb(var(--ink-text))",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          marginBottom: 36,
        }}
      >
        Settings
      </h1>

      {/* ── Profile ── */}
      <Section title="Account">
        <ProfileRow
          label="Name"
          value={user?.name || "Not set"}
        />
        <ProfileRow
          label="Email"
          value={user?.email || "Not set"}
          note="Daily digests are sent to this address."
        />
        <ProfileRow
          label="Sign-in"
          value={user?.loginMethod ? user.loginMethod.charAt(0).toUpperCase() + user.loginMethod.slice(1) : "GitHub"}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 16,
            alignItems: "start",
            padding: "14px 0",
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: "rgb(var(--ink-faint))",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              paddingTop: 1,
            }}
          >
            Role
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13.5,
              color: "rgb(var(--ink-text))",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "1px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                background: user?.role === "admin"
                  ? "rgb(var(--ink-accent) / 0.12)"
                  : "rgb(var(--ink-hair))",
                color: user?.role === "admin"
                  ? "rgb(var(--ink-accent))"
                  : "rgb(var(--ink-muted))",
              }}
            >
              {user?.role ?? "user"}
            </span>
          </span>
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications">
        <div style={{ padding: "20px 0" }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "rgb(var(--ink-text))", marginBottom: 4 }}>
                Daily Competitor Digest
              </p>
              <p style={{ fontSize: 13, color: "rgb(var(--ink-muted))", lineHeight: 1.55 }}>
                Receive a daily email at 9:00 UTC with new posts from all tracked competitors.
              </p>
              {!user?.email && (
                <p style={{ fontSize: 12, color: "rgb(214 120 47)", marginTop: 6 }}>
                  No email found on your account — sign in with GitHub to enable this.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0" style={{ paddingTop: 2 }}>
              {updateSettings.isPending && (
                <Loader2 style={{ width: 13, height: 13, color: "rgb(var(--ink-faint))", animation: "spin 1s linear infinite" }} />
              )}
              <Switch
                checked={emailEnabled}
                onCheckedChange={handleToggle}
                disabled={updateSettings.isPending || !user?.email}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Monitoring info ── */}
      <Section title="Monitoring">
        <ProfileRow label="Schedule" value="Daily at 9:00 UTC" />
        <ProfileRow
          label="Platforms"
          value="LinkedIn"
          note="Twitter/X scraping is currently unavailable due to API restrictions."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 16,
            alignItems: "start",
            padding: "14px 0",
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: "rgb(var(--ink-faint))",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              paddingTop: 4,
            }}
          >
            Status
          </span>
          <div className="flex items-center gap-2">
            <span className="relative inline-flex">
              <span className="w-2 h-2 rounded-full bg-green-500/90" />
              <span className="absolute inset-0 w-2 h-2 rounded-full bg-green-500/40 animate-ping" />
            </span>
            <span style={{ fontSize: 13.5, color: "rgb(var(--ink-text))", fontWeight: 500 }}>
              Active
            </span>
          </div>
        </div>
      </Section>

      {/* ── Sign out ── */}
      <section style={{ paddingTop: 8 }}>
        <button
          onClick={() => logout()}
          className="focus-ring"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            border: "1px solid rgb(var(--ink-line))",
            background: "transparent",
            color: "rgb(var(--ink-muted))",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "border-color 150ms, color 150ms",
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgb(239 68 68 / 0.5)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgb(239 68 68)";
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgb(var(--ink-line))";
            (e.currentTarget as HTMLButtonElement).style.color = "rgb(var(--ink-muted))";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </section>
    </div>
  );
}
