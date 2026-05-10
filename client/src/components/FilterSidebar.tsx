import { CATEGORIES } from "../../../shared/const";

interface FilterSidebarProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function FilterSidebar({ selectedCategory, onCategoryChange }: FilterSidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border p-6 h-screen sticky top-0 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-sm font-bold text-sidebar-foreground uppercase tracking-wider mb-4">
          Filter by Category
        </h2>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange(null)}
            className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            All Companies
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-sidebar-border pt-6">
        <h3 className="text-xs font-bold text-sidebar-foreground uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-sidebar-foreground">Total Companies</span>
            <span className="font-semibold text-sidebar-primary">7</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sidebar-foreground">AI & Context</span>
            <span className="font-semibold text-sidebar-primary">3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sidebar-foreground">GTM / Sales</span>
            <span className="font-semibold text-sidebar-primary">2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sidebar-foreground">a16z Speedrun</span>
            <span className="font-semibold text-sidebar-primary">2</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
