import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ObjectId } from "mongodb";

const router = Router();

// GET /api/documents
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const col = client.db().collection("cv_documents");

    const docs = await col
      .find({ userId: req.user!.id }, { projection: { data: 0 } })
      .sort({ uploadedAt: -1 })
      .toArray();

    const serialized = docs.map((d) => ({
      ...d,
      id: d._id.toString(),
      _id: d._id.toString(),
      uploadedAt: d.uploadedAt?.toISOString?.() ?? d.uploadedAt,
      updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
    }));

    return res.json(serialized);
  } catch (err) {
    console.error("[GET /api/documents]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/documents
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, type, targetRole, mimeType, data, sizeBytes } = req.body;

    if (!name || !data || !mimeType) {
      return res.status(400).json({ error: "name, mimeType, and data are required" });
    }

    if (sizeBytes > 10 * 1024 * 1024) {
      return res.status(413).json({ error: "File too large. Max 10MB." });
    }

    const client = await clientPromise;
    const col = client.db().collection("cv_documents");

    const now = new Date();
    const doc = {
      userId: req.user!.id,
      name,
      type: type || "RESUME",
      targetRole: targetRole || null,
      mimeType,
      data,
      sizeBytes: sizeBytes || 0,
      uploadedAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    return res.status(201).json({
      ...doc,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      data: undefined,
      uploadedAt: doc.uploadedAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/documents]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/documents/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const col = client.db().collection("cv_documents");

    const doc = await col.findOne({
      _id: new ObjectId(req.params.id as string),
      userId: req.user!.id,
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.json({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString(),
      uploadedAt: doc.uploadedAt?.toISOString?.() ?? doc.uploadedAt,
      updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt,
    });
  } catch (err) {
    console.error("[GET /api/documents/:id]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/documents/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, type, targetRole } = req.body;

    const client = await clientPromise;
    const col = client.db().collection("cv_documents");

    const result = await col.updateOne(
      { _id: new ObjectId(req.params.id as string), userId: req.user!.id },
      { $set: { name, type, targetRole, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/documents/:id]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/documents/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const col = client.db().collection("cv_documents");

    const result = await col.deleteOne({
      _id: new ObjectId(req.params.id as string),
      userId: req.user!.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/documents/:id]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
