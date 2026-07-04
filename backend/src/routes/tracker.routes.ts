import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import clientPromise from "../config/db";
import { ObjectId } from "mongodb";

const router = Router();

router.use(requireAuth);

// --- Daily Logs ---
router.get("/daily-logs", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const logs = await db.collection("dailyLogs").find({ userId: req.user?.id }).sort({ date: -1 }).toArray();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch daily logs" });
  }
});

router.post("/daily-logs", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { date, problemsSolved, contestsAttended, platforms, habits, goalMet } = req.body;
    
    const newLog = {
      id: new ObjectId().toString(),
      userId: req.user?.id,
      date,
      problemsSolved,
      contestsAttended,
      platforms,
      habits,
      goalMet,
      createdAt: new Date(),
    };
    
    await db.collection("dailyLogs").updateOne(
      { userId: req.user?.id, date },
      { $set: newLog },
      { upsert: true }
    );
    
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: "Failed to create daily log" });
  }
});

// --- Physique Logs ---
router.get("/physique-logs", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const logs = await db.collection("physiqueLogs").find({ userId: req.user?.id }).sort({ date: 1 }).toArray();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch physique logs" });
  }
});

router.post("/physique-logs", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { date, weight, bodyFat } = req.body;
    
    const newLog = {
      id: new ObjectId().toString(),
      userId: req.user?.id,
      date,
      weight,
      bodyFat,
      createdAt: new Date(),
    };
    
    await db.collection("physiqueLogs").updateOne(
      { userId: req.user?.id, date },
      { $set: newLog },
      { upsert: true }
    );
    
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: "Failed to create physique log" });
  }
});

// --- Problems ---
router.get("/problems", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const problems = await db.collection("problems").find({ userId: req.user?.id }).sort({ createdAt: -1 }).toArray();
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.post("/problems", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { title, url, topics, notes, solutionCode, timeSpent, difficulty } = req.body;
    
    const newProblem = {
      id: new ObjectId().toString(),
      userId: req.user?.id,
      title,
      url,
      topics,
      notes,
      solutionCode,
      timeSpent,
      difficulty,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection("problems").insertOne(newProblem);
    res.status(201).json(newProblem);
  } catch (error) {
    res.status(500).json({ error: "Failed to create problem" });
  }
});

router.put("/problems/:id", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const id = req.params.id;
    const { title, url, topics, notes, solutionCode, timeSpent, difficulty } = req.body;
    
    await db.collection("problems").updateOne(
      { id, userId: req.user?.id },
      { $set: { title, url, topics, notes, solutionCode, timeSpent, difficulty, updatedAt: new Date() } }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update problem" });
  }
});

router.delete("/problems/:id", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const id = req.params.id;
    
    await db.collection("problems").deleteOne({ id, userId: req.user?.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete problem" });
  }
});

// --- Sheets ---
router.get("/sheets", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const sheets = await db.collection("sheets").find({ userId: req.user?.id }).sort({ createdAt: -1 }).toArray();
    res.json(sheets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sheets" });
  }
});

router.post("/sheets", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const { title, description, topics } = req.body;
    
    const newSheet = {
      id: new ObjectId().toString(),
      userId: req.user?.id,
      title,
      description,
      topics: topics || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection("sheets").insertOne(newSheet);
    res.status(201).json(newSheet);
  } catch (error) {
    res.status(500).json({ error: "Failed to create sheet" });
  }
});

router.put("/sheets/:id", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const id = req.params.id;
    const { title, description, topics } = req.body;
    
    await db.collection("sheets").updateOne(
      { id, userId: req.user?.id },
      { $set: { title, description, topics, updatedAt: new Date() } }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update sheet" });
  }
});

router.delete("/sheets/:id", async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const id = req.params.id;
    
    await db.collection("sheets").deleteOne({ id, userId: req.user?.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete sheet" });
  }
});

export default router;
