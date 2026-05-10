import { Company, Founder } from "../../../shared/const";
import { ExternalLink, Linkedin, Twitter } from "lucide-react";
import { useState } from "react";

interface CompanyCardProps {
  company: Company;
  categoryColor: string;
}

export function CompanyCard({ company, categoryColor }: CompanyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-accent/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/50 to-transparent" />

      <div className="p-6">
        {/* Header with category badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-card-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {company.name}
            </h3>
          </div>
          <span className={`ml-2 px-2.5 py-1 text-xs font-medium rounded-full border ${categoryColor}`}>
            {company.category === "ai-context"
              ? "AI & Context"
              : company.category === "gtm-sales"
                ? "GTM / Sales"
                : "a16z"}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{company.description}</p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
          {company.location && (
            <div className="flex items-center gap-1">
              <span className="text-accent">📍</span>
              {company.location}
            </div>
          )}
          {company.founded && (
            <div className="flex items-center gap-1">
              <span className="text-accent">📅</span>
              Founded {company.founded}
            </div>
          )}
        </div>

        {/* Founders section */}
        {company.founders && company.founders.length > 0 && (
          <div className="mb-4 pb-4 border-t border-border">
            <p className="text-xs font-semibold text-card-foreground mb-2">Founders</p>
            <div className="space-y-1">
              {company.founders.map((founder: Founder, idx: number) => (
                <div key={idx} className="text-xs">
                  <p className="font-medium text-card-foreground">{founder.name}</p>
                  <p className="text-muted-foreground">{founder.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        <div className="flex items-center gap-2">
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-secondary hover:bg-accent hover:text-accent-foreground text-secondary-foreground transition-colors"
            title="Visit website"
          >
            <ExternalLink size={16} />
          </a>
          <a
            href={company.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-secondary hover:bg-accent hover:text-accent-foreground text-secondary-foreground transition-colors"
            title="Visit LinkedIn"
          >
            <Linkedin size={16} />
          </a>
          <a
            href={company.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-secondary hover:bg-accent hover:text-accent-foreground text-secondary-foreground transition-colors"
            title="Visit Twitter"
          >
            <Twitter size={16} />
          </a>
        </div>
      </div>

      {/* Hover indicator */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-accent/5 to-transparent" />
      )}
    </div>
  );
}
