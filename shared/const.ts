export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

export interface Founder {
  name: string;
  role: string;
  linkedin?: string;
  twitter?: string;
}

export interface Company {
  id: string;
  name: string;
  category: "ai-context" | "gtm-sales" | "a16z";
  description: string;
  founded?: number;
  location?: string;
  website: string;
  linkedin: string;
  twitter: string;
  founders?: Founder[];
}

export const COMPETITORS: Company[] = [
  {
    id: "glean",
    name: "Glean AI",
    category: "ai-context",
    description: "Work AI platform connected to enterprise data. Find, create, and automate anything.",
    founded: 2018,
    location: "Palo Alto, CA",
    website: "https://www.glean.com/",
    linkedin: "https://www.linkedin.com/company/gleanwork",
    twitter: "https://x.com/glean",
    founders: [
      {
        name: "Arvind Jain",
        role: "Founder & CEO",
        linkedin: "https://www.linkedin.com/in/jain-arvind",
        twitter: "https://x.com/jainarvind",
      },
    ],
  },
  {
    id: "contextual-ai",
    name: "Contextual AI",
    category: "ai-context",
    description: "Context engineering platform for production AI. Replace DIY complexity with accuracy, security, and scalability.",
    location: "Mountain View, CA",
    website: "https://contextual.ai/",
    linkedin: "https://www.linkedin.com/company/contextualai",
    twitter: "https://x.com/ContextualAI",
    founders: [
      {
        name: "Douwe Kiela",
        role: "CEO",
        linkedin: "https://www.linkedin.com/in/douwekiela",
      },
    ],
  },
  {
    id: "context-ai",
    name: "Context AI",
    category: "ai-context",
    description: "Enterprise platform for deploying agents into real workflows. Build, run, and improve AI agents with Bedrock.",
    location: "San Francisco, CA",
    website: "https://context.ai/",
    linkedin: "https://www.linkedin.com/company/context-ai",
    twitter: "https://x.com/getcontextai",
    founders: [
      {
        name: "Joseph Semrai",
        role: "Founder",
        linkedin: "https://www.linkedin.com/in/semrai",
      },
    ],
  },
  {
    id: "hockeystack",
    name: "Hockeystack",
    category: "gtm-sales",
    description: "AI-powered B2B Revenue Data Platform. Modern attribution, holistic buyer journeys, and revenue agents for marketing and sales.",
    location: "San Francisco, CA",
    website: "https://www.hockeystack.com/",
    linkedin: "https://www.linkedin.com/company/hockeystack",
    twitter: "https://x.com/gethockeystack",
  },
  {
    id: "attio",
    name: "Attio",
    category: "gtm-sales",
    description: "AI CRM that builds pipeline, accelerates deals, and compounds revenue. Data-driven and fully programmable.",
    location: "San Francisco, CA",
    website: "https://attio.com/",
    linkedin: "https://www.linkedin.com/company/attio",
    twitter: "https://x.com/attio",
  },
  {
    id: "sentra",
    name: "Sentra",
    category: "a16z",
    description: "Foundational memory for Enterprise General Intelligence. Captures interactions, meetings, and agent traces into shared organizational memory.",
    founded: 2025,
    location: "San Francisco, CA",
    website: "https://sentra.app/",
    linkedin: "https://linkedin.com/company/sentra-app/",
    twitter: "https://x.com/sentra_app",
    founders: [
      {
        name: "Ashwin Gopinath",
        role: "Co-Founder & CEO",
        linkedin: "https://www.linkedin.com/in/ashwingopinath",
      },
      {
        name: "Andrey Starenky",
        role: "Co-Founder & CTO",
        linkedin: "https://www.linkedin.com/in/andrey-starenky",
      },
    ],
  },
  {
    id: "meridian",
    name: "Meridian",
    category: "a16z",
    description: "AI operating system for consulting firms. System of record that organizes documents, retrieves engagements, and generates deliverables.",
    founded: 2025,
    location: "San Francisco, CA",
    website: "https://trymeridian.dev/",
    linkedin: "https://www.linkedin.com/company/try-meridian/",
    twitter: "https://x.com/tryMerid1an",
    founders: [
      {
        name: "Kashyap Nathan",
        role: "CEO",
        linkedin: "https://www.linkedin.com/in/kashyapnathan",
      },
      {
        name: "Chris Farrington",
        role: "CTO",
        linkedin: "https://www.linkedin.com/in/chris-farrington",
      },
    ],
  },
];

export const CATEGORIES = [
  { id: "ai-context", label: "AI & Context", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "gtm-sales", label: "GTM / Sales", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "a16z", label: "a16z Speedrun", color: "bg-purple-50 text-purple-700 border-purple-200" },
];
