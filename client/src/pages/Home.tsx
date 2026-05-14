import { FilterSidebar } from "@/components/FilterSidebar";
import { SearchHeader } from "@/components/SearchHeader";
import { CATEGORIES } from "../../../shared/const";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyCard } from "@/components/CompanyCard";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Category = "ai-context" | "gtm-sales" | "a16z";

interface CompanyForm {
  id: string;
  name: string;
  category: Category;
  description: string;
  website: string;
  linkedin: string;
  twitter: string;
}

const emptyForm: CompanyForm = {
  id: "",
  name: "",
  category: "ai-context",
  description: "",
  website: "",
  linkedin: "",
  twitter: "",
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CompanyModal({
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  initial?: CompanyForm;
  onClose: () => void;
  onSave: (data: CompanyForm) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CompanyForm>(initial ?? emptyForm);
  const isEdit = !!initial;

  const set = (field: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Company name is required");
    if (!form.linkedin.trim()) return toast.error("LinkedIn URL is required");
    const id = form.id || slugify(form.name);
    onSave({ ...form, id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Company" : "Add Company"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Company Name *</label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Glean AI"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category</label>
            <select
              value={form.category}
              onChange={set("category")}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">LinkedIn URL *</label>
            <input
              value={form.linkedin}
              onChange={set("linkedin")}
              placeholder="https://www.linkedin.com/company/..."
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Twitter / X URL</label>
            <input
              value={form.twitter}
              onChange={set("twitter")}
              placeholder="https://x.com/..."
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Website</label>
            <input
              value={form.website}
              onChange={set("website")}
              placeholder="https://..."
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="What does this company do?"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : isEdit ? "Save Changes" : "Add Company"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState<CompanyForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const getCategoryColor = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.color ?? "";
  };

  const filteredCompanies = useMemo(() => {
    return dbCompanies.filter(company => {
      if (selectedCategory && company.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          company.name.toLowerCase().includes(q) ||
          (company.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dbCompanies, searchQuery, selectedCategory]);

  const handleSaveNew = (form: CompanyForm) => {
    addMutation.mutate({
      id: form.id,
      name: form.name,
      category: form.category,
      description: form.description || undefined,
      website: form.website || undefined,
      linkedin: form.linkedin,
      twitter: form.twitter || undefined,
    });
  };

  const handleSaveEdit = (form: CompanyForm) => {
    updateMutation.mutate({
      id: form.id,
      name: form.name,
      category: form.category,
      description: form.description || undefined,
      website: form.website || undefined,
      linkedin: form.linkedin,
      twitter: form.twitter || undefined,
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <FilterSidebar selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"} found
              </h2>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Company
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {filteredCompanies.map(company => (
                  <div key={company.id} className="relative group">
                    <CompanyCard
                      company={{
                        id: company.id,
                        name: company.name,
                        category: company.category as any,
                        description: company.description ?? "",
                        website: company.website ?? "#",
                        linkedin: company.linkedin,
                        twitter: company.twitter ?? "#",
                      }}
                      categoryColor={getCategoryColor(company.category ?? "")}
                    />
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditCompany({
                            id: company.id,
                            name: company.name,
                            category: (company.category as Category) ?? "ai-context",
                            description: company.description ?? "",
                            website: company.website ?? "",
                            linkedin: company.linkedin,
                            twitter: company.twitter ?? "",
                          })}
                          className="p-1.5 rounded-md bg-background border border-border shadow-sm hover:bg-muted"
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(company.id)}
                          className="p-1.5 rounded-md bg-background border border-border shadow-sm hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-lg font-semibold text-foreground mb-2">No companies found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add modal */}
      {showModal && (
        <CompanyModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveNew}
          isSaving={addMutation.isPending}
        />
      )}

      {/* Edit modal */}
      {editCompany && (
        <CompanyModal
          initial={editCompany}
          onClose={() => setEditCompany(null)}
          onSave={handleSaveEdit}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6">
              <p className="font-semibold text-foreground mb-2">Remove company?</p>
              <p className="text-sm text-muted-foreground mb-6">
                This will stop tracking this company's posts. Existing posts won't be deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ id: confirmDelete })}
                >
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
                </Button>
                <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
