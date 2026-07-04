import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ObjectId } from "mongodb";

const router = Router();

// GET /api/reminders
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("reminders");

    const query: Record<string, any> = { userId: req.user!.id };
    if (status === "pending") query.done = { $ne: true };
    if (status === "done") query.done = true;

    const reminders = await col
      .find(query)
      .sort({ dueAt: 1 })
      .toArray();

    return res.json(
      reminders.map((r) => ({
        ...r,
        id: r._id.toString(),
        _id: r._id.toString(),
        dueAt: r.dueAt?.toISOString?.() ?? r.dueAt,
        createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
      }))
    );
  } catch (error) {
    console.error("[GET /api/reminders]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reminders
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { jobId, jobTitle, company, type, dueAt, message } = req.body;

    if (!type || !dueAt) {
      return res.status(400).json({ error: "type and dueAt are required" });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("reminders");

    const now = new Date();
    const doc = {
      userId: req.user!.id,
      jobId: jobId || null,
      jobTitle: jobTitle || null,
      company: company || null,
      type,
      dueAt: new Date(dueAt),
      message: message || "",
      done: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    return res.status(201).json({
      ...doc,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      dueAt: doc.dueAt.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/reminders]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/reminders/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { done, snooze } = req.body;

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("reminders");

    const updates: Record<string, any> = { updatedAt: new Date() };
    const reminderId = req.params.id as string;

    if (typeof done === "boolean") updates.done = done;

    if (!ObjectId.isValid(reminderId)) {
      return res.status(400).json({ error: "Invalid reminder ID format" });
    }

    if (snooze) {
      const snoozeMap: Record<string, number> = {
        "1day": 1,
        "3days": 3,
        "1week": 7,
      };
      const days = snoozeMap[snooze] ?? 1;
      const current = await col.findOne({ _id: new ObjectId(reminderId), userId: req.user!.id });
      if (current) {
        const base = current.dueAt > new Date() ? current.dueAt : new Date();
        updates.dueAt = new Date(base.getTime() + days * 86400000);
      }
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(reminderId), userId: req.user!.id },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({
      ...result,
      id: result._id.toString(),
      _id: result._id.toString(),
      dueAt: result.dueAt?.toISOString?.() ?? result.dueAt,
    });
  } catch (error) {
    console.error("[PATCH /api/reminders/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/reminders/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("reminders");
    const reminderId = req.params.id as string;

    if (!ObjectId.isValid(reminderId)) {
      return res.status(400).json({ error: "Invalid reminder ID format" });
    }

    const result = await col.deleteOne({
      _id: new ObjectId(reminderId),
      userId: req.user!.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/reminders/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
