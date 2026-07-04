import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ObjectId } from "mongodb";

const router = Router();

// GET /api/form-kit
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const opportunityId = req.query.opportunityId as string;

    if (!opportunityId) {
      return res.status(400).json({ error: "opportunityId is required" });
    }

    const client = await clientPromise;
    const db = client.db();

    const opp = await db.collection("opportunities").findOne({
      _id: new ObjectId(opportunityId),
      userId: req.user!.id,
    });

    if (!opp) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    const jobSkills: string[] = (opp.skills || []).map((s: string) => s.toLowerCase());
    const jobTitle: string = (opp.title || "").toLowerCase();

    const projects = await db.collection("projects").find({ userId: req.user!.id }).toArray();

    if (projects.length === 0) {
      return res.json([]);
    }

    const scored = projects.map((p) => {
      const techStack: string[] = p.techStack || [];
      const techLower = techStack.map((t: string) => t.toLowerCase());

      const matchedSkills = jobSkills.filter((skill) =>
        techLower.some((tech) => tech.includes(skill) || skill.includes(tech))
      );

      const roleCategories: string[] = p.roleCategories || [];
      const roleCategoryBonus = roleCategories.some((cat: string) =>
        jobTitle.includes(cat.toLowerCase()) || cat.toLowerCase().includes(jobTitle.split(" ")[0])
      )
        ? 15
        : 0;

      const overlapScore =
        jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 85) : 0;

      const matchScore = Math.min(100, overlapScore + roleCategoryBonus);

      const snippets: any[] = p.snippets || [];

      function bestSnippetForLength(len: string) {
        const lengthSnippets = snippets.filter((s: any) => s.length === len);
        if (lengthSnippets.length === 0) return null;

        const scoredSnippets = lengthSnippets.map((s: any) => {
          const tagWords = s.roleTag.toLowerCase().split(/\s+/);
          const titleWords = jobTitle.split(/\s+/);
          const overlap = tagWords.filter((w: string) =>
            titleWords.some((tw: string) => tw.includes(w) || w.includes(tw))
          ).length;
          return { snippet: s, score: overlap };
        });

        scoredSnippets.sort((a: any, b: any) => b.score - a.score);
        return scoredSnippets[0].snippet;
      }

      return {
        projectId: p._id.toString(),
        projectName: p.name,
        techStack,
        matchScore,
        matchedSkills: matchedSkills.map((s) => jobSkills.find((js) => js === s) || s),
        snippets: {
          short: bestSnippetForLength("short"),
          medium: bestSnippetForLength("medium"),
          long: bestSnippetForLength("long"),
        },
        hasAnySnippet: snippets.length > 0,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.json(scored);
  } catch (error) {
    console.error("[GET /api/form-kit]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
