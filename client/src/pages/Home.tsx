import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ── Category helpers ────────────────────────────────────────────────────────
const CATEGORY_DISPLAY: Record<string, string> = {
  "ai-context": "AI & Context",
  "gtm-sales":  "GTM / Sales",
  "a16z":       "a16z Speedrun",
};
const CATEGORY_KEYS = ["ai-context", "gtm-sales", "a16z"] as const;

const CATEGORY_STYLES: Record<string, { light: { bg: string; color: string }; dark: { bg: string; color: string } }> = {
  "ai-context": {
    light: { bg: "rgba(56,90,138,0.09)",   color: "#3B5573" },
    dark:  { bg: "rgba(147,197,253,0.10)", color: "#9CC0F5" },
  },
  "gtm-sales": {
    light: { bg: "rgba(180,83,9,0.09)",    color: "#92520B" },
    dark:  { bg: "rgba(251,191,36,0.10)",  color: "#E0B070" },
  },
  "a16z": {
    light: { bg: "rgba(22,101,52,0.09)",   color: "#256A41" },
    dark:  { bg: "rgba(134,239,172,0.10)", color: "#8FCFA4" },
  },
};

function CategoryBadge({ category }: { category: string }) {
  const isDark = document.documentElement.classList.contains("dark");
  const style = CATEGORY_STYLES[category];
  const palette = style ? (isDark ? style.dark : style.light) : null;
  return (
    <span
      className="inline-flex items-center text-[10.5px] font-medium tracking-[0.04em] uppercase px-2 py-[3px] rounded-full whitespace-nowrap"
      style={palette
        ? { background: palette.bg, color: palette.color }
        : { background: "rgb(var(--ink-hair))", color: "rgb(var(--ink-muted))" }
      }
    >
      {CATEGORY_DISPLAY[category] ?? category}
    </span>
  );
}

// ── Small icon helpers ──────────────────────────────────────────────────────
const Globe = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18" />
    <path d="M12 3a13.5 13.5 0 0 1 0 18a13.5 13.5 0 0 1 0-18Z" />
  </svg>
);
const LinkedIn = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-13h4v2a4 4 0 0 1 2-2Z" />
    <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);
const Twitter = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 4.01s-2 .6-3.3 1c-.7-.8-1.7-1.3-2.9-1.3-2.2 0-4 1.8-4 4 0 .3 0 .6.1.9-3.3-.2-6.2-1.7-8.2-4.1-.4.6-.6 1.3-.6 2 0 1.4.7 2.6 1.8 3.3-.7 0-1.3-.2-1.8-.5v.1c0 1.9 1.4 3.6 3.2 3.9-.6.2-1.2.2-1.8.1.5 1.6 2 2.7 3.7 2.7-1.4 1.1-3.1 1.7-4.9 1.7H2c1.8 1.2 4 1.9 6.3 1.9 7.5 0 11.6-6.2 11.6-11.6v-.5C20.7 6 21.4 5.1 22 4.01Z" />
  </svg>
);
const Pencil = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
  </svg>
);
const Trash = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);
const Plus = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const Search = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);
const X = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const Loader = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="spin-slow" aria-hidden>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
  </svg>
);

// ── Company avatar ──────────────────────────────────────────────────────────
function CompanyAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border font-serif"
      style={{
        width: size, height: size,
        fontSize: Math.round(size * 0.5),
        background: "rgb(var(--ink-surface))",
        borderColor: "rgb(var(--ink-line))",
        color: "rgb(var(--ink-text))",
        lineHeight: 1,
      }}
    >
      {letter}
    </span>
  );
}

// ── FilterChip ──────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children, count }: {
  active: boolean; onClick: () => void; children: React.ReactNode; count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] tracking-tightish border transition-colors duration-150 focus-ring"
      style={active ? {
        background: "rgb(var(--ink-accent))",
        color: "white",
        borderColor: "rgb(var(--ink-accent))",
      } : {
        background: "transparent",
        color: "rgb(var(--ink-muted))",
        borderColor: "rgb(var(--ink-line))",
      }}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span className="text-[10.5px] font-mono" style={{ color: active ? "rgba(255,255,255,0.75)" : "rgb(var(--ink-faint))" }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Input ───────────────────────────────────────────────────────────────────
function Input({ value, onChange, placeholder }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string;
}) {
  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgb(var(--ink-faint))" }}>
        <Search />
      </div>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-9 border rounded-[7px] pl-9 pr-3 text-[13px] tracking-tightish transition-colors focus-ring focus:outline-none"
        style={{
          background: "transparent",
          borderColor: "rgb(var(--ink-line))",
          color: "rgb(var(--ink-text))",
        }}
      />
    </div>
  );
}

// ── Field + Textarea ────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] tracking-tightish" style={{ color: "rgb(var(--ink-muted))" }}>{label}</label>}
      {children}
      {hint && <div className="text-[11.5px]" style={{ color: "rgb(var(--ink-faint))" }}>{hint}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, autoFocus }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full h-9 border rounded-[7px] px-3 text-[13px] tracking-tightish transition-colors focus-ring focus:outline-none"
      style={{ background: "transparent", borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-text))" }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full border rounded-[7px] px-3 py-2 text-[13px] tracking-tightish leading-[1.6] resize-y transition-colors focus-ring focus:outline-none"
      style={{ background: "transparent", borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-text))" }}
    />
  );
}

// ── Company Dialog ──────────────────────────────────────────────────────────
type CompanyForm = { id: string; name: string; category: string; description: string; website: string; linkedin: string; twitter: string };
const emptyForm: CompanyForm = { id: "", name: "", category: "ai-context", description: "", website: "", linkedin: "", twitter: "" };
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function CompanyDialog({ open, initial, onClose, onSave, isSaving }: {
  open: boolean; initial?: CompanyForm | null; onClose: () => void;
  onSave: (d: CompanyForm) => void; isSaving: boolean;
}) {
  const [form, setForm] = useState<CompanyForm>(initial ?? emptyForm);
  const set = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // sync when initial changes
  useState(() => { if (open) setForm(initial ?? emptyForm); });
  const [, forceSync] = useState(0);
  useMemo(() => { if (open) { setForm(initial ?? emptyForm); forceSync(n => n + 1); } }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Company name is required");
    if (!form.linkedin.trim()) return toast.error("LinkedIn URL is required");
    onSave({ ...form, id: form.id || slugify(form.name) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 anim-overlay" onClick={onClose} />
      <div className="relative rounded-[12px] border w-full max-w-[480px] anim-modal"
        style={{ background: "rgb(var(--ink-bg))", borderColor: "rgb(var(--ink-line))" }}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-[20px] leading-[1.25] tracking-tightish" style={{ color: "rgb(var(--ink-text))" }}>
              {initial ? "Edit company" : "Add company"}
            </h2>
            <p className="text-[13px] leading-[1.55]" style={{ color: "rgb(var(--ink-muted))" }}>
              {initial ? "Update the company we're tracking." : "Track a new competitor's LinkedIn output."}
            </p>
          </div>
          <button onClick={onClose} className="p-1 -m-1 rounded focus-ring transition-colors" style={{ color: "rgb(var(--ink-faint))" }}>
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-5 pt-1 flex flex-col gap-3.5">
          <Field label="Company name">
            <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Linear" autoFocus />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_KEYS.map(c => (
                <FilterChip key={c} active={form.category === c} onClick={() => setForm(f => ({ ...f, category: c }))}>
                  {CATEGORY_DISPLAY[c]}
                </FilterChip>
              ))}
            </div>
          </Field>
          <Field label="Description" hint="1–2 lines. Pure prose, no marketing copy.">
            <Textarea value={form.description} onChange={set("description")} placeholder="What do they do and who is it for?" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Website">
              <TextInput value={form.website} onChange={set("website")} placeholder="example.com" />
            </Field>
            <Field label="LinkedIn URL">
              <TextInput value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/company/..." />
            </Field>
            <Field label="Twitter / X">
              <TextInput value={form.twitter} onChange={set("twitter")} placeholder="https://x.com/..." />
            </Field>
          </div>
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgb(var(--ink-hair))" }}>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 text-[13px] rounded-[7px] border tracking-tightish font-medium transition-colors focus-ring"
              style={{ borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-text))", background: "transparent" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-9 px-3.5 text-[13px] rounded-[7px] tracking-tightish font-medium transition-colors focus-ring inline-flex items-center justify-center gap-2"
              style={{ background: "rgb(var(--ink-accent))", color: "white" }}
            >
              {isSaving ? <Loader /> : null}
              {initial ? "Save changes" : "Add company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Dialog ───────────────────────────────────────────────────────────
function DeleteDialog({ company, onClose, onConfirm, isDeleting }: {
  company: CompanyForm | null; onClose: () => void; onConfirm: (c: CompanyForm) => void; isDeleting: boolean;
}) {
  if (!company) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 anim-overlay" onClick={onClose} />
      <div className="relative rounded-[12px] border w-full max-w-[420px] anim-modal"
        style={{ background: "rgb(var(--ink-bg))", borderColor: "rgb(var(--ink-line))" }}>
        <div className="px-6 pt-5 pb-3">
          <h2 className="font-serif text-[20px] leading-[1.25] tracking-tightish" style={{ color: "rgb(var(--ink-text))" }}>
            Remove {company.name}?
          </h2>
          <p className="text-[13px] leading-[1.55] mt-1" style={{ color: "rgb(var(--ink-muted))" }}>
            This stops daily monitoring and removes the company from your directory. Existing posts in Updates remain readable.
          </p>
        </div>
        <div className="px-6 pb-5 pt-2 flex items-center justify-end gap-2 border-t" style={{ borderColor: "rgb(var(--ink-hair))" }}>
          <button onClick={onClose}
            className="h-9 px-3.5 text-[13px] rounded-[7px] tracking-tightish font-medium transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-text))", background: "transparent" }}>
            Cancel
          </button>
          <button onClick={() => { onConfirm(company); onClose(); }} disabled={isDeleting}
            className="h-9 px-3.5 text-[13px] rounded-[7px] border tracking-tightish font-medium transition-colors focus-ring inline-flex items-center gap-2"
            style={{ borderColor: "rgb(var(--ink-line))", color: "#dc2626", background: "transparent" }}>
            {isDeleting ? <Loader /> : null}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Company Card ─────────────────────────────────────────────────────────────
function CompanyCard({ company, index, isAdmin, onEdit, onDelete }: {
  company: any; index: number; isAdmin: boolean;
  onEdit: (c: CompanyForm) => void; onDelete: (c: CompanyForm) => void;
}) {
  return (
    <div
      className="group relative flex flex-col gap-5 p-5 rounded-[10px] border transition-colors duration-150 anim-fade-up"
      style={{
        borderColor: "rgb(var(--ink-line))",
        animationDelay: `${Math.min(index, 12) * 30}ms`,
        background: "transparent",
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyAvatar name={company.name} />
          <div className="flex flex-col min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tightish truncate leading-tight" style={{ color: "rgb(var(--ink-text))" }}>
              {company.name}
            </h3>
            <span className="text-[11.5px] font-mono mt-0.5 truncate" style={{ color: "rgb(var(--ink-faint))" }}>
              {company.website}
            </span>
          </div>
        </div>
        <CategoryBadge category={company.category} />
      </div>

      {/* Description */}
      <p className="text-[13.5px] leading-[1.6] text-pretty" style={{ color: "rgb(var(--ink-muted))" }}>
        {company.description}
      </p>

      {/* Footer links */}
      <div className="mt-auto pt-1 flex items-center gap-3">
        {company.website && (
          <a href={company.website} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="Website">
            <Globe />
          </a>
        )}
        {company.linkedin && (
          <a href={company.linkedin} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="LinkedIn">
            <LinkedIn />
          </a>
        )}
        {company.twitter && (
          <a href={company.twitter} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="Twitter / X">
            <Twitter />
          </a>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit({ id: company.id, name: company.name, category: company.category ?? "ai-context", description: company.description ?? "", website: company.website ?? "", linkedin: company.linkedin, twitter: company.twitter ?? "" })}
            className="w-7 h-7 inline-flex items-center justify-center rounded-[5px] border transition-colors focus-ring backdrop-blur-[2px]"
            style={{ background: "rgb(var(--ink-bg) / 0.8)", borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-faint))" }}
            title="Edit"
          >
            <Pencil />
          </button>
          <button
            onClick={() => onDelete({ id: company.id, name: company.name, category: company.category ?? "ai-context", description: company.description ?? "", website: company.website ?? "", linkedin: company.linkedin, twitter: company.twitter ?? "" })}
            className="w-7 h-7 inline-flex items-center justify-center rounded-[5px] border transition-colors focus-ring backdrop-blur-[2px]"
            style={{ background: "rgb(var(--ink-bg) / 0.8)", borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-faint))" }}
            title="Delete"
          >
            <Trash />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Directory Page ───────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CompanyForm | null>(null);

  const utils = trpc.useUtils();
  const { data: dbCompanies = [], isLoading } = trpc.companies.list.useQuery();

  const addMutation = trpc.companies.add.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); setShowModal(false); toast.success("Company added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); setEditCompany(null); toast.success("Company updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.companies.remove.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); setConfirmDelete(null); toast.success("Company removed"); },
    onError: (e) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: dbCompanies.length };
    CATEGORY_KEYS.forEach(c => { m[c] = dbCompanies.filter(x => x.category === c).length; });
    return m;
  }, [dbCompanies]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dbCompanies.filter(c => {
      const inCat = activeCat === "All" || c.category === activeCat;
      const inQ = !q || c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [dbCompanies, query, activeCat]);

  const handleSave = (form: CompanyForm) => {
    if (editCompany) {
      updateMutation.mutate({ id: form.id, name: form.name, category: form.category as any, description: form.description || undefined, website: form.website || undefined, linkedin: form.linkedin, twitter: form.twitter || undefined });
    } else {
      addMutation.mutate({ id: form.id, name: form.name, category: form.category as any, description: form.description || undefined, website: form.website || undefined, linkedin: form.linkedin, twitter: form.twitter || undefined });
    }
  };

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <header className="flex items-end justify-between gap-6 flex-wrap mb-9">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-[36px] leading-[1.05] tracking-tightish" style={{ color: "rgb(var(--ink-text))" }}>
            Directory
          </h1>
          <p className="text-[14px] tracking-tightish" style={{ color: "rgb(var(--ink-muted))" }}>
            <span className="font-mono" style={{ color: "rgb(var(--ink-text))" }}>{dbCompanies.length}</span> companies tracked
            <span className="mx-2" style={{ color: "rgb(var(--ink-faint))" }}>·</span>
            updated daily at <span className="font-mono">9:00 UTC</span>
          </p>
        </div>
        <div className="w-[280px] max-w-full">
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search companies" />
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 mb-7 flex-wrap">
        <FilterChip active={activeCat === "All"} onClick={() => setActiveCat("All")} count={counts.All}>All</FilterChip>
        {CATEGORY_KEYS.map(c => (
          <FilterChip key={c} active={activeCat === c} onClick={() => setActiveCat(c)} count={counts[c]}>
            {CATEGORY_DISPLAY[c]}
          </FilterChip>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed rounded-[10px] py-16 text-center anim-fade-up"
          style={{ borderColor: "rgb(var(--ink-line))" }}>
          <div className="text-[14px] tracking-tightish mb-1" style={{ color: "rgb(var(--ink-text))" }}>No companies match.</div>
          <div className="text-[12.5px]" style={{ color: "rgb(var(--ink-muted))" }}>
            Try a different search or clear the category filter.
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pb-20">
          {filtered.map((c, i) => (
            <CompanyCard key={c.id} company={c} index={i} isAdmin={isAdmin}
              onEdit={setEditCompany} onDelete={setConfirmDelete} />
          ))}
        </div>
      )}

      {/* Floating add button */}
      {isAdmin && (
        <button
          onClick={() => { setEditCompany(null); setShowModal(true); }}
          className="fixed bottom-7 right-7 z-30 inline-flex items-center gap-1.5 h-10 pl-3.5 pr-4 rounded-full text-[13px] font-medium tracking-tightish transition-colors focus-ring"
          style={{ background: "rgb(var(--ink-text))", color: "rgb(var(--ink-bg))" }}
        >
          <Plus />
          Add company
        </button>
      )}

      <CompanyDialog
        open={showModal || !!editCompany}
        initial={editCompany}
        onClose={() => { setShowModal(false); setEditCompany(null); }}
        onSave={handleSave}
        isSaving={addMutation.isPending || updateMutation.isPending}
      />
      <DeleteDialog
        company={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={c => deleteMutation.mutate({ id: c.id })}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
