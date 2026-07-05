import express from "express";
import cors from "cors";
import "dotenv/config";

import clientPromise from "./config/db";
import authRoutes from "./routes/auth.routes";
import opportunitiesRoutes from "./routes/opportunities.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import interviewsRoutes from "./routes/interviews.routes";
import projectsRoutes from "./routes/projects.routes";
import remindersRoutes from "./routes/reminders.routes";
import documentsRoutes from "./routes/documents.routes";
import analyticsRoutes from "./routes/analytics.routes";
import formKitRoutes from "./routes/form-kit.routes";
import importRoutes from "./routes/import.routes";
import aiRoutes from "./routes/ai.routes";
import outreachRoutes from "./routes/outreach.routes";
import trackerRoutes from "./routes/tracker.routes";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow all origins in development (needed for Expo/mobile dev)
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || []
        : true, // allow all origins in dev
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));       // for base64 document uploads
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/interviews", interviewsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/reminders", remindersRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/form-kit", formKitRoutes);
app.use("/api/import", importRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/outreach", outreachRoutes);
app.use("/api/tracker", trackerRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    res.json({
      status: "ok",
      message: "Server is healthy and connected to MongoDB",
      env: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 HireCompass backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
});
