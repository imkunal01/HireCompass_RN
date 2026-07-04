import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ObjectId } from "mongodb";

const router = Router();

// GET /api/interviews
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("interviews");

    const interviews = await col
      .find({ userId: req.user!.id })
      .sort({ date: 1 })
      .toArray();

    return res.json(
      interviews.map((i) => ({
        ...i,
        id: i._id.toString(),
        _id: undefined,
      }))
    );
  } catch (error) {
    console.error("[GET /api/interviews]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/interviews
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { company, role, date, time, type, location, link, notes, opportunityId } = req.body;

    if (!company || !role || !date) {
      return res.status(400).json({ error: "company, role, and date are required" });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("interviews");

    const now = new Date();
    const result = await col.insertOne({
      userId: req.user!.id,
      company,
      role,
      date,
      time: time || "",
      type: type || "Technical",
      location: location || "",
      link: link || "",
      notes: notes || "",
      opportunityId: opportunityId || null,
      status: "UPCOMING",
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await col.findOne({ _id: result.insertedId });
    return res.status(201).json({ ...inserted, id: inserted!._id.toString(), _id: undefined });
  } catch (error) {
    console.error("[POST /api/interviews]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/interviews/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { _id, id, ...updates } = req.body;
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("interviews");

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(req.params.id as string), userId: req.user!.id },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ ...result, id: result._id.toString(), _id: undefined });
  } catch (error) {
    console.error("[PATCH /api/interviews/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/interviews/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("interviews");

    const result = await col.deleteOne({
      _id: new ObjectId(req.params.id as string),
      userId: req.user!.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/interviews/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
