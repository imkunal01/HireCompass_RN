# HireCompass — Comprehensive Product & Technical Documentation

**Live App:** https://hirecompass.vercel.app/
**Repo:** github.com/imkunal01/HireCompass
**Tagline:** Premium Job Application Tracker — Organize, monitor, and optimize your job applications, interviews, and offers in one professional dashboard.

---

## 1. What HireCompass Is

HireCompass is an AI-powered job search operations platform. It replaces the typical "spreadsheet + email + sticky notes" job hunt setup with one system that covers four connected jobs:

1. Track every opportunity through a visual pipeline (Kanban).
2. Generate and send personalized cold outreach to recruiters at scale.
3. Store project/portfolio content once and reuse AI-tailored versions of it in applications.
4. (Planned) Track daily DSA/interview prep and fitness habits alongside the job search — because job hunting and interview prep are the same project.

It's built as a single Next.js 14 full-stack app — no separate backend service — with MongoDB as the data layer and Gemini/Groq for AI generation.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14.2 (App Router, Server Components, Turbo) | Unified frontend + backend (API routes) |
| Language | TypeScript | Type safety across app and API |
| Database | MongoDB (official `mongodb` driver) | Document store for all entities |
| Auth | Custom JWT sessions (`jose`, `bcryptjs`) | Login, password hashing, session validation |
| Styling | Tailwind CSS, `class-variance-authority`, `clsx`, `tailwind-merge` | Utility-first styling with variant management |
| UI Components | Shadcn UI, `lucide-react` | Accessible, composable component primitives + icons |
| State (Client) | Zustand | Global client state (UI state, selected filters, etc.) |
| State (Server/Cache) | React Query (`@tanstack/react-query`) | Data fetching, caching, background refetch |
| Forms | React Hook Form + Zod | Form state + schema validation |
| Drag & Drop | `@dnd-kit` | Powers the Kanban board interactions |
| Theming | `next-themes` | Dark/light mode |
| AI | `@google/genai`, `@google/generative-ai` (Gemini), `groq-sdk` (Groq) | Content generation, contextualization |
| Email | Resend, Nodemailer | Transactional + campaign email delivery |
| File Parsing | `papaparse` (CSV), `xlsx` (Excel), `pdf-parse` (PDF) | Import/parse uploaded documents and data |

**Why this stack works well for this product:** everything ships from one Next.js deployment (simple to host on Vercel, matches the live URL), MongoDB's flexible schema suits fast-changing entities like `Opportunity` and `Problem`, and having two AI providers (Gemini + Groq) gives redundancy/cost-flexibility for generation-heavy features like outreach emails and project snippets.

---

## 3. Core Features (Live / Implemented)

### 3.1 Opportunity Management — Kanban Pipeline
The center of the app. Every job opportunity is a card that moves through six stages:

`Saved → Interested → Applied → Assessment → Interview → Offer`

- **Rich data per opportunity:** company name, role, salary range, remote/hybrid/onsite status, application deadline, employment type (full-time/internship/contract).
- **Timeline history:** every stage change and event (e.g., "moved to Interview," "assessment deadline added") is logged with a timestamp, so the card doubles as an audit trail of the whole application lifecycle.
- **Drag-and-drop:** built with `@dnd-kit`, so moving a card between columns updates its status directly — no forms needed for the common case.

**Why it matters:** most job seekers lose track of *where* they stand with 20+ applications. This turns that into a single visual board instead of a fragmented spreadsheet or email search.

### 3.2 AI-Powered Outreach Automation
This is the most differentiated feature — cold outreach at scale without sounding templated.

- **Recruiter campaigns:** define a campaign, attach a list of recruiter contacts, and target them together instead of emailing one at a time.
- **AI contextualization:** before writing the email, the system feeds company signals (industry, tech stack, hiring needs) into Gemini/Groq so the generated email references *that specific company* instead of a generic pitch.
- **Delivery + tracking via Resend:** each email has a status — Draft → Sending → Sent → Replied — so you know what's actually landed and what got a response.
- **CV attachment:** resumes stored in the Document Management module can be attached directly to outreach emails without re-uploading.

**Why it matters:** cold outreach usually dies at the "sounds like a template" stage. Contextualizing per-company via AI, combined with tracked delivery status, turns outreach into a measurable channel instead of a one-off email blast.

### 3.3 Project & Portfolio Manager
- **Central project repository:** each project stores its description, links (GitHub/live demo), metrics (e.g., "reduced latency by 40%"), and tech stack.
- **AI snippet generation:** from one project entry, the AI generates multiple ready-to-use descriptions:
  - **By length:** Short (resume bullet), Medium (cover letter paragraph), Long (portfolio/interview narrative).
  - **By role tag:** e.g., a "Backend SDE Intern" version emphasizes API/database work; a "Full-Stack" version balances both ends.

**Why it matters:** the same project needs to be described differently depending on where it's going (resume vs. cover letter vs. recruiter chat). Instead of rewriting this every time, one project record generates all the variants on demand.

### 3.4 Form Kit — Application Helper
- **Match scoring:** compares your stored projects' tech stacks against a specific opportunity's required stack and produces a relevance/match score.
- **Quick copy:** surfaces the best-matching project snippets (from 3.3) as one-click copy text for filling out long application forms (Workday, Greenhouse, Lever-style forms) fast.

**Why it matters:** long application forms with "describe a relevant project" fields are the biggest time sink in applying. This shortcuts that by pre-ranking which project to use and giving copy-ready text.

### 3.5 Document Management
- **Centralized storage** for CVs, cover letters, portfolios, and transcripts.
- **Role tagging:** documents are tagged for specific role types (e.g., "SWE Intern," "Backend Intern") so the right version surfaces when needed.
- **Storage approach:** files are Base64-encoded and stored directly in MongoDB documents rather than a separate object store (e.g., S3) — a deliberate simplification that avoids managing a second storage service, at the cost of MongoDB document size limits for very large files.

### 3.6 Dashboard & Analytics
- **Aggregated stats:** Total Saved, Applications Sent, Interviews Scheduled, Response Rate.
- **Recent activity feed:** a running log of actions — new opportunity added, stage changed, interview scheduled — giving an at-a-glance "what happened since I last checked" view.

---

## 4. Architecture

### 4.1 Frontend (`app/`) — Next.js App Router route groups

```
app/
├── (auth)/            → Login, Registration, session handling
└── (dashboard)/        → Protected core app layout
    ├── analytics/       → Stats & visualizations
    ├── opportunities/   → Kanban board
    ├── outreach/        → Campaigns & email templates
    ├── projects/        → Project & snippet management
    ├── documents/       → Resume / cover letter storage
    ├── interviews/       → Interview scheduling
    ├── reminders/        → Task/deadline tracking
    └── assistant/        → AI chat interface
```

Route groups (parentheses) let `(auth)` and `(dashboard)` have entirely different layouts without affecting the URL structure — a standard Next.js App Router pattern for separating public vs. authenticated experiences.

### 4.2 Backend (`app/api/`) — Serverless API routes

| Route | Responsibility |
|---|---|
| `/api/auth` | JWT issuance, password hashing (bcrypt), session validation |
| `/api/opportunities` | CRUD for jobs; status updates driving the Kanban board |
| `/api/outreach` | Campaign creation, recruiter data processing, Resend integration |
| `/api/ai` | Orchestrates Gemini/Groq calls for emails, company context, project snippets |
| `/api/form-kit` | Tech-stack matching algorithm, relevance scoring |
| `/api/documents` | File upload, Base64 encode/decode, parsing (`pdf-parse`, `papaparse`) |

There is no standalone backend server — every route above is a Next.js serverless function, which is why the whole app deploys as one unit to Vercel.

### 4.3 Data Flow Example — Outreach Campaign
1. User creates a campaign in `/outreach` and attaches recruiter contacts.
2. Frontend calls `/api/ai` with company data → Gemini/Groq returns a contextualized draft.
3. User reviews/edits the draft, hits send.
4. `/api/outreach` calls Resend to dispatch the email and writes a `Sent` status to MongoDB.
5. Resend webhooks (or polling) update status to `Replied` when applicable.
6. Dashboard analytics aggregate these statuses into the Response Rate metric.

---

## 5. Planned Expansion: DSA & Goal Tracking Module

This is the next major addition — designed to sit **parallel** to the job-search features rather than replace them, since interview prep and job hunting run on the same timeline.

### 5.1 Daily Tracker
- Logs problems solved and contests attended across LeetCode, CodeChef, Codeforces, GeeksforGeeks, and HackerRank.
- Tracks non-coding habits too: gym sessions, diet adherence, internship study hours.
- **Consistency heatmap:** a GitHub-style contribution graph so prep consistency is visible at a glance, the same way commit streaks are.

### 5.2 Problem Tracking & Code Editor
- Saves problem links, topic tags, personal notes, and the actual solution code per problem.
- **Monaco editor embed** for viewing/copying saved solutions with real syntax highlighting (the same editor VS Code uses).
- Logs time spent per problem and tracks difficulty (Easy/Medium/Hard) — useful for spotting which topics are taking disproportionately long.

### 5.3 Custom Sheets & Roadmaps
- Curated topic roadmaps out of the box: DSA, Competitive Programming, OS, Computer Networks, OOPS.
- Users can build their own custom sheets, organize problems by topic, and see progress rings (visual % complete) per sheet.

### 5.4 Streak & Gamification
- **Streak logic:** a day counts as "active" only if a minimum threshold of daily goals is met (e.g., 60%) — this avoids the common streak-tracker flaw where doing one trivial thing keeps a streak alive.
- Framer Motion animations, confetti on full-day completion, and rotating motivational messages for engagement.
- **Physique tracking:** weekly weight and body-fat logging with progress charts — tying physical health into the same accountability system as coding prep.

### 5.5 New Data Models

| Model | Stores |
|---|---|
| `DailyLog` | Daily platform stats, gym, diet, study hours |
| `PhysiqueLog` | Weekly weight/measurement data |
| `Problem` | DSA problem metadata, notes, solution code |
| `Sheet` | User roadmaps and topic-wise progress |

### 5.6 Integration Plan
- New dedicated route: `app/(dashboard)/tracker/`, living alongside `opportunities/`, `projects/`, etc.
- New API routes under `app/api/tracker/` — e.g., `/api/tracker/daily-logs`, `/api/tracker/problems`.
- Zustand store expansion: `useDailyLogStore`, `useProblemStore`, following the same state pattern already used for opportunities/projects.

---

## 6. Feature Summary Table

| Module | Status | Core Value |
|---|---|---|
| Opportunity Kanban | ✅ Live | Visual pipeline replacing spreadsheets |
| AI Outreach Automation | ✅ Live | Personalized cold email at scale, with delivery tracking |
| Project & Portfolio Manager | ✅ Live | One project → many AI-tailored descriptions |
| Form Kit | ✅ Live | Fast, ranked application-form filling |
| Document Management | ✅ Live | Centralized, role-tagged resume/CV storage |
| Dashboard & Analytics | ✅ Live | At-a-glance job-search performance metrics |
| Daily Tracker | 🔜 Planned | Cross-platform DSA + habit consistency tracking |
| Problem Tracking & Editor | 🔜 Planned | Personal DSA solution repository with code editor |
| Custom Sheets & Roadmaps | 🔜 Planned | Structured topic-wise interview prep |
| Streak & Gamification | 🔜 Planned | Motivation layer for daily consistency |

---

## 7. Notes on Sourcing

This documentation is compiled from the project's internal architecture doc. The public GitHub repo (`github.com/imkunal01/HireCompass`) did not resolve at the time of writing — it may be private, renamed, or under a different account — and the live app at hirecompass.vercel.app is authentication-gated, so its internal pages couldn't be crawled directly. If the repo is private, share a direct file or make it public briefly to cross-check this against actual code (e.g., verify current API route names, model schemas).