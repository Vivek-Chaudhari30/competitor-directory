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

// ── Icon primitives ─────────────────────────────────────────────────────────
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
const UserIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

// ── Shared sub-components ────────────────────────────────────────────────────
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
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
        fontSize: Math.max(11, Math.round(size * 0.44)),
      }}
    >
      {letter}
    </span>
  );
}

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

function SearchInput({ value, onChange, placeholder }: {
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
        style={{ background: "transparent", borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-text))" }}
      />
    </div>
  );
}

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

function AdminActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
      <button onClick={onEdit}
        className="w-7 h-7 inline-flex items-center justify-center rounded-[5px] border transition-colors focus-ring backdrop-blur-[2px]"
        style={{ background: "rgb(var(--ink-bg) / 0.8)", borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-faint))" }}
        title="Edit">
        <Pencil />
      </button>
      <button onClick={onDelete}
        className="w-7 h-7 inline-flex items-center justify-center rounded-[5px] border transition-colors focus-ring backdrop-blur-[2px]"
        style={{ background: "rgb(var(--ink-bg) / 0.8)", borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-faint))" }}
        title="Remove">
        <Trash />
      </button>
    </div>
  );
}

function ConfirmDeleteDialog({ name, noun, onClose, onConfirm, isDeleting }: {
  name: string; noun: string; onClose: () => void; onConfirm: () => void; isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 anim-overlay" onClick={onClose} />
      <div className="relative rounded-[12px] border w-full max-w-[420px] anim-modal"
        style={{ background: "rgb(var(--ink-bg))", borderColor: "rgb(var(--ink-line))" }}>
        <div className="px-6 pt-5 pb-3">
          <h2 className="font-serif text-[20px] leading-[1.25] tracking-tightish" style={{ color: "rgb(var(--ink-text))" }}>
            Remove {name}?
          </h2>
          <p className="text-[13px] leading-[1.55] mt-1" style={{ color: "rgb(var(--ink-muted))" }}>
            Stops monitoring this {noun}. Existing posts in Updates remain readable.
          </p>
        </div>
        <div className="px-6 pb-5 pt-2 flex items-center justify-end gap-2 border-t" style={{ borderColor: "rgb(var(--ink-hair))" }}>
          <button onClick={onClose}
            className="h-9 px-3.5 text-[13px] rounded-[7px] tracking-tightish font-medium transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-text))", background: "transparent" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="h-9 px-3.5 text-[13px] rounded-[7px] border tracking-tightish font-medium transition-colors focus-ring inline-flex items-center gap-2"
            style={{ borderColor: "rgb(var(--ink-line))", color: "#dc2626", background: "transparent" }}>
            {isDeleting ? <Loader /> : null} Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Company Section ──────────────────────────────────────────────────────────
type CompanyForm = { id: string; name: string; category: string; description: string; website: string; linkedin: string; twitter: string };
const emptyCompanyForm: CompanyForm = { id: "", name: "", category: "ai-context", description: "", website: "", linkedin: "", twitter: "" };
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function CompanyDialog({ open, initial, onClose, onSave, isSaving }: {
  open: boolean; initial?: CompanyForm | null; onClose: () => void;
  onSave: (d: CompanyForm) => void; isSaving: boolean;
}) {
  const [form, setForm] = useState<CompanyForm>(initial ?? emptyCompanyForm);
  const set = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  useMemo(() => { if (open) setForm(initial ?? emptyCompanyForm); }, [open, initial]);
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
              {initial ? "Update this competitor's details." : "Track a new competitor's LinkedIn output."}
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
          <Field label="Description" hint="1–2 lines. What do they do and who is it for?">
            <Textarea value={form.description} onChange={set("description")} placeholder="What do they do and who is it for?" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Website">
              <TextInput value={form.website} onChange={set("website")} placeholder="https://example.com" />
            </Field>
            <Field label="LinkedIn URL">
              <TextInput value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/company/..." />
            </Field>
            <Field label="Twitter / X">
              <TextInput value={form.twitter} onChange={set("twitter")} placeholder="https://x.com/..." />
            </Field>
          </div>
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgb(var(--ink-hair))" }}>
            <button type="button" onClick={onClose}
              className="h-9 px-3.5 text-[13px] rounded-[7px] border tracking-tightish font-medium transition-colors focus-ring"
              style={{ borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-text))", background: "transparent" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 h-9 px-3.5 text-[13px] rounded-[7px] tracking-tightish font-medium transition-colors focus-ring inline-flex items-center justify-center gap-2"
              style={{ background: "rgb(var(--ink-accent))", color: "white" }}>
              {isSaving ? <Loader /> : null}
              {initial ? "Save changes" : "Add company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanyCard({ company, index, isAdmin, onEdit, onDelete }: {
  company: any; index: number; isAdmin: boolean;
  onEdit: (c: CompanyForm) => void; onDelete: (c: CompanyForm) => void;
}) {
  const asForm = (): CompanyForm => ({
    id: company.id, name: company.name, category: company.category ?? "ai-context",
    description: company.description ?? "", website: company.website ?? "",
    linkedin: company.linkedin, twitter: company.twitter ?? "",
  });
  return (
    <div className="group relative flex flex-col gap-5 p-5 rounded-[10px] border transition-colors duration-150 anim-fade-up"
      style={{ borderColor: "rgb(var(--ink-line))", animationDelay: `${Math.min(index, 12) * 30}ms`, background: "transparent" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={company.name} />
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
      <p className="text-[13.5px] leading-[1.6] text-pretty" style={{ color: "rgb(var(--ink-muted))" }}>
        {company.description}
      </p>
      <div className="mt-auto pt-1 flex items-center gap-3">
        {company.website && (
          <a href={company.website} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="Website"><Globe /></a>
        )}
        {company.linkedin && (
          <a href={company.linkedin} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="LinkedIn"><LinkedIn /></a>
        )}
        {company.twitter && (
          <a href={company.twitter} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="Twitter"><Twitter /></a>
        )}
      </div>
      {isAdmin && <AdminActions onEdit={() => onEdit(asForm())} onDelete={() => onDelete(asForm())} />}
    </div>
  );
}

// ── People Section ────────────────────────────────────────────────────────────
type PersonForm = { id: string; name: string; title: string; company: string; linkedin: string; twitter: string; notes: string };
const emptyPersonForm: PersonForm = { id: "", name: "", title: "", company: "", linkedin: "", twitter: "", notes: "" };

function PersonDialog({ open, initial, onClose, onSave, isSaving }: {
  open: boolean; initial?: PersonForm | null; onClose: () => void;
  onSave: (d: PersonForm) => void; isSaving: boolean;
}) {
  const [form, setForm] = useState<PersonForm>(initial ?? emptyPersonForm);
  const set = (k: keyof PersonForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  useMemo(() => { if (open) setForm(initial ?? emptyPersonForm); }, [open, initial]);
  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
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
              {initial ? "Edit person" : "Add person"}
            </h2>
            <p className="text-[13px] leading-[1.55]" style={{ color: "rgb(var(--ink-muted))" }}>
              Track a founder or executive's LinkedIn posts.
            </p>
          </div>
          <button onClick={onClose} className="p-1 -m-1 rounded focus-ring transition-colors" style={{ color: "rgb(var(--ink-faint))" }}>
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-5 pt-1 flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name">
              <TextInput value={form.name} onChange={set("name")} placeholder="e.g. Sam Altman" autoFocus />
            </Field>
            <Field label="Title / Role">
              <TextInput value={form.title} onChange={set("title")} placeholder="e.g. CEO & Co-founder" />
            </Field>
          </div>
          <Field label="Company / Affiliation">
            <TextInput value={form.company} onChange={set("company")} placeholder="e.g. OpenAI" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="LinkedIn URL">
              <TextInput value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="Twitter / X">
              <TextInput value={form.twitter} onChange={set("twitter")} placeholder="https://x.com/..." />
            </Field>
          </div>
          <Field label="Notes" hint="Any context about why you're tracking this person.">
            <Textarea value={form.notes} onChange={set("notes")} placeholder="Competitor founder, thought leader in AI context…" rows={2} />
          </Field>
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgb(var(--ink-hair))" }}>
            <button type="button" onClick={onClose}
              className="h-9 px-3.5 text-[13px] rounded-[7px] border tracking-tightish font-medium transition-colors focus-ring"
              style={{ borderColor: "rgb(var(--ink-line))", color: "rgb(var(--ink-text))", background: "transparent" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 h-9 px-3.5 text-[13px] rounded-[7px] tracking-tightish font-medium transition-colors focus-ring inline-flex items-center justify-center gap-2"
              style={{ background: "rgb(var(--ink-accent))", color: "white" }}>
              {isSaving ? <Loader /> : null}
              {initial ? "Save changes" : "Add person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PersonCard({ person, index, isAdmin, onEdit, onDelete }: {
  person: any; index: number; isAdmin: boolean;
  onEdit: (p: PersonForm) => void; onDelete: (p: PersonForm) => void;
}) {
  const asForm = (): PersonForm => ({
    id: person.id, name: person.name, title: person.title ?? "",
    company: person.company ?? "", linkedin: person.linkedin,
    twitter: person.twitter ?? "", notes: person.notes ?? "",
  });
  return (
    <div className="group relative flex flex-col gap-4 p-5 rounded-[10px] border transition-colors duration-150 anim-fade-up"
      style={{ borderColor: "rgb(var(--ink-line))", animationDelay: `${Math.min(index, 12) * 30}ms`, background: "transparent" }}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={person.name} size={40} />
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-tightish leading-tight" style={{ color: "rgb(var(--ink-text))" }}>
            {person.name}
          </h3>
          {person.title && (
            <span className="text-[12.5px] mt-0.5 leading-tight" style={{ color: "rgb(var(--ink-muted))" }}>
              {person.title}
            </span>
          )}
          {person.company && (
            <span className="text-[12px] mt-0.5" style={{ color: "rgb(var(--ink-faint))" }}>
              {person.company}
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      {person.notes && (
        <p className="text-[13px] leading-[1.6]" style={{ color: "rgb(var(--ink-muted))" }}>
          {person.notes}
        </p>
      )}

      {/* Links */}
      <div className="mt-auto flex items-center gap-3">
        {person.linkedin && (
          <a href={person.linkedin} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="LinkedIn"><LinkedIn /></a>
        )}
        {person.twitter && (
          <a href={person.twitter} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-7 h-7 -m-1 rounded-[5px] transition-colors focus-ring"
            style={{ color: "rgb(var(--ink-faint))" }} aria-label="Twitter"><Twitter /></a>
        )}
      </div>

      {isAdmin && <AdminActions onEdit={() => onEdit(asForm())} onDelete={() => onDelete(asForm())} />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = "companies" | "people";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<Tab>("companies");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");

  // Company state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyForm | null>(null);
  const [confirmDeleteCompany, setConfirmDeleteCompany] = useState<CompanyForm | null>(null);

  // People state
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editPerson, setEditPerson] = useState<PersonForm | null>(null);
  const [confirmDeletePerson, setConfirmDeletePerson] = useState<PersonForm | null>(null);

  const utils = trpc.useUtils();
  const { data: dbCompanies = [], isLoading: companiesLoading } = trpc.companies.list.useQuery();
  const { data: dbPeople = [], isLoading: peopleLoading } = trpc.people.list.useQuery();

  // Company mutations
  const addCompany = trpc.companies.add.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); setShowCompanyModal(false); toast.success("Company added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateCompany = trpc.companies.update.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); setEditCompany(null); toast.success("Company updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCompany = trpc.companies.remove.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); setConfirmDeleteCompany(null); toast.success("Company removed"); },
    onError: (e) => toast.error(e.message),
  });

  // People mutations
  const addPerson = trpc.people.add.useMutation({
    onSuccess: () => { utils.people.list.invalidate(); setShowPersonModal(false); toast.success("Person added"); },
    onError: (e) => toast.error(e.message),
  });
  const updatePerson = trpc.people.update.useMutation({
    onSuccess: () => { utils.people.list.invalidate(); setEditPerson(null); toast.success("Profile updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deletePerson = trpc.people.remove.useMutation({
    onSuccess: () => { utils.people.list.invalidate(); setConfirmDeletePerson(null); toast.success("Person removed"); },
    onError: (e) => toast.error(e.message),
  });

  const companyCounts = useMemo(() => {
    const m: Record<string, number> = { All: dbCompanies.length };
    CATEGORY_KEYS.forEach(c => { m[c] = dbCompanies.filter(x => x.category === c).length; });
    return m;
  }, [dbCompanies]);

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dbCompanies.filter(c => {
      const inCat = activeCat === "All" || c.category === activeCat;
      const inQ = !q || c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [dbCompanies, query, activeCat]);

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dbPeople.filter(p =>
      !q || p.name.toLowerCase().includes(q) ||
      (p.title ?? "").toLowerCase().includes(q) ||
      (p.company ?? "").toLowerCase().includes(q) ||
      (p.notes ?? "").toLowerCase().includes(q)
    );
  }, [dbPeople, query]);

  const handleSaveCompany = (form: CompanyForm) => {
    const payload = {
      id: form.id, name: form.name, category: form.category as any,
      description: form.description || undefined, website: form.website || undefined,
      linkedin: form.linkedin, twitter: form.twitter || undefined,
    };
    editCompany ? updateCompany.mutate(payload) : addCompany.mutate(payload);
  };

  const handleSavePerson = (form: PersonForm) => {
    const payload = {
      id: form.id, name: form.name,
      title: form.title || undefined, company: form.company || undefined,
      linkedin: form.linkedin, twitter: form.twitter || undefined,
      notes: form.notes || undefined,
    };
    editPerson ? updatePerson.mutate(payload) : addPerson.mutate(payload);
  };

  const isLoading = tab === "companies" ? companiesLoading : peopleLoading;

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <header className="flex items-end justify-between gap-6 flex-wrap mb-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-[34px] leading-[1.05] tracking-tightish" style={{ color: "rgb(var(--ink-text))" }}>
            Directory
          </h1>
          <p className="text-[14px] tracking-tightish" style={{ color: "rgb(var(--ink-muted))" }}>
            <span className="font-mono" style={{ color: "rgb(var(--ink-text))" }}>{dbCompanies.length}</span> companies ·{" "}
            <span className="font-mono" style={{ color: "rgb(var(--ink-text))" }}>{dbPeople.length}</span> people tracked
          </p>
        </div>
        <div className="w-[260px] max-w-full">
          <SearchInput
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === "companies" ? "Search companies…" : "Search people…"}
          />
        </div>
      </header>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6"
        style={{ borderBottom: "1px solid rgb(var(--ink-line))", paddingBottom: 0 }}>
        {(["companies", "people"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery(""); setActiveCat("All"); }}
            className="relative px-4 py-2.5 text-[13px] font-medium tracking-tightish transition-colors focus-ring capitalize"
            style={{
              color: tab === t ? "rgb(var(--ink-text))" : "rgb(var(--ink-muted))",
              marginBottom: -1,
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid rgb(var(--ink-accent))" : "2px solid transparent",
            }}
          >
            {t === "companies" ? `Companies (${dbCompanies.length})` : `People (${dbPeople.length})`}
          </button>
        ))}
      </div>

      {/* Companies tab */}
      {tab === "companies" && (
        <>
          <div className="flex items-center gap-1.5 mb-6 flex-wrap">
            <FilterChip active={activeCat === "All"} onClick={() => setActiveCat("All")} count={companyCounts.All}>All</FilterChip>
            {CATEGORY_KEYS.map(c => (
              <FilterChip key={c} active={activeCat === c} onClick={() => setActiveCat(c)} count={companyCounts[c]}>
                {CATEGORY_DISPLAY[c]}
              </FilterChip>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader /></div>
          ) : filteredCompanies.length === 0 ? (
            <div className="border border-dashed rounded-[10px] py-16 text-center anim-fade-up"
              style={{ borderColor: "rgb(var(--ink-line))" }}>
              <div className="text-[14px] tracking-tightish mb-1" style={{ color: "rgb(var(--ink-text))" }}>No companies match.</div>
              <div className="text-[12.5px]" style={{ color: "rgb(var(--ink-muted))" }}>Try a different search or filter.</div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pb-20">
              {filteredCompanies.map((c, i) => (
                <CompanyCard key={c.id} company={c} index={i} isAdmin={isAdmin}
                  onEdit={setEditCompany} onDelete={setConfirmDeleteCompany} />
              ))}
            </div>
          )}
        </>
      )}

      {/* People tab */}
      {tab === "people" && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader /></div>
          ) : filteredPeople.length === 0 ? (
            <div className="border border-dashed rounded-[10px] py-16 text-center anim-fade-up"
              style={{ borderColor: "rgb(var(--ink-line))" }}>
              <div className="text-[14px] tracking-tightish mb-1" style={{ color: "rgb(var(--ink-text))" }}>
                {dbPeople.length === 0 ? "No people added yet." : "No people match your search."}
              </div>
              {dbPeople.length === 0 && isAdmin && (
                <div className="text-[12.5px]" style={{ color: "rgb(var(--ink-muted))" }}>
                  Click "Add person" to start tracking founders and executives.
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pb-20">
              {filteredPeople.map((p, i) => (
                <PersonCard key={p.id} person={p} index={i} isAdmin={isAdmin}
                  onEdit={setEditPerson} onDelete={setConfirmDeletePerson} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating add button */}
      {isAdmin && (
        <button
          onClick={() => tab === "companies"
            ? (setEditCompany(null), setShowCompanyModal(true))
            : (setEditPerson(null), setShowPersonModal(true))
          }
          className="fixed bottom-7 right-7 z-30 inline-flex items-center gap-1.5 h-10 pl-3.5 pr-4 rounded-full text-[13px] font-medium tracking-tightish transition-colors focus-ring"
          style={{ background: "rgb(var(--ink-text))", color: "rgb(var(--ink-bg))" }}
        >
          {tab === "companies" ? <Plus /> : <UserIcon />}
          {tab === "companies" ? "Add company" : "Add person"}
        </button>
      )}

      {/* Dialogs */}
      <CompanyDialog
        open={showCompanyModal || !!editCompany}
        initial={editCompany}
        onClose={() => { setShowCompanyModal(false); setEditCompany(null); }}
        onSave={handleSaveCompany}
        isSaving={addCompany.isPending || updateCompany.isPending}
      />
      {confirmDeleteCompany && (
        <ConfirmDeleteDialog
          name={confirmDeleteCompany.name}
          noun="company"
          onClose={() => setConfirmDeleteCompany(null)}
          onConfirm={() => deleteCompany.mutate({ id: confirmDeleteCompany.id })}
          isDeleting={deleteCompany.isPending}
        />
      )}

      <PersonDialog
        open={showPersonModal || !!editPerson}
        initial={editPerson}
        onClose={() => { setShowPersonModal(false); setEditPerson(null); }}
        onSave={handleSavePerson}
        isSaving={addPerson.isPending || updatePerson.isPending}
      />
      {confirmDeletePerson && (
        <ConfirmDeleteDialog
          name={confirmDeletePerson.name}
          noun="person"
          onClose={() => setConfirmDeletePerson(null)}
          onConfirm={() => deletePerson.mutate({ id: confirmDeletePerson.id })}
          isDeleting={deletePerson.isPending}
        />
      )}
    </div>
  );
}
