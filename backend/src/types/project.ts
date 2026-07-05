export type SnippetLength = "short" | "medium" | "long"

export interface ProjectSnippet {
  id: string
  roleTag: string          // e.g. "Backend SDE Intern", "ML Engineer"
  length: SnippetLength    // short ~50w, medium ~150w, long ~300w (AI up to 500w)
  content: string
  isAiGenerated: boolean
  createdAt: string | Date
}

export interface ProjectLinks {
  github?: string | null
  live?: string | null
}

export interface Project {
  _id?: string
  id: string
  userId: string
  name: string
  description: string          // long master description — full context for AI
  techStack: string[]          // ["Next.js", "MongoDB", "Groq"]
  roleCategories: string[]     // ["fullstack", "backend"] — broad category hints
  metrics: string[]            // ["reduced load time 40%", "10k users"]
  isFeatured?: boolean
  links: ProjectLinks
  snippets: ProjectSnippet[]
  createdAt: string | Date
  updatedAt: string | Date
}

// Used by Form Kit API — snippet ranked against an opportunity
export interface FormKitItem {
  projectId: string
  projectName: string
  techStack: string[]
  matchScore: number           // 0–100 based on skill overlap
  matchedSkills: string[]      // which skills matched
  snippets: {
    short?: ProjectSnippet | null
    medium?: ProjectSnippet | null
    long?: ProjectSnippet | null
  }
  hasAnySnippet: boolean
}

// Common role tag suggestions for the autocomplete input
export const ROLE_TAG_SUGGESTIONS = [
  "Frontend SDE Intern",
  "Backend SDE Intern",
  "Fullstack SDE Intern",
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "Software Engineer",
  "Software Engineer Intern",
  "ML Engineer",
  "ML Intern",
  "Data Scientist",
  "Data Analyst",
  "DevOps Engineer",
  "Cloud Engineer",
  "Mobile Developer",
  "React Developer",
  "Node.js Developer",
  "Python Developer",
  "Product Engineer",
  "Platform Engineer",
]

export const SNIPPET_LENGTH_CONFIG: Record<SnippetLength, { label: string; words: string; maxWords: number }> = {
  short:  { label: "Short",  words: "~50 words",  maxWords: 70 },
  medium: { label: "Medium", words: "~150 words", maxWords: 200 },
  long:   { label: "Long",   words: "~300 words", maxWords: 500 },
}
