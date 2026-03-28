// ============================================================================
// 📊 Dashboard Types — Multi-platform freelancing management
// Designed to support: Freelancer.com, Upwork, Fiverr, etc.
// ============================================================================

/** Supported freelancing platforms */
export type Platform = "freelancer" | "upwork" | "fiverr" | "toptal" | "other";

/** Unified bid/proposal across all platforms */
export interface Bid {
  id: string;
  platformBidId: string; // Original ID from platform
  platform: Platform;
  projectId: string;
  projectTitle: string;
  projectUrl: string;
  amount: number;
  currency: string;
  period: number; // days
  description: string;
  status: "active" | "awarded" | "rejected" | "retracted" | "expired";
  projectStatus: "active" | "closed" | "frozen" | "unknown";
  bidCount: number; // competitors
  budgetMin: number;
  budgetMax: number;
  submittedAt: string; // ISO date
  clientName?: string;
  clientCountry?: string;
  skills: string[];
  // v2 enriched fields
  projectDescription?: string; // full project description
  shortlisted?: boolean;       // client shortlisted this bid
  highlighted?: boolean;       // bid is highlighted/sponsored
  bidRank?: number;            // position among all bids (1 = top)
}

/** Unified message thread */
export interface MessageThread {
  id: string;
  platform: Platform;
  threadId: string;
  projectId?: string;
  projectTitle?: string;
  clientUsername: string;
  clientName?: string;
  lastMessage: string;
  lastMessageAt: string; // ISO date
  isRead: boolean;
  messageCount: number;
  messages: Message[];
}

export interface Message {
  id: string;
  from: "me" | "client" | "system";
  username: string;
  text: string;
  sentAt: string; // ISO date
}

/** Unified project listing from search */
export interface ProjectListing {
  id: string;
  platform: Platform;
  platformProjectId: string;
  title: string;
  description: string;
  url: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  bidCount: number;
  avgBid: number;
  skills: string[];
  clientCountry?: string;
  clientRating?: number;
  postedAt: string; // ISO date
  alreadyBid: boolean;
}

/** Dashboard stats summary */
export interface DashboardStats {
  totalBids: number;
  activeBids: number;
  closedBids: number;   // projectStatus === "closed" (we lost)
  frozenBids: number;   // projectStatus === "frozen"
  awarded: number;
  unreadMessages: number;
  platformBreakdown: { platform: Platform; count: number }[];
}

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ── Multi-platform income tracking ─────────────────────────────────────────

/** Manual income entry (Fiverr order, AI annotation session, etc.) */
export interface IncomeEntry {
  id: string;
  platform: string; // 'fiverr' | 'dataannotation' | 'outlier' | 'remotasks' | 'upwork' | 'other'
  description: string;
  amount: number;
  currency: string;
  hoursSpent?: number;
  earnedAt: string; // ISO date (DATE)
  createdAt: string;
}

/** Fiverr gig (manually tracked) */
export interface FiverrGig {
  id: string;
  title: string;
  category: string;
  status: "draft" | "active" | "paused";
  priceBasic?: number;
  priceStandard?: number;
  pricePremium?: number;
  gigUrl?: string;
  description?: string;
  impressions: number;
  clicks: number;
  ordersTotal: number;
  ordersPending: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

/** Platform setup status card */
export interface PlatformCard {
  id: string;
  name: string;
  displayName: string;
  url: string;
  status: "active" | "setup" | "planned";
  color: string;
  description: string;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  key: string;       // unique key for localStorage
  label: string;
  url?: string;      // external link
  action?: string;   // description of what to do
}
