import type { Translations } from "./types";

const vi: Translations = {
  // ── Header / Nav ──
  nav: {
    projects: "Dự Án",
    tech: "Công Nghệ",
    services: "Dịch Vụ",
    blog: "Bài Viết",
    contact: "Liên Hệ",
    hireMe: "Thuê Tôi",
  },

  // ── Hero ──
  hero: {
    badge: "Sẵn sàng nhận dự án freelance",
    greeting: "Xin chào, tôi là",
    title: "Lập Trình Viên Full-Stack & Tư Vấn Chuyển Đổi Số",
    description: "Từ founder & quản lý dự án chuyển sang lập trình. Tôi xây dựng <strong>nền tảng SaaS</strong>, <strong>dịch vụ số cho chính quyền</strong> và <strong>công cụ AI</strong> — dẫn dắt các dự án chuyển đổi số từ chiến lược đến triển khai.",
    cta: "Xem Dự Án",
    liveDemo: "Demo Trực Tiếp",
    stats: {
      apiRoutes: "API Routes",
      liveProjects: "Dự Án Live",
      usersServed: "Người Dùng",
      dbTables: "Bảng CSDL",
    },
  },

  // ── Projects ──
  projects: {
    sectionTag: "// Dự Án Nổi Bật",
    heading: "Những Gì Tôi Đã Xây Dựng",
    subtitle: "Ứng dụng production phục vụ người dùng thực — từ SaaS đa tenants đến dịch vụ số chính quyền.",
    visitSite: "Truy Cập",
    categories: {
      saas: "Nền Tảng SaaS",
      government: "Chính Quyền",
      ai: "AI / Tự Động Hóa",
      business: "Công Cụ Kinh Doanh",
      healthcare: "Y Tế",
      infrastructure: "Hạ Tầng",
    },
    items: {
      chogiakiem: {
        subtitle: "Nền Tảng Sàn Thương Mại Đa Tenants",
        description: "Sàn thương mại đa tenants vận hành POS, quản lý kho, kế toán, hóa đơn điện tử, nhân sự/lương và gian hàng — tất cả với định tuyến subdomain tự động và phân quyền theo vai trò.",
        stats: { apiRoutes: "API Routes", components: "Components", dbTables: "Bảng CSDL", appModules: "Modules" },
        highlights: [
          "Sàn đa vendor với định tuyến subdomain tự động",
          "Hệ thống POS với quét mã vạch & in hóa đơn",
          "Theo dõi tồn kho realtime đa kho",
          "Tích hợp hóa đơn điện tử với cơ quan thuế",
          "Dashboard nhân sự: lương, chấm công, nghỉ phép",
          "Phân quyền: Admin → Vendor → Shipper → Public",
        ],
      },
      xagiakiem: {
        subtitle: "Cổng Thông Tin Số Xã/Phường",
        description: "Website chính quyền phục vụ 20.000+ cư dân xã Gia Kiệm. 34+ chuyên mục, chatbot AI, dashboard chuyển đổi số và dịch vụ công trực tuyến.",
        stats: { publicSections: "Chuyên Mục", residentsServed: "Cư Dân", adminModules: "Modules Admin" },
        highlights: [
          "Chatbot AI hỏi đáp thủ tục hành chính",
          "Dashboard chuyển đổi số với dữ liệu realtime",
          "Dịch vụ công trực tuyến (TTHC)",
          "Cổng thông tin bầu cử 2026",
          "Giới thiệu sản phẩm OCOP địa phương",
          "Cổng thông tin khu công nghiệp & đầu tư",
        ],
      },
      vanbanplus: {
        subtitle: "Công Cụ Soạn Văn Bản AI",
        description: "Trình soạn văn bản hành chính thông minh sử dụng AI. Hỗ trợ trích xuất PDF bằng OCR và tạo văn bản từ mẫu.",
        highlights: [
          "Soạn văn bản tự động từ mẫu bằng AI",
          "Trích xuất PDF với nhiều OCR fallback",
          "Tuân thủ quy chuẩn văn bản hành chính VN",
          "Thư viện mẫu văn bản thường dùng",
          "Workspace quản lý văn bản có xác thực",
        ],
      },
      giakiemso: {
        subtitle: "Công Cụ Kinh Doanh & Xử Lý Tài Liệu AI",
        description: "Bộ công cụ kinh doanh tích hợp Google Document AI cho OCR, trích xuất CCCD, tính lãi vay, tính thuế và tạo mã VietQR.",
        stats: { aiProcessors: "Bộ Xử Lý AI", documentation: "Tài Liệu" },
        highlights: [
          "Google Document AI trích xuất dữ liệu có cấu trúc",
          "Tự động trích xuất CCCD",
          "Bộ xử lý tài liệu đa cấu hình",
          "Tính lãi vay & thuế cho doanh nghiệp",
          "Tạo mã thanh toán VietQR",
          "Hệ thống quản lý hóa đơn",
        ],
      },
      phongkham: {
        subtitle: "Nền Tảng Quản Lý Phòng Khám",
        description: "Hệ thống quản lý phòng khám toàn diện: đăng ký bệnh nhân, hàng đợi bác sĩ, quy trình khám, cấp phát thuốc, BHYT và báo cáo doanh thu.",
        stats: { dashboardModules: "Modules Dashboard", workflowSteps: "Bước Quy Trình" },
        highlights: [
          "Đăng ký bệnh nhân & quản lý hàng đợi",
          "Quy trình khám bệnh với kê đơn thuốc",
          "Cấp phát thuốc & theo dõi tồn kho",
          "Xử lý bảo hiểm y tế (BHYT)",
          "Dashboard phân tích doanh thu",
          "Đa vai trò: Lễ tân → Bác sĩ → Dược → Thu ngân",
        ],
      },
    },
  },

  // ── Tech Stack ──
  tech: {
    sectionTag: "// Công Nghệ Sử Dụng",
    heading: "Công Nghệ Tôi Dùng",
    subtitle: "Stack hiện đại, đã kiểm chứng production — tập trung vào hiệu năng, type safety và trải nghiệm developer.",
    sections: {
      frontend: "Frontend",
      backend: "Backend & CSDL",
      devops: "DevOps & Hosting",
      tools: "Công Cụ & Tích Hợp",
    },
  },

  // ── Services ──
  services: {
    sectionTag: "// Dịch Vụ",
    heading: "Tôi Có Thể Giúp Gì",
    subtitle: "Từ xây dựng mới đến tối ưu production — tôi cung cấp giải pháp toàn diện.",
    items: {
      saas: {
        title: "Phát Triển SaaS",
        description: "Nền tảng đa tenants với xác thực, thanh toán, dashboard và thiết kế API từ đầu.",
      },
      fullstack: {
        title: "Ứng Dụng Web Full-Stack",
        description: "Phát triển end-to-end với Next.js + Supabase — từ schema CSDL đến triển khai production.",
      },
      government: {
        title: "Cổng Thông Tin Chính Quyền & Doanh Nghiệp",
        description: "Cổng thông tin với admin panel, chatbot AI và công cụ chuyển đổi số.",
      },
      ai: {
        title: "Tích Hợp AI",
        description: "Document AI, OCR, công cụ LLM và tự động hóa tích hợp vào quy trình làm việc.",
      },
      devops: {
        title: "Triển Khai & DevOps",
        description: "Vercel, Docker, CI/CD pipeline, thiết lập domain, SSL và hardening production.",
      },
      audit: {
        title: "Kiểm Tra Hiệu Năng & Bảo Mật",
        description: "Tối ưu Lighthouse, RLS policies, rate limiting và kiểm thử xâm nhập.",
      },
      excel: {
        title: "Tự Động Hóa Excel & Bảng Tính",
        description: "Công thức phức tạp, Power Query, dashboard, data validation và mẫu báo cáo tự động.",
      },
      scraping: {
        title: "Xử Lý Dữ Liệu & Thu Thập Web",
        description: "Thu thập dữ liệu tự động, làm sạch CSV/Excel, chuyển đổi, loại bỏ trùng lặp và pipeline scripts.",
      },
      finance: {
        title: "Mô Hình Tài Chính & Phân Tích",
        description: "Mô hình DCF, báo cáo tài chính 3 bảng, phân tích tỷ số, mẫu ngân sách và dashboard đầu tư.",
      },
      scripts: {
        title: "Phát Triển Script & Macro",
        description: "VBA macros, Google Apps Script, Pine Script, Amibroker AFL và bot tự động hóa quy trình.",
      },
    },
    startingFrom: "từ",
  },

  // ── Blog ──
  blog: {
    sectionTag: "// Bài Viết & Case Study",
    heading: "Cách Tôi Xây Dựng",
    subtitle: "Phân tích chuyên sâu các dự án thực — quyết định kiến trúc, thách thức kỹ thuật và bài học kinh nghiệm.",
    readMore: "Đọc Case Study",
    readTime: "phút đọc",
    categories: {
      "case-study": "Case Study",
      tutorial: "Hướng Dẫn",
      insight: "Góc Nhìn",
    },
    items: {
      "building-multi-tenant-saas-from-scratch": {
        title: "Xây Dựng Nền Tảng SaaS Đa Tenants Từ Đầu",
        excerpt: "Cách tôi thiết kế kiến trúc ChoGiaKiem.vn — sàn thương mại đa vendor với 630+ API routes, định tuyến subdomain tự động, POS, kho và hóa đơn điện tử — dùng Next.js, Supabase và Vercel.",
      },
      "digitizing-government-services-commune-portal": {
        title: "Số Hóa Dịch Vụ Công: Xây Dựng Cổng Thông Tin Cho 20K+ Cư Dân",
        excerpt: "Cách tôi xây dựng XaGiaKiem.gov.vn — cổng thông tin số với chatbot AI, dịch vụ công trực tuyến và dashboard chuyển đổi số — thay đổi cách 20.000+ cư dân tương tác với chính quyền.",
      },
    },
  },

  // ── Contact ──
  contact: {
    sectionTag: "// Liên Hệ",
    heading: "Hãy Cùng Xây Dựng Điều Tuyệt Vời",
    subtitle: "Bạn có dự án cần thực hiện? Tôi sẵn sàng nhận freelance và luôn hào hứng thảo luận cơ hội mới.",
    email: "Email",
    chat: "Chat với tôi",
    responseTime: "Thời Gian Phản Hồi",
    responseValue: "Thường trong 2-4 giờ (UTC+7)",
    form: {
      name: "Tên",
      namePlaceholder: "Tên của bạn",
      email: "Email",
      emailPlaceholder: "email@cuaban.com",
      projectType: "Loại Dự Án",
      selectCategory: "Chọn danh mục",
      optSaas: "SaaS / Ứng Dụng Web",
      optWebsite: "Website / Landing Page",
      optAi: "Tích Hợp AI / Tự Động Hóa",
      optDeployment: "Triển Khai / DevOps",
      optOther: "Khác",
      message: "Tin Nhắn",
      messagePlaceholder: "Hãy cho tôi biết về dự án của bạn...",
      send: "Gửi Tin Nhắn",
    },
  },

  // ── Footer ──
  footer: {
    builtWith: "Xây dựng với",
    using: "bằng Next.js + Tailwind + Vercel",
  },

  // ── Common ──
  common: {
    language: "Ngôn Ngữ",
    currency: "Tiền Tệ",
  },
};

export default vi;
