/**
 * types/outreach.ts
 * All types for the AI-Powered Outreach Automation module.
 */

// ── Recruiter / Company Data ─────────────────────────────────────────────────

export interface RecruiterRow {
  /** Internal id (generated after extraction) */
  id: string
  recruiterName?: string
  recruiterEmail: string
  recruiterRole?: string
  companyName: string
  companyDescription?: string
  industry?: string
  productsServices?: string
  techStack?: string[]
  hiringRequirements?: string
  additionalNotes?: string
  /** Email validation result */
  emailValid: boolean
  /** Whether this row was flagged as a duplicate */
  isDuplicate: boolean
}

// ── Company Context (AI Analysis Output) ─────────────────────────────────────

export interface CompanyContext {
  companyName: string
  summary: string
  industry: string
  products: string[]
  technologies: string[]
  talkingPoints: string[]
  relevantSkills: string[]
}

// ── Outreach Campaign ─────────────────────────────────────────────────────────

export type OutreachCampaignStatus = "DRAFT" | "GENERATING" | "READY" | "SENDING" | "SENT" | "ARCHIVED"

export interface OutreachCampaign {
  _id?: string
  id: string
  userId: string
  name: string
  status: OutreachCampaignStatus
  totalRecords: number
  sentCount: number
  repliedCount: number
  interviewCount: number
  /** The selected CV document id to attach */
  attachedCvId?: string | null
  /** Sending settings */
  dailyLimit: number       // default 20
  delaySeconds: number     // default 30
  createdAt: string | Date
  updatedAt: string | Date
}

// ── Outreach Record (one per recruiter in a campaign) ─────────────────────────

export type OutreachStatus =
  | "PENDING"      // email not yet generated
  | "DRAFT"        // email generated, not reviewed
  | "APPROVED"     // user approved, ready to send
  | "SKIPPED"      // user skipped this recruiter
  | "SENDING"      // currently sending
  | "SENT"         // email sent successfully
  | "REPLIED"      // recruiter replied
  | "INTERVIEW"    // interview scheduled
  | "OFFER"        // offer received
  | "REJECTED"     // rejected
  | "FOLLOW_UP_SENT" // follow-up sent

export interface OutreachRecord {
  _id?: string
  id: string
  campaignId: string
  userId: string

  // Recruiter / company data
  recruiterName: string
  recruiterEmail: string
  recruiterRole: string
  companyName: string
  companyDescription: string
  industry: string
  techStack: string[]
  hiringRequirements: string
  additionalNotes: string

  // AI-generated content
  companyContext?: CompanyContext
  generatedEmail?: string
  emailSubject?: string

  // User edits
  finalEmail?: string
  finalSubject?: string

  // Status tracking
  status: OutreachStatus
  sentAt?: string | Date | null
  repliedAt?: string | Date | null
  messageId?: string | null         // from Resend
  followUpSentAt?: string | Date | null

  // Linked opportunity (auto-created on send)
  opportunityId?: string | null

  createdAt: string | Date
  updatedAt: string | Date
}

// ── User Outreach Profile ─────────────────────────────────────────────────────

export interface OutreachProfile {
  userId: string
  fullName: string
  email: string
  phone?: string
  linkedin?: string
  github?: string
  portfolio?: string
  skills: string[]
  bio: string
  projects: OutreachProject[]
  updatedAt: string | Date
}

export interface OutreachProject {
  id: string
  name: string
  description: string
  techStack: string[]
  link?: string
}

// ── CV Document ────────────────────────────────────────────────────────────────

export type DocumentType = "RESUME" | "COVER_LETTER" | "PORTFOLIO" | "TRANSCRIPT" | "OTHER"

export interface CVDocument {
  _id?: string
  id: string
  userId: string
  name: string
  type: DocumentType
  /** Role/target this CV is customized for (e.g. "SWE Intern", "PM Intern") */
  targetRole?: string
  /** File size in bytes */
  sizeBytes: number
  /** MIME type — typically application/pdf */
  mimeType: string
  /** Base64 encoded file data (stored in MongoDB for simplicity) */
  data: string
  uploadedAt: string | Date
  updatedAt: string | Date
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface OutreachStats {
  totalCampaigns: number
  totalRecruitersSaved: number
  totalEmailsSent: number
  totalReplied: number
  totalInterviews: number
  totalOffers: number
  responseRate: number
  interviewRate: number
}

export interface CampaignStats {
  campaignId: string
  total: number
  approved: number
  skipped: number
  sent: number
  replied: number
  interview: number
  offer: number
  rejected: number
  pending: number
}

// ── Status config for UI ──────────────────────────────────────────────────────

export const OUTREACH_STATUS_CONFIG: Record<OutreachStatus, {
  label: string
  color: string
  bgColor: string
  textColor: string
}> = {
  PENDING:        { label: "Pending",       color: "#94a3b8", bgColor: "bg-slate-100",   textColor: "text-slate-500" },
  DRAFT:          { label: "Draft",         color: "#6366f1", bgColor: "bg-indigo-50",   textColor: "text-indigo-600" },
  APPROVED:       { label: "Approved",      color: "#8b5cf6", bgColor: "bg-violet-50",   textColor: "text-violet-600" },
  SKIPPED:        { label: "Skipped",       color: "#94a3b8", bgColor: "bg-slate-100",   textColor: "text-slate-400" },
  SENDING:        { label: "Sending...",    color: "#f59e0b", bgColor: "bg-amber-50",    textColor: "text-amber-600" },
  SENT:           { label: "Sent",          color: "#06b6d4", bgColor: "bg-cyan-50",     textColor: "text-cyan-600" },
  REPLIED:        { label: "Replied",       color: "#10b981", bgColor: "bg-emerald-50",  textColor: "text-emerald-600" },
  INTERVIEW:      { label: "Interview 🎉",  color: "#a855f7", bgColor: "bg-purple-50",   textColor: "text-purple-600" },
  OFFER:          { label: "Offer 🏆",      color: "#10b981", bgColor: "bg-emerald-50",  textColor: "text-emerald-700" },
  REJECTED:       { label: "Rejected",      color: "#ef4444", bgColor: "bg-rose-50",     textColor: "text-rose-600" },
  FOLLOW_UP_SENT: { label: "Follow-up Sent",color: "#f59e0b", bgColor: "bg-amber-50",   textColor: "text-amber-700" },
}
