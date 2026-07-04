import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import clientPromise from "../config/db";
import { signToken, requireAuth } from "../middleware/auth";

const router = Router();
const BCRYPT_ROUNDS = 12;
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const now = new Date();
    const result = await users.insertOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId.toString();

    const sessionUser = { id: userId, name: name.trim(), email: normalizedEmail };
    const token = await signToken(sessionUser);

    res.cookie("auth-token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production"
    });

    return res.status(201).json({ user: sessionUser, token }); // return token for mobile
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = (email as string).toLowerCase().trim();

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ email: normalizedEmail });

    const dummyHash = "$2b$12$invalidhashpadding000000000000000000000000000000000000000";
    const hashToCompare = user?.passwordHash ?? dummyHash;
    const valid = await bcrypt.compare(password as string, hashToCompare);

    if (!user || !valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const sessionUser = {
      id: user._id.toString(),
      name: user.name as string,
      email: user.email as string,
    };
    const token = await signToken(sessionUser);

    res.cookie("auth-token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production"
    });

    return res.json({ user: sessionUser, token }); // return token for mobile
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  res.cookie("auth-token", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0
  });
  return res.json({ success: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

// PUT /api/auth/password
router.put("/password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required." });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");
    // @ts-ignore
    const { ObjectId } = require("mongodb");
    const user = await users.findOne({ _id: new ObjectId(req.user!.id) });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await users.updateOne(
      { _id: new ObjectId(req.user!.id) },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/auth/password]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/profile
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    // @ts-ignore
    const { ObjectId } = require("mongodb");
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user!.id) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      notifications: user.notifications || {
        emailAlerts: true,
        weeklyReport: true,
        interviewRemind: true,
        marketingEmails: false,
      },
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("[GET /api/auth/profile]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/auth/profile
router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, email, notifications } = req.body;

    if (name && (typeof name !== "string" || name.trim().length < 2)) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }
    if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection("users");
    // @ts-ignore
    const { ObjectId } = require("mongodb");

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name) updates.name = name.trim();
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await users.findOne({
        email: normalizedEmail,
        _id: { $ne: new ObjectId(req.user!.id) },
      });
      if (existing) {
        return res.status(409).json({ error: "Email already in use." });
      }
      updates.email = normalizedEmail;
    }
    if (notifications && typeof notifications === "object") {
      updates.notifications = notifications;
    }

    await users.updateOne(
      { _id: new ObjectId(req.user!.id) },
      { $set: updates }
    );

    const updatedUser = await users.findOne({ _id: new ObjectId(req.user!.id) });
    const sessionUser = {
      id: req.user!.id,
      name: updatedUser?.name ?? req.user!.name,
      email: updatedUser?.email ?? req.user!.email,
    };
    const token = await signToken(sessionUser);

    res.cookie("auth-token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production"
    });
    return res.json({ user: sessionUser, token });
  } catch (error) {
    console.error("[PUT /api/auth/profile]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
