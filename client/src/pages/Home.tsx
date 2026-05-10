import { CompanyCard } from "@/components/CompanyCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SearchHeader } from "@/components/SearchHeader";
import { CATEGORIES, COMPETITORS } from "../../../shared/const";
import { useMemo, useState } from "react";

/**
 * Competitor Directory Home Page
 * 
 * Design: Modern Intelligence Dashboard
 * - Slate blue primary (#1e293b) for trust and intelligence
 * - Emerald accents (#10b981) for actionable insights
 * - Card-based layout for modular information
 * - Asymmetric grid with sidebar filters
 */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter and search companies
  const filteredCompanies = useMemo(() => {
    return COMPETITORS.filter((company) => {
      // Category filter
      if (selectedCategory && company.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = company.name.toLowerCase().includes(query);
        const matchesDescription = company.description.toLowerCase().includes(query);
        const matchesLocation = company.location?.toLowerCase().includes(query);
        const matchesFounder = company.founders?.some(
          (f) => f.name.toLowerCase().includes(query) || f.role.toLowerCase().includes(query)
        );

        return matchesName || matchesDescription || matchesLocation || matchesFounder;
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Get category color for badge
  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.color || "";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <FilterSidebar selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-8">
            {/* Results header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"} found
              </h2>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing results for "<span className="font-medium">{searchQuery}</span>"
                </p>
              )}
            </div>

            {/* Company grid */}
            {filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    categoryColor={getCategoryColor(company.category)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground mb-2">No companies found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
