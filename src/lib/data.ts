// Project data for the portfolio
export interface Project {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  image?: string;
  tags: string[];
  category: "saas" | "government" | "ai" | "business" | "healthcare" | "infrastructure";
  stats?: { label: string; value: string }[];
  highlights: string[];
}

export const projects: Project[] = [
  {
    id: "chogiakiem",
    title: "ChoGiaKiem.vn",
    subtitle: "Multi-Tenant SaaS Marketplace Platform",
    description:
      "A production multi-tenant marketplace powering POS, inventory management, accounting, e-invoicing, HR/payroll, and vendor storefronts — all with automatic subdomain routing and role-based access.",
    url: "https://chogiakiem.vn",
    tags: ["Next.js 15", "TypeScript", "Supabase", "Tailwind CSS", "Vercel"],
    category: "saas",
    stats: [
      { label: "API Routes", value: "630+" },
      { label: "Components", value: "397" },
      { label: "DB Tables", value: "50+" },
      { label: "App Modules", value: "15+" },
    ],
    highlights: [
      "Multi-vendor marketplace with auto subdomain routing",
      "Full POS system with barcode scanning & receipt printing",
      "Real-time inventory tracking across warehouses",
      "E-invoicing integration with Vietnamese tax authority",
      "HR dashboard: payroll, attendance, leave management",
      "Role-based access: Admin → Vendor → Shipper → Public",
    ],
  },
  {
    id: "xagiakiem",
    title: "XaGiaKiem.gov.vn",
    subtitle: "Government Commune Digital Portal",
    description:
      "Official government website for Gia Kiem commune serving 20,000+ residents. Features 34+ public sections, an AI chatbot, digital transformation dashboard, and online public service requests.",
    url: "https://xagiakiem.gov.vn",
    tags: ["Next.js", "Supabase", "Tailwind CSS", "Cypress", "AI Chatbot"],
    category: "government",
    stats: [
      { label: "Public Sections", value: "34+" },
      { label: "Residents Served", value: "20K+" },
      { label: "Admin Modules", value: "12" },
    ],
    highlights: [
      "AI chatbot for citizen Q&A on administrative procedures",
      "Digital transformation dashboard with live data",
      "Online public service requests (TTHC)",
      "Election 2026 information portal",
      "OCOP product showcase for local economy",
      "Industrial zone investment portal",
    ],
  },
  {
    id: "vanbanplus",
    title: "VanBanPlus",
    subtitle: "AI-Powered Document Drafting Tool",
    description:
      "An intelligent administrative document generator that uses AI to draft official Vietnamese government documents. Includes PDF extraction with OCR and template-based generation.",
    url: "https://vanbanplus.giakiemso.com",
    tags: ["Next.js", "AI/LLM", "Python", "OCR", "PDF Processing"],
    category: "ai",
    highlights: [
      "AI-powered document drafting from templates",
      "PDF text extraction with multiple OCR fallbacks",
      "Vietnamese administrative document standards compliance",
      "Template library for common government documents",
      "Auth-protected workspace for document management",
    ],
  },
  {
    id: "giakiemso",
    title: "GiaKiemSo.com",
    subtitle: "Business Tools & AI Document Processing",
    description:
      "A suite of business tools featuring Google Document AI integration for OCR, Vietnamese ID card (CCCD) extraction, loan calculators, tax calculators, and VietQR payment generation.",
    url: "https://giakiemso.com",
    tags: ["Next.js", "Google Document AI", "Vision OCR", "Supabase", "VietQR"],
    category: "business",
    stats: [
      { label: "AI Processors", value: "5+" },
      { label: "Documentation", value: "100+ pages" },
    ],
    highlights: [
      "Google Document AI for structured data extraction",
      "Vietnamese ID card (CCCD) auto-extraction",
      "Multi-config document processors",
      "Loan & tax calculators for businesses",
      "VietQR payment code generation",
      "Invoice management system",
    ],
  },
  {
    id: "phongkham",
    title: "Clinic Management System",
    subtitle: "Healthcare Dashboard Platform",
    description:
      "A comprehensive medical clinic management platform covering patient registration, doctor queues, examination workflow, pharmacy dispensing, insurance processing, and revenue reporting.",
    url: "https://phongkham.giakiemso.com",
    tags: ["Next.js", "Supabase", "TypeScript", "Tailwind CSS"],
    category: "healthcare",
    stats: [
      { label: "Dashboard Modules", value: "13" },
      { label: "Workflow Steps", value: "6" },
    ],
    highlights: [
      "Patient registration & queue management",
      "Doctor examination workflow with prescriptions",
      "Pharmacy dispensing & inventory tracking",
      "Insurance (BHYT) claim processing",
      "Revenue analytics & reporting dashboard",
      "Multi-role: Reception → Doctor → Pharmacy → Cashier",
    ],
  },
];

export const techStack = {
  frontend: [
    { name: "Next.js 15", icon: "nextjs" },
    { name: "React 19", icon: "react" },
    { name: "TypeScript", icon: "typescript" },
    { name: "Tailwind CSS v4", icon: "tailwind" },
  ],
  backend: [
    { name: "Supabase", icon: "supabase" },
    { name: "PostgreSQL", icon: "postgresql" },
    { name: "Node.js", icon: "nodejs" },
    { name: "REST APIs", icon: "api" },
  ],
  devops: [
    { name: "Vercel", icon: "vercel" },
    { name: "Docker", icon: "docker" },
    { name: "GitHub", icon: "github" },
    { name: "CI/CD", icon: "cicd" },
  ],
  tools: [
    { name: "Puppeteer", icon: "puppeteer" },
    { name: "Google AI", icon: "google" },
    { name: "Stripe/VietQR", icon: "payment" },
    { name: "SMTP/Email", icon: "email" },
  ],
};

export const services = [
  {
    title: "SaaS Development",
    description: "Multi-tenant platforms with auth, billing, dashboards, and API design from scratch.",
    icon: "layers",
  },
  {
    title: "Full-Stack Web Apps",
    description: "End-to-end development with Next.js + Supabase — from DB schema to production deploy.",
    icon: "code",
  },
  {
    title: "Government & Enterprise Portals",
    description: "Public-facing portals with admin panels, AI chatbots, and digital transformation tools.",
    icon: "building",
  },
  {
    title: "AI Integration",
    description: "Document AI, OCR, LLM-powered tools, and automation integrated into your workflow.",
    icon: "brain",
  },
  {
    title: "Deployment & DevOps",
    description: "Vercel, Docker, CI/CD pipelines, domain setup, SSL, and production hardening.",
    icon: "rocket",
  },
  {
    title: "Performance & Security Audit",
    description: "Lighthouse optimization, RLS policies, rate limiting, and penetration testing.",
    icon: "shield",
  },
];
