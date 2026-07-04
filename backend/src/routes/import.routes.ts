import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { streamText, isGeminiConfigured } from "../lib/gemini";
import * as cheerio from "cheerio";

const router = Router();

const EXTRACTION_PROMPT = (content: string) => `
You are a precise job description parser. Extract structured information from the following job posting.

Return ONLY a valid JSON object with exactly these fields (no markdown, no backticks):
{
  "company": "company name or empty string",
  "role": "job title or empty string",
  "location": "location or empty string",
  "type": "Internship|Full-time|Contract|Part-time or empty string",
  "salary": "salary/stipend range or empty string",
  "deadline": "application deadline in YYYY-MM-DD format or empty string",
  "link": "direct application URL or empty string",
  "skills": ["skill1", "skill2"],
  "description": "2-3 sentence summary of the role",
  "confidence": 85
}

confidence is 0-100 based on how much info was found.

Job posting:
${content.slice(0, 12000)}
`;

// POST /api/import/text
router.post("/text", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys",
      });
    }

    const { text } = req.body;
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Please paste at least 50 characters of job description text." });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Cache-Control", "no-cache");

    const rawPayload = JSON.stringify({ rawContent: text.slice(0, 2000) }) + "\n__AI_START__\n";
    res.write(rawPayload);

    const stream = streamText(EXTRACTION_PROMPT(text.trim()));
    stream.pipe(res);
  } catch (error) {
    console.error("[POST /api/import/text]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// POST /api/import/url
router.post("/url", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        error: "GROQ_API_KEY not configured. Add your key from https://console.groq.com/keys",
      });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    let html: string;
    try {
      const fetchRes = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ApplyFlow/1.0; +https://applyflow.app)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (!fetchRes.ok) {
        return res.status(422).json({
          error: `Could not fetch page (HTTP ${fetchRes.status}). The site may block automated access.`,
        });
      }
      html = await fetchRes.text();
    } catch (fetchErr) {
      return res.status(422).json({
        error: "Could not reach that URL. Check if the link is public and accessible.",
      });
    }

    const $ = cheerio.load(html);
    $("nav, header, footer, script, style, noscript, iframe, ads, .ad, .advertisement, [class*='cookie'], [class*='banner'], [id*='cookie']").remove();

    const selectors = [
      "[class*='job-description']",
      "[class*='jobDescription']",
      "[class*='description__text']",
      "[class*='job-details']",
      "[class*='posting']",
      "main",
      "article",
      "#content",
      ".content",
    ];

    let mainContent = "";
    for (const sel of selectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 200) {
        mainContent = el.text().trim();
        break;
      }
    }

    if (!mainContent || mainContent.length < 100) {
      mainContent = $("body").text().trim();
    }

    const cleanedContent = mainContent.replace(/\s{3,}/g, "\n\n").replace(/\t/g, " ").slice(0, 15000);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Cache-Control", "no-cache");

    const rawContentPayload = JSON.stringify({ rawContent: cleanedContent.slice(0, 3000) }) + "\n__AI_START__\n";
    res.write(rawContentPayload);

    const stream = streamText(EXTRACTION_PROMPT(cleanedContent));
    stream.pipe(res);
  } catch (error) {
    console.error("[POST /api/import/url]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
