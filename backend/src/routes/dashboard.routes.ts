import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

function mapEventType(event: string): string {
  const lower = event.toLowerCase();
  if (lower.includes("added") || lower.includes("created")) return "JOB_ADDED";
  if (lower.includes("status")) return "STATUS_CHANGED";
  if (lower.includes("email")) return "EMAIL_SENT";
  if (lower.includes("interview")) return "INTERVIEW_SCHEDULED";
  return "NOTE_ADDED";
}

// GET /api/dashboard/activity
router.get("/activity", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");

    const recent = await col
      .find({ userId: req.user!.id })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    const events: any[] = [];

    for (const opp of recent) {
      const timeline = opp.timeline || [];
      for (const event of timeline) {
        events.push({
          id: `${opp._id}-${event.timestamp}`,
          type: mapEventType(event.event),
          title: event.event,
          description: event.description || `${opp.company} - ${opp.title}`,
          timestamp: event.timestamp,
          jobId: opp._id.toString(),
          company: opp.company,
          role: opp.title,
        });
      }

      if (!timeline.length) {
        events.push({
          id: `${opp._id}-created`,
          type: "JOB_ADDED",
          title: "Job added",
          description: `${opp.company} - ${opp.title}`,
          timestamp: opp.createdAt,
          jobId: opp._id.toString(),
          company: opp.company,
          role: opp.title,
        });
      }
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const topEvents = events.slice(0, 15).map((e) => ({
      ...e,
      timestamp: e.timestamp?.toISOString?.() ?? e.timestamp,
    }));

    return res.json(topEvents);
  } catch (error) {
    console.error("[GET /api/dashboard/activity]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/stats
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");
    const userId = req.user!.id;

    const [total, applied, interviews, offers] = await Promise.all([
      col.countDocuments({ userId }),
      col.countDocuments({
        userId,
        status: { $in: ["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED", "INTERVIEWING"] },
      }),
      col.countDocuments({ userId, status: { $in: ["INTERVIEW", "INTERVIEWING", "ASSESSMENT"] } }),
      col.countDocuments({ userId, status: "OFFER" }),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const followUpsDue = await col.countDocuments({
      userId,
      status: "APPLIED",
      updatedAt: { $lte: sevenDaysAgo },
    });

    const responseRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;

    return res.json({
      totalSaved: total,
      applicationsSent: applied,
      interviewsScheduled: interviews,
      responseRate,
      followUpsDue,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
