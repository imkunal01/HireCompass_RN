import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { streamText, isGeminiConfigured, extractJSON, formatGeminiError } from "../lib/gemini";
import { SNIPPET_LENGTH_CONFIG, SnippetLength } from "../types/project";

const router = Router();

function buildEmailPrompt(job: any, userProfile: any, tone: string) {
  return `You are a professional job application writer helping a candidate apply for jobs.

Write a personalized cold email for this opportunity:
- Company: ${job.company}
- Role: ${job.title}
- Key Skills: ${(job.skills || []).join(", ")}
- Description: ${job.description || ""}

Applicant Profile:
${JSON.stringify(userProfile, null, 2)}

Tone: ${tone}

Instructions:
1. Write a compelling cold email with: greeting, 2-sentence intro, why you're a great fit (mention 2-3 specific skills/projects from profile), professional closing
2. Keep it under 200 words
3. After the email, write exactly 3 short personalized tips on separate lines

Format your response EXACTLY like this:
<EMAIL>
Subject: [subject line here]

[email body here]
</EMAIL>
<TIPS>
["tip 1 text", "tip 2 text", "tip 3 text"]
</TIPS>`;
}

function buildCoverLetterPrompt(job: any, userProfile: any, tone: string) {
  return `Write a professional cover letter for this job application:
- Company: ${job.company}
- Role: ${job.title}
- Key Skills: ${(job.skills || []).join(", ")}

Applicant Profile:
${JSON.stringify(userProfile, null, 2)}

Tone: ${tone}

Write a 3-paragraph cover letter (intro, body with 2-3 achievements, closing). Max 300 words.
Format:
<COVER>
[cover letter here]
</COVER>`;
}

// POST /api/ai/generate-email
router.post("/generate-email", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys",
      });
    }

    const { job, userProfile, templateType = "Professional", type = "email" } = req.body;

    if (!job?.company || !job?.title) {
      return res.status(400).json({ error: "Job company and title are required" });
    }

    const prompt =
      type === "cover"
        ? buildCoverLetterPrompt(job, userProfile, templateType)
        : buildEmailPrompt(job, userProfile, templateType);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Cache-Control", "no-cache");

    const stream = streamText(prompt);
    stream.pipe(res);
  } catch (error) {
    console.error("[POST /api/ai/generate-email]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// POST /api/ai/generate-snippet
router.post("/generate-snippet", requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectName, description, techStack, roleCategories, metrics, links, roleTag, length } = req.body;

    if (!projectName || !roleTag || !length) {
      return res.status(400).json({ error: "projectName, roleTag, and length are required" });
    }

    const lengthConfig = SNIPPET_LENGTH_CONFIG[length as SnippetLength];
    if (!lengthConfig) {
      return res.status(400).json({ error: "Invalid length value" });
    }

    const techStackStr = (techStack || []).join(", ") || "Not specified";
    const metricsStr = (metrics || []).length > 0 ? (metrics as string[]).map((m) => `- ${m}`).join("\n") : "None provided";
    const linksStr = [links?.github ? `GitHub: ${links.github}` : null, links?.live ? `Live: ${links.live}` : null]
      .filter(Boolean)
      .join(", ") || "None";

    const prompt = `You are an expert career coach and technical writer specializing in job applications.

A candidate wants a tailored project description snippet for a specific role.

## Full Project Context (use all of this to write the snippet)

**Project Name**: ${projectName}

**Master Description**:
${description || "Not provided"}

**Tech Stack**: ${techStackStr}

**Role Categories**: ${(roleCategories || []).join(", ") || "Not specified"}

**Impact & Metrics**:
${metricsStr}

**Project Links**: ${linksStr}

---

## Task

Write a project description snippet tailored specifically for a **${roleTag}** role.

Requirements:
- Target word count: **${lengthConfig.words}** (maximum ${lengthConfig.maxWords} words)
- Emphasize skills and aspects most relevant to the "${roleTag}" role
- Use active, confident language — first person is fine
- Lead with the most impressive or relevant aspect
- Include 1-2 specific metrics/impact points if available
- Do NOT use bullet points — write as flowing prose
- Do NOT include a project title header — just the description paragraph(s)
- Sound natural and genuine, not like a generic template

Return JSON with exactly one key:
{ "snippet": "..." }`;

    const result = await extractJSON<{ snippet: string }>(prompt);

    if (!result.snippet) {
      return res.status(500).json({ error: "AI returned empty snippet" });
    }

    return res.json({ snippet: result.snippet.trim() });
  } catch (error: any) {
    console.error("[POST /api/ai/generate-snippet]", error);
    const msg = error?.message || "Internal server error";
    return res.status(500).json({ error: msg });
  }
});

// POST /api/ai/learning-plan
router.post("/learning-plan", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({ error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys" });
    }

    const { missingSkills } = req.body;
    if (!missingSkills || missingSkills.length === 0) {
      return res.status(400).json({ error: "Missing skills array required" });
    }

    const prompt = `Create a practical learning plan for these skills that are needed for a job application:
${missingSkills.map((s: any) => `- ${s.skill} (${s.importance}, estimated ${s.learnTime})`).join("\n")}

Write a structured markdown learning plan with:
1. Priority order (must-have skills first)
2. For each skill: what to learn, best free resources, mini-project to prove proficiency
3. Weekly schedule suggestion
4. Keep it motivating and practical

Use clear markdown headers and bullet points.`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Cache-Control", "no-cache");

    const stream = streamText(prompt);
    stream.pipe(res);
  } catch (error) {
    console.error("[POST /api/ai/learning-plan]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// POST /api/ai/match-score
router.post("/match-score", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys",
      });
    }

    const { job, user, jobId } = req.body;

    if (!job || !user) {
      return res.status(400).json({ error: "Job and user profile required" });
    }

    const prompt = `Compare this job posting with the applicant profile and evaluate fit.

Job:
${JSON.stringify(job, null, 2)}

Applicant Profile:
${JSON.stringify(user, null, 2)}

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": 0-100,
  "grade": "Strong Fit" or "Good Fit" or "Partial Fit" or "Weak Fit",
  "matched": [{ "skill": "skill name", "evidence": "where in profile this appears" }],
  "missing": [{ "skill": "skill name", "importance": "must-have" or "nice-to-have", "learnTime": "e.g. 1 week" }],
  "suggestions": [{ "action": "specific actionable suggestion", "priority": "high" or "medium" }],
  "summary": "2 sentence overall assessment"
}`;

    const result = await extractJSON<any>(prompt);

    if (jobId) {
      try {
        const client = await clientPromise;
        const db = client.db();
        await db.collection("matchScores").updateOne(
          { userId: req.user!.id, jobId },
          { $set: { ...result, userId: req.user!.id, jobId, computedAt: new Date() } },
          { upsert: true }
        );
      } catch {
        // Non-critical
      }
    }

    return res.json(result);
  } catch (error: any) {
    console.error("[POST /api/ai/match-score]", error);
    if (error instanceof SyntaxError) {
      return res.status(422).json({ error: "AI returned invalid JSON. Please try again." });
    }
    const { message, retryAfter } = formatGeminiError(error);
    if (message.includes("rate limit") || message.includes("quota")) {
      res.setHeader("Retry-After", String(retryAfter || ""));
      return res.status(429).json({ error: message, retryAfter });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
