import type { Translations } from "./types";

const en: Translations = {
  // ── Header / Nav ──
  nav: {
    projects: "Projects",
    tech: "Tech Stack",
    services: "Services",
    blog: "Blog",
    contact: "Contact",
    hireMe: "Hire Me",
  },

  // ── Hero ──
  hero: {
    badge: "Available for freelance work",
    greeting: "Hi, I'm",
    title: "Full-Stack Developer & Digital Transformation Consultant",
    description: "Former founder & project manager turned developer. I build <strong>production SaaS platforms</strong>, <strong>government digital services</strong>, and <strong>AI-powered tools</strong> — leading digital transformation projects from strategy to deployment.",
    cta: "View My Work",
    liveDemo: "Live Demo",
    stats: {
      apiRoutes: "API Routes",
      liveProjects: "Live Projects",
      usersServed: "Users Served",
      dbTables: "DB Tables",
    },
  },

  // ── Projects ──
  projects: {
    sectionTag: "// Featured Projects",
    heading: "What I've Built",
    subtitle: "Production applications serving real users — from multi-tenant SaaS to government digital services.",
    visitSite: "Visit Site",
    categories: {
      saas: "SaaS Platform",
      government: "Government",
      ai: "AI / Automation",
      business: "Business Tools",
      healthcare: "Healthcare",
      infrastructure: "Infrastructure",
    },
    items: {
      chogiakiem: {
        subtitle: "Multi-Tenant SaaS Marketplace Platform",
        description: "A production multi-tenant marketplace powering POS, inventory management, accounting, e-invoicing, HR/payroll, and vendor storefronts — all with automatic subdomain routing and role-based access.",
        stats: { apiRoutes: "API Routes", components: "Components", dbTables: "DB Tables", appModules: "App Modules" },
        highlights: [
          "Multi-vendor marketplace with auto subdomain routing",
          "Full POS system with barcode scanning & receipt printing",
          "Real-time inventory tracking across warehouses",
          "E-invoicing integration with Vietnamese tax authority",
          "HR dashboard: payroll, attendance, leave management",
          "Role-based access: Admin → Vendor → Shipper → Public",
        ],
      },
      xagiakiem: {
        subtitle: "Government Commune Digital Portal",
        description: "Official government website for Gia Kiem commune serving 20,000+ residents. Features 34+ public sections, an AI chatbot, digital transformation dashboard, and online public service requests.",
        stats: { publicSections: "Public Sections", residentsServed: "Residents Served", adminModules: "Admin Modules" },
        highlights: [
          "AI chatbot for citizen Q&A on administrative procedures",
          "Digital transformation dashboard with live data",
          "Online public service requests (TTHC)",
          "Election 2026 information portal",
          "OCOP product showcase for local economy",
          "Industrial zone investment portal",
        ],
      },
      vanbanplus: {
        subtitle: "AI-Powered Document Drafting Tool",
        description: "An intelligent administrative document generator that uses AI to draft official Vietnamese government documents. Includes PDF extraction with OCR and template-based generation.",
        highlights: [
          "AI-powered document drafting from templates",
          "PDF text extraction with multiple OCR fallbacks",
          "Vietnamese administrative document standards compliance",
          "Template library for common government documents",
          "Auth-protected workspace for document management",
        ],
      },
      giakiemso: {
        subtitle: "Business Tools & AI Document Processing",
        description: "A suite of business tools featuring Google Document AI integration for OCR, Vietnamese ID card (CCCD) extraction, loan calculators, tax calculators, and VietQR payment generation.",
        stats: { aiProcessors: "AI Processors", documentation: "Documentation" },
        highlights: [
          "Google Document AI for structured data extraction",
          "Vietnamese ID card (CCCD) auto-extraction",
          "Multi-config document processors",
          "Loan & tax calculators for businesses",
          "VietQR payment code generation",
          "Invoice management system",
        ],
      },
      phongkham: {
        subtitle: "Healthcare Dashboard Platform",
        description: "A comprehensive medical clinic management platform covering patient registration, doctor queues, examination workflow, pharmacy dispensing, insurance processing, and revenue reporting.",
        stats: { dashboardModules: "Dashboard Modules", workflowSteps: "Workflow Steps" },
        highlights: [
          "Patient registration & queue management",
          "Doctor examination workflow with prescriptions",
          "Pharmacy dispensing & inventory tracking",
          "Insurance (BHYT) claim processing",
          "Revenue analytics & reporting dashboard",
          "Multi-role: Reception → Doctor → Pharmacy → Cashier",
        ],
      },
    },
  },

  // ── Tech Stack ──
  tech: {
    sectionTag: "// Tech Stack",
    heading: "Technologies I Use",
    subtitle: "A modern, production-tested stack focused on performance, type safety, and developer experience.",
    sections: {
      frontend: "Frontend",
      backend: "Backend & Database",
      devops: "DevOps & Hosting",
      tools: "Tools & Integrations",
    },
  },

  // ── Services ──
  services: {
    sectionTag: "// Services",
    heading: "How I Can Help",
    subtitle: "From greenfield builds to production optimization — I deliver end-to-end solutions.",
    items: {
      saas: {
        title: "SaaS Development",
        description: "Multi-tenant platforms with auth, billing, dashboards, and API design from scratch.",
      },
      fullstack: {
        title: "Full-Stack Web Apps",
        description: "End-to-end development with Next.js + Supabase — from DB schema to production deploy.",
      },
      government: {
        title: "Government & Enterprise Portals",
        description: "Public-facing portals with admin panels, AI chatbots, and digital transformation tools.",
      },
      ai: {
        title: "AI Integration",
        description: "Document AI, OCR, LLM-powered tools, and automation integrated into your workflow.",
      },
      devops: {
        title: "Deployment & DevOps",
        description: "Vercel, Docker, CI/CD pipelines, domain setup, SSL, and production hardening.",
      },
      audit: {
        title: "Performance & Security Audit",
        description: "Lighthouse optimization, RLS policies, rate limiting, and penetration testing.",
      },
      excel: {
        title: "Excel & Spreadsheet Automation",
        description: "Complex formulas, Power Query, dashboards, data validation, and automated reporting templates.",
      },
      scraping: {
        title: "Data Processing & Web Scraping",
        description: "Automated data collection, CSV/Excel cleaning, transformation, deduplication, and pipeline scripts.",
      },
      finance: {
        title: "Financial Modeling & Analysis",
        description: "DCF models, 3-statement financials, ratio analysis, budgeting templates, and investment dashboards.",
      },
      scripts: {
        title: "Script & Macro Development",
        description: "VBA macros, Google Apps Script, Pine Script, Amibroker AFL, and workflow automation bots.",
      },
    },
    startingFrom: "from",
  },

  // ── Blog ──
  blog: {
    sectionTag: "// Writing & Case Studies",
    heading: "How I Build Things",
    subtitle: "Deep dives into real projects — architecture decisions, technical challenges, and lessons learned.",
    readMore: "Read Case Study",
    readTime: "min read",
    categories: {
      "case-study": "Case Study",
      tutorial: "Tutorial",
      insight: "Insight",
    },
    items: {
      "building-multi-tenant-saas-from-scratch": {
        title: "Building a Multi-Tenant SaaS Platform from Scratch",
        excerpt: "How I architected ChoGiaKiem.vn — a marketplace serving multiple vendors with 630+ API routes, auto subdomain routing, POS, inventory, and e-invoicing — using Next.js, Supabase, and Vercel.",
      },
      "digitizing-government-services-commune-portal": {
        title: "Digitizing Government Services: Building a Commune Portal for 20K+ Residents",
        excerpt: "How I built XaGiaKiem.gov.vn — a government digital portal with AI chatbot, online public services, and digital transformation dashboard — transforming how 20,000+ residents interact with local government.",
      },
    },
  },

  // ── Contact ──
  contact: {
    sectionTag: "// Get In Touch",
    heading: "Let's Build Something Great",
    subtitle: "Have a project in mind? I'm available for freelance work and always excited to discuss new opportunities.",
    email: "Email",
    chat: "Chat with me",
    responseTime: "Response Time",
    responseValue: "Usually within 2-4 hours (UTC+7)",
    form: {
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "your@email.com",
      projectType: "Project Type",
      selectCategory: "Select a category",
      optSaas: "SaaS / Web Application",
      optWebsite: "Website / Landing Page",
      optAi: "AI Integration / Automation",
      optDeployment: "Deployment / DevOps",
      optOther: "Other",
      message: "Message",
      messagePlaceholder: "Tell me about your project...",
      send: "Send Message",
    },
  },

  // ── Footer ──
  footer: {
    builtWith: "Built with",
    using: "using Next.js + Tailwind + Vercel",
  },

  // ── Common ──
  common: {
    language: "Language",
    currency: "Currency",
  },
};

export default en;
