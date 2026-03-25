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

// Blog / Case Study posts
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: "case-study" | "tutorial" | "insight";
  tags: string[];
  coverGradient: string; // tailwind gradient classes
  content: string; // markdown-ish content for the detail page
}

export const blogPosts: BlogPost[] = [
  {
    slug: "building-multi-tenant-saas-from-scratch",
    title: "Building a Multi-Tenant SaaS Platform from Scratch",
    excerpt:
      "How I architected ChoGiaKiem.vn — a marketplace serving multiple vendors with 630+ API routes, auto subdomain routing, POS, inventory, and e-invoicing — using Next.js, Supabase, and Vercel.",
    date: "2026-03-15",
    readTime: "8 min read",
    category: "case-study",
    tags: ["Next.js", "Supabase", "Multi-Tenant", "SaaS", "TypeScript"],
    coverGradient: "from-blue-600 to-cyan-500",
    content: `## The Challenge

When I set out to build ChoGiaKiem.vn, the goal was ambitious: create a **multi-tenant marketplace platform** where each vendor gets their own storefront, subdomain, POS system, and business tools — all from a single codebase.

The platform needed to handle:
- **Multi-vendor isolation** — each vendor's data completely separated
- **Auto subdomain routing** — vendor1.chogiakiem.vn, vendor2.chogiakiem.vn
- **Full POS system** with barcode scanning and receipt printing
- **Real-time inventory** tracking across multiple warehouses
- **E-invoicing** integration with the Vietnamese tax authority (VNPT)
- **HR dashboard** — payroll, attendance, leave management

## Architecture Decisions

### Why Next.js + Supabase?

I chose **Next.js 15 App Router** for its hybrid rendering model — most dashboard pages are client-rendered for interactivity, while public storefronts use SSR for SEO. **Supabase (PostgreSQL)** was the natural choice for its Row-Level Security (RLS), real-time subscriptions, and generous free tier during development.

### Multi-Tenant Strategy: Shared DB, RLS Isolation

Instead of separate databases per tenant, I used a **shared database with RLS policies**. Every table includes a \`vendor_id\` column, and Supabase RLS ensures vendors can only see their own data.

\`\`\`sql
-- Example RLS policy
CREATE POLICY "Vendors see own products" ON products
  FOR ALL USING (vendor_id = auth.jwt() ->> 'vendor_id');
\`\`\`

This approach keeps infrastructure costs low while maintaining strict data isolation.

### Subdomain Routing

Next.js middleware handles subdomain detection, resolving \`vendorname.chogiakiem.vn\` to the correct vendor context before any page renders.

## Key Technical Achievements

| Metric | Value |
|--------|-------|
| API Routes | 630+ |
| React Components | 397 |
| Database Tables | 50+ |
| App Modules | 15+ |

### The POS System

The POS module was the most complex — it needed to:
1. Scan barcodes via camera or USB scanner
2. Calculate tax, discounts, and loyalty points in real-time
3. Print thermal receipts (58mm/80mm)
4. Work offline with local state sync

I built a **service worker** that caches critical POS data locally, so cashiers can continue selling even during network interruptions.

### E-Invoicing Integration

Vietnam's tax authority requires electronic invoicing (hóa đơn điện tử). I built a queue-based system that:
1. Generates invoices in the required XML format
2. Signs with digital certificates
3. Submits to VNPT's API
4. Stores the tax authority's response code

## Results

- **Platform serves multiple active vendors** with complete business operations
- **Zero data leaks** between tenants — verified with penetration testing
- **Sub-second page loads** on dashboard — Lighthouse performance score 90+
- **30% reduction** in vendor onboarding time compared to manual setup

## Lessons Learned

1. **Start with RLS from day one** — retrofitting security policies is painful
2. **Invest in TypeScript types early** — with 630+ API routes, type safety saved me countless hours
3. **Build admin tools first** — a good admin panel accelerates everything else
4. **Test with real vendors** — real-world usage revealed edge cases no unit test would catch

The platform continues to grow, and the architecture has proven scalable. Each new vendor can be onboarded in under 5 minutes, with full POS, inventory, and accounting ready to go.`,
  },
  {
    slug: "digitizing-government-services-commune-portal",
    title: "Digitizing Government Services: Building a Commune Portal for 20K+ Residents",
    excerpt:
      "How I built XaGiaKiem.gov.vn — a government digital portal with AI chatbot, online public services, and digital transformation dashboard — transforming how 20,000+ residents interact with local government.",
    date: "2026-02-20",
    readTime: "6 min read",
    category: "case-study",
    tags: ["Government", "AI Chatbot", "Digital Transformation", "Next.js", "Supabase"],
    coverGradient: "from-emerald-600 to-teal-500",
    content: `## The Challenge

Gia Kiem commune serves **20,000+ residents** but was still running most public services through paper forms and in-person visits. The local government wanted to:

- Create an **official digital portal** for all commune information
- Enable **online public service requests** (thủ tục hành chính)
- Build an **AI chatbot** to answer citizen questions 24/7
- Provide a **digital transformation dashboard** for leadership oversight
- Support the **2026 election** information portal

## My Approach

As both the **project manager and lead developer**, I had to balance government requirements (formal processes, security, accessibility) with modern UX expectations.

### Information Architecture

The portal needed to serve multiple audiences:
- **Residents** — looking for service procedures, news, contact info
- **Businesses** — seeking investment information, industrial zone details
- **Government staff** — managing content, processing requests
- **Leadership** — monitoring digital transformation progress

I designed **34+ public sections** organized by user intent, with a clear navigation hierarchy.

### The AI Chatbot

The standout feature is the **AI-powered chatbot** that helps residents navigate administrative procedures. Instead of reading through pages of regulations, residents can ask natural language questions like:

> "Tôi cần làm giấy khai sinh cho con, cần giấy tờ gì?"
> (What documents do I need for a birth certificate?)

The chatbot is trained on the commune's actual procedural database, so answers are always accurate and up-to-date.

### Technical Stack

- **Frontend**: Next.js App Router with SSR for SEO (government sites must be Google-indexed)
- **Backend**: Supabase with strict RLS — government data has extra security requirements
- **AI**: LLM integration with context retrieval from procedural documents
- **Testing**: Cypress E2E tests for critical user flows
- **Hosting**: Vercel with custom domain (xagiakiem.gov.vn)

## Key Features Built

### 1. Online Public Services (TTHC)
Residents can submit service requests online instead of visiting the commune office. The system tracks status and notifies via SMS.

### 2. Digital Transformation Dashboard
Real-time metrics showing the commune's digitization progress — how many services are online, response times, citizen satisfaction scores.

### 3. OCOP Product Showcase
Promoting local products through the national "One Commune One Product" program, helping local businesses reach wider markets.

### 4. Election 2026 Portal
Dedicated section for election information, candidate profiles, and voting procedures.

## Results

| Metric | Before | After |
|--------|--------|-------|
| Services available online | 0 | 34+ |
| Average service request time | 2-3 days | Same day |
| Citizen information queries | In-person only | 24/7 via chatbot |
| Admin modules | 0 | 12 |

## Lessons Learned

1. **Government projects need extensive stakeholder alignment** — I held weekly review sessions with commune leadership
2. **Accessibility is non-negotiable** — the portal serves elderly residents with varying tech literacy
3. **Content management must be simple** — government staff aren't developers, so the admin CMS needs to be intuitive
4. **Security audits are mandatory** — government portals are high-value targets; I implemented CSP headers, rate limiting, and regular dependency audits

This project represents what digital transformation looks like at the grassroots level — bringing modern technology to where it makes the most direct impact on people's daily lives.`,
  },
];

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
