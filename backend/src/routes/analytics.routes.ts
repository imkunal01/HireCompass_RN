import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

function detectChannel(url?: string | null): string {
  if (!url) return "Direct / Other";
  const lower = url.toLowerCase();
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("internshala")) return "Internshala";
  if (lower.includes("glassdoor")) return "Glassdoor";
  if (lower.includes("indeed")) return "Indeed";
  if (lower.includes("naukri")) return "Naukri";
  if (lower.includes("wellfound") || lower.includes("angel")) return "AngelList / WellFound";
  if (lower.includes("lever") || lower.includes("greenhouse") || lower.includes("workday") || lower.includes("jobvite")) return "Company Portal";
  return "Direct / Other";
}

// GET /api/analytics
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");
    const userId = req.user!.id;

    const all = await col.find({ userId }).toArray();

    const total = all.length;
    const saved = all.filter((o) => o.status === "SAVED" || o.status === "INTERESTED").length;
    const applied = all.filter((o) =>
      ["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"].includes(o.status)
    ).length;
    const interviewed = all.filter((o) => ["INTERVIEW", "OFFER"].includes(o.status)).length;
    const offers = all.filter((o) => o.status === "OFFER").length;
    const rejected = all.filter((o) => o.status === "REJECTED").length;

    // Funnel conversion rates
    const savedToApplied = total > 0 ? Math.round((applied / total) * 100) : 0;
    const appliedToInterview = applied > 0 ? Math.round((interviewed / applied) * 100) : 0;
    const interviewToOffer = interviewed > 0 ? Math.round((offers / interviewed) * 100) : 0;
    const overallYield = total > 0 ? Math.round((offers / total) * 100) : 0;

    // Weekly application velocity (last 8 weeks)
    const now = Date.now();
    const weeklyData: { week: string; count: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now - (w + 1) * 7 * 86400000);
      const weekEnd = new Date(now - w * 7 * 86400000);
      const label = `Wk ${8 - w}`;
      const count = all.filter((o) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return (
          d >= weekStart &&
          d < weekEnd &&
          ["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"].includes(o.status)
        );
      }).length;
      weeklyData.push({ week: label, count });
    }
    
    // Trim trailing weeks with 0 at beginning
    let startIdx = 0;
    for (let i = 0; i < weeklyData.length; i++) {
      if (weeklyData[i].count > 0) {
        startIdx = Math.max(0, i - 1);
        break;
      }
    }
    const trimmedWeekly = weeklyData.slice(startIdx);

    // Channel distribution
    const channelMap: Record<string, number> = {};
    for (const opp of all) {
      const channel = opp.source || detectChannel(opp.url);
      channelMap[channel] = (channelMap[channel] || 0) + 1;
    }
    const channels = Object.entries(channelMap)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => ({
        channel,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

    // Suggestions based on real data
    const suggestions: string[] = [];
    if (appliedToInterview < 15) {
      suggestions.push("Your applied-to-interview rate is below average. Consider tailoring your resume more closely to each job description.");
    }
    if (channelMap["LinkedIn"] && channelMap["LinkedIn"] / total > 0.5) {
      suggestions.push("Over half your applications come from LinkedIn. Try diversifying into referrals and company portals for better conversion.");
    }
    if (rejected > applied * 0.4) {
      suggestions.push("High rejection rate detected. Focus on fewer, higher-quality applications with stronger tailoring.");
    }
    if (offers > 0) {
      suggestions.push(`Congratulations on ${offers} offer${offers > 1 ? "s" : ""}! Keep the momentum going.`);
    }
    if (suggestions.length === 0) {
      suggestions.push("Keep tracking your applications to unlock personalized optimization tips.");
    }

    return res.json({
      funnel: { total, saved, applied, interviewed, offers, rejected },
      conversion: { savedToApplied, appliedToInterview, interviewToOffer, overallYield },
      weeklyVelocity: trimmedWeekly,
      channels,
      suggestions,
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
