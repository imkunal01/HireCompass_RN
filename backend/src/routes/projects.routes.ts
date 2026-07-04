import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ObjectId } from "mongodb";

const router = Router();

function serialize(p: any) {
  return {
    ...p,
    id: p._id.toString(),
    _id: p._id.toString(),
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    snippets: (p.snippets || []).map((s: any) => ({
      ...s,
      createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
    })),
  };
}

// GET /api/projects
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("projects");

    const projects = await col
      .find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(projects.map(serialize));
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/projects
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, techStack, roleCategories, metrics, links } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("projects");

    const now = new Date();
    const doc = {
      userId: req.user!.id,
      name,
      description: description || "",
      techStack: techStack || [],
      roleCategories: roleCategories || [],
      metrics: metrics || [],
      links: {
        github: links?.github || null,
        live: links?.live || null,
      },
      snippets: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    return res.status(201).json({
      ...doc,
      id: result.insertedId.toString(),
      _id: result.insertedId.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/projects/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user!.id,
    });

    if (!project) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(serialize(project));
  } catch (error) {
    console.error("[GET /api/projects/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/projects/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, techStack, roleCategories, metrics, links } = req.body;

    const client = await clientPromise;
    const db = client.db();

    const updateDoc: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateDoc.name = name;
    if (description !== undefined) updateDoc.description = description;
    if (techStack !== undefined) updateDoc.techStack = techStack;
    if (roleCategories !== undefined) updateDoc.roleCategories = roleCategories;
    if (metrics !== undefined) updateDoc.metrics = metrics;
    if (links !== undefined) updateDoc.links = links;

    const result = await db.collection("projects").findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: req.user!.id },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(serialize(result));
  } catch (error) {
    console.error("[PATCH /api/projects/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("projects").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.user!.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/projects/:id]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
