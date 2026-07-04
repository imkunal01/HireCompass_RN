import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ObjectId } from "mongodb";

const router = Router();

// GET /api/opportunities
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const search = req.query.search as string;
    const employmentType = req.query.employmentType as string;
    const sourcePlatform = req.query.sourcePlatform as string;
    const deadline = req.query.deadline as string;
    const tags = req.query.tags as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");

    const query: Record<string, any> = { userId: req.user!.id };

    if (status && status !== "ALL") {
      const statusMap: Record<string, string[]> = {
        SAVED: ["SAVED", "WISHLIST"],
        INTERVIEW: ["INTERVIEW", "INTERVIEWING"],
      };
      query.status = statusMap[status] ? { $in: statusMap[status] } : status;
    }

    if (priority && priority !== "ALL") {
      query.priority = priority;
    }

    if (employmentType && employmentType !== "ALL") {
      query.employmentType = employmentType;
    }

    if (sourcePlatform && sourcePlatform !== "ALL") {
      query.sourcePlatform = sourcePlatform;
    }

    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    if (deadline) {
      const now = new Date();
      if (deadline === "3days") {
        query.deadline = { $lte: new Date(now.getTime() + 3 * 86400000) };
      } else if (deadline === "week") {
        query.deadline = { $lte: new Date(now.getTime() + 7 * 86400000) };
      } else if (deadline === "month") {
        query.deadline = { $lte: new Date(now.getTime() + 30 * 86400000) };
      }
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { company: regex },
        { location: regex },
        { notes: regex },
        { tags: regex },
        { skills: regex },
      ];
    }

    const sortField: Record<string, string> = {
      deadline: "deadline",
      createdAt: "createdAt",
      priority: "priority",
      company: "company",
      salary: "salary",
    };

    const opportunities = await col
      .find(query)
      .sort({ [sortField[sortBy] || "createdAt"]: sortOrder })
      .toArray();

    const serialized = opportunities.map((opp) => ({
      ...opp,
      id: opp._id.toString(),
      _id: opp._id.toString(),
      createdAt: opp.createdAt?.toISOString?.() ?? opp.createdAt,
      updatedAt: opp.updatedAt?.toISOString?.() ?? opp.updatedAt,
      deadline: opp.deadline?.toISOString?.() ?? opp.deadline,
    }));

    return res.json(serialized);
  } catch (error) {
    console.error("[GET /api/opportunities]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/opportunities
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      company,
      location,
      isRemote,
      employmentType,
      salary,
      url,
      sourcePlatform,
      status,
      priority,
      deadline,
      skills,
      tags,
      notes,
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "Title and company are required" });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");

    const now = new Date();
    const doc = {
      userId: req.user!.id,
      title,
      company,
      location: location || null,
      isRemote: Boolean(isRemote),
      employmentType: employmentType || "FULL_TIME",
      salary: salary || null,
      url: url || null,
      sourcePlatform: sourcePlatform || null,
      status: status || "SAVED",
      priority: priority || "MEDIUM",
      deadline: deadline ? new Date(deadline) : null,
      skills: skills || [],
      tags: tags || [],
      notes: notes || null,
      timeline: [{ event: "Job added", description: `Added ${company} - ${title}`, timestamp: now }],
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    if (deadline) {
      await db.collection("reminders").insertOne({
        userId: req.user!.id,
        jobId: result.insertedId.toString(),
        jobTitle: title,
        company: company,
        type: "DEADLINE",
        dueAt: new Date(deadline),
        message: "Application deadline",
        done: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return res.status(201).json({
      ...doc,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      deadline: doc.deadline?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[POST /api/opportunities]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/opportunities/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");

    const opp = await col.findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user!.id,
    });

    if (!opp) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({
      ...opp,
      id: opp._id.toString(),
      _id: opp._id.toString(),
      createdAt: opp.createdAt?.toISOString?.() ?? opp.createdAt,
      updatedAt: opp.updatedAt?.toISOString?.() ?? opp.updatedAt,
      deadline: opp.deadline?.toISOString?.() ?? opp.deadline,
    });
  } catch (error) {
    console.error("[GET /api/opportunities/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/opportunities/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, ...rest } = req.body;
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");

    const now = new Date();
    const updateFields: Record<string, any> = { ...rest, updatedAt: now };
    const pushOps: Record<string, any> = {};

    if (status) {
      updateFields.status = status;
      pushOps.timeline = {
        event: "Status changed",
        description: `Status updated to ${status}`,
        timestamp: now,
      };
    }

    if ("deadline" in rest) {
      updateFields.deadline = rest.deadline ? new Date(rest.deadline) : null;
    }

    const updateDoc: Record<string, any> = { $set: updateFields };
    if (Object.keys(pushOps).length > 0) {
      updateDoc.$push = pushOps;
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.user!.id },
      updateDoc,
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Not found" });
    }

    if (status && (status === "APPLIED" || status === "INTERVIEW")) {
      const reminderCol = db.collection("reminders");
      const dueDays = status === "APPLIED" ? 7 : 1;
      const type = status === "APPLIED" ? "FOLLOWUP" : "INTERVIEW";
      const message = status === "APPLIED" ? "Follow up on application" : "Prepare for interview";
      const dueAt = new Date(now.getTime() + dueDays * 86400000);

      const existing = await reminderCol.findOne({
        jobId: req.params.id,
        type,
        done: false,
      });

      if (!existing) {
        await reminderCol.insertOne({
          userId: req.user!.id,
          jobId: req.params.id,
          jobTitle: result.title,
          company: result.company,
          type,
          dueAt,
          message,
          done: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return res.json({
      ...result,
      id: result._id.toString(),
      _id: result._id.toString(),
      createdAt: result.createdAt?.toISOString?.() ?? result.createdAt,
      updatedAt: result.updatedAt?.toISOString?.() ?? result.updatedAt,
      deadline: result.deadline?.toISOString?.() ?? result.deadline,
    });
  } catch (error) {
    console.error("[PATCH /api/opportunities/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/opportunities/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("opportunities");

    const result = await col.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.user!.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/opportunities/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
