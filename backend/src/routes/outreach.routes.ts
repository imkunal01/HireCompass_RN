import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { requireAuth } from "../middleware/auth";
import { ObjectId } from "mongodb";
import { extractJSON, streamText } from "../lib/gemini";
import * as XLSX from "xlsx";
import nodemailer from "nodemailer";
import * as cheerio from "cheerio";

const router = Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});
const FROM_EMAIL = process.env.GMAIL_USER || "";

// ==========================================
// NETWORK CONTACTS (For new Outreach UI)
// ==========================================
// GET /api/outreach
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    // We treat outreach_records as the "Network Contacts" list
    const records = await client.db().collection("outreach_records")
      .find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    const mapped = records.map(r => ({
      id: r._id.toString(),
      name: r.recruiterName || "Unknown",
      role: r.recruiterRole || "Recruiter",
      company: r.companyName || "Unknown",
      platform: "linkedin", // Mocked or derived from context if needed
      status: r.status || "PENDING",
      addedAt: r.createdAt
    }));

    return res.json(mapped);
  } catch (err) {
    console.error("[GET /api/outreach]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// CAMPAIGNS
// ==========================================

// GET /api/outreach/campaigns
router.get("/campaigns", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const col = client.db().collection("outreach_campaigns");

    const campaigns = await col
      .find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = campaigns.map((c) => ({
      ...c,
      id: c._id.toString(),
      _id: c._id.toString(),
      createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
      updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
    }));

    return res.json(serialized);
  } catch (err) {
    console.error("[GET /api/outreach/campaigns]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/outreach/campaigns
router.post("/campaigns", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, recruiters, attachedCvId, dailyLimit = 20, delaySeconds = 30 } = req.body;

    if (!name || !recruiters?.length) {
      return res.status(400).json({ error: "Campaign name and recruiters are required" });
    }

    const client = await clientPromise;
    const db = client.db();
    const campaignsCol = db.collection("outreach_campaigns");
    const recordsCol = db.collection("outreach_records");

    const now = new Date();
    const campaignDoc = {
      userId: req.user!.id,
      name,
      status: "DRAFT",
      totalRecords: recruiters.length,
      sentCount: 0,
      repliedCount: 0,
      interviewCount: 0,
      attachedCvId: attachedCvId || null,
      dailyLimit,
      delaySeconds,
      createdAt: now,
      updatedAt: now,
    };

    const campaignResult = await campaignsCol.insertOne(campaignDoc);
    const campaignId = campaignResult.insertedId.toString();

    const recordDocs = recruiters.map((r: any) => ({
      campaignId,
      userId: req.user!.id,
      recruiterName: r.recruiterName || "",
      recruiterEmail: r.recruiterEmail || "",
      recruiterRole: r.recruiterRole || "",
      companyName: r.companyName || "",
      companyDescription: r.companyDescription || "",
      industry: r.industry || "",
      techStack: r.techStack || [],
      hiringRequirements: r.hiringRequirements || "",
      additionalNotes: r.additionalNotes || "",
      companyContext: null,
      generatedEmail: null,
      emailSubject: null,
      finalEmail: null,
      finalSubject: null,
      status: "PENDING",
      sentAt: null,
      repliedAt: null,
      messageId: null,
      followUpSentAt: null,
      opportunityId: null,
      createdAt: now,
      updatedAt: now,
    }));

    if (recordDocs.length > 0) {
      await recordsCol.insertMany(recordDocs);
    }

    return res.status(201).json({
      id: campaignId,
      ...campaignDoc,
      _id: campaignId,
      createdAt: campaignDoc.createdAt.toISOString(),
      updatedAt: campaignDoc.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/outreach/campaigns]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// EXTRACT
// ==========================================

// POST /api/outreach/extract
router.post("/extract", requireAuth, async (req: Request, res: Response) => {
  try {
    const { content, fileType, columnMapping } = req.body;

    if (!content) {
      return res.status(400).json({ error: "No file content provided" });
    }

    let rawRows: Record<string, string>[] = [];

    if (fileType === "xlsx" || fileType === "xls") {
      const buffer = Buffer.from(content, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    } else if (fileType === "csv") {
      const wb = XLSX.read(content, { type: "string" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
    } else {
      rawRows = [{ rawText: content }];
    }

    const mapped = columnMapping
      ? rawRows.map((row) => {
          const out: Record<string, string> = {};
          for (const [standardField, sourceCol] of Object.entries(columnMapping)) {
            out[standardField] = (row as any)[sourceCol as string] || "";
          }
          return out;
        })
      : rawRows;

    let records: any[] = [];

    if (fileType === "csv" || fileType === "xlsx" || fileType === "xls") {
      if (columnMapping && Object.keys(columnMapping).length > 0) {
        for (const r of mapped) {
          records.push({
            recruiterName: r.recruiterName || "",
            recruiterEmail: r.recruiterEmail || "",
            recruiterRole: r.recruiterRole || "",
            companyName: r.companyName || "",
            companyDescription: r.companyDescription || "",
            industry: r.industry || "",
            productsServices: r.productsServices || "",
            techStack: r.techStack ? String(r.techStack).split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean) : [],
            hiringRequirements: r.hiringRequirements || "",
            additionalNotes: r.additionalNotes || "",
          });
        }
      } else {
        for (const r of mapped) {
          const record: any = { techStack: [] };
          for (const [key, val] of Object.entries(r)) {
            if (!val) continue;
            const k = key.toLowerCase();
            const v = String(val).trim();

            if (k.includes("email")) record.recruiterEmail = v;
            else if (k.includes("company") || k.includes("organization") || k.includes("employer") || k.includes("account")) record.companyName = v;
            else if ((k.includes("name") || k.includes("contact")) && !k.includes("company") && !record.recruiterName) record.recruiterName = v;
            else if (k.includes("role") || k.includes("title") || k.includes("position")) record.recruiterRole = v;
            else if (k.includes("industry") || k.includes("domain") || k.includes("sector")) record.industry = v;
            else if (k.includes("tech") || k.includes("stack") || k.includes("skills")) record.techStack = v.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
            else if (k.includes("desc") || k.includes("about") || k.includes("overview")) record.companyDescription = v;
            else if (k.includes("req") || k.includes("qual")) record.hiringRequirements = v;
            else if (k.includes("product") || k.includes("service")) record.productsServices = v;
            else if (k.includes("note") || k.includes("add")) record.additionalNotes = v;
          }
          records.push(record);
        }
      }
    } else {
      const prompt = `You are a data extraction AI. Extract recruiter and company contact information from the following text data.

Data to extract from:
${JSON.stringify(mapped.slice(0, 150), null, 2)}

Extract an array of recruiter records. For each record, return:
{
  "recruiterName": "string or empty",
  "recruiterEmail": "valid email or empty",
  "recruiterRole": "string or empty",
  "companyName": "string (required, infer from context if needed)",
  "companyDescription": "string or empty",
  "industry": "string or empty",
  "productsServices": "string or empty",
  "techStack": ["array of technologies"],
  "hiringRequirements": "string or empty",
  "additionalNotes": "string or empty"
}

Rules:
- Skip rows with no email AND no company name
- If email is malformed, still include the row but mark recruiterEmail as ""
- Deduplicate by recruiterEmail (keep first occurrence)
- Return max 500 records
- Return ONLY valid JSON: { "records": [...] }`;

      const result = await extractJSON<{ records: any[] }>(prompt);
      records = result.records || [];
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seenEmails = new Set<string>();

    const processed = records.map((r: any, idx: number) => {
      const email = (r.recruiterEmail || "").trim().toLowerCase();
      const emailValid = email.length > 0 && emailRegex.test(email);
      const isDuplicate = email.length > 0 && seenEmails.has(email);
      if (email) seenEmails.add(email);

      return {
        id: `row_${idx}_${Date.now()}`,
        recruiterName: r.recruiterName || "",
        recruiterEmail: email,
        recruiterRole: r.recruiterRole || "",
        companyName: r.companyName || "Unknown Company",
        companyDescription: r.companyDescription || "",
        industry: r.industry || "",
        productsServices: r.productsServices || "",
        techStack: Array.isArray(r.techStack) ? r.techStack : [],
        hiringRequirements: r.hiringRequirements || "",
        additionalNotes: r.additionalNotes || "",
        emailValid,
        isDuplicate,
      };
    });

    const valid = processed.filter((r) => r.companyName && r.companyName !== "Unknown Company");
    const invalid = processed.filter((r) => !r.emailValid && !r.recruiterEmail);

    return res.json({
      records: valid,
      stats: {
        total: processed.length,
        valid: valid.filter((r) => r.emailValid).length,
        duplicates: processed.filter((r) => r.isDuplicate).length,
        missingEmail: processed.filter((r) => !r.emailValid).length,
        skipped: invalid.length,
      },
    });
  } catch (err) {
    console.error("[POST /api/outreach/extract]", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Extraction failed" });
  }
});

// ==========================================
// PROFILE
// ==========================================

// GET /api/outreach/profile
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const col = client.db().collection("outreach_profiles");
    const profile = await col.findOne({ userId: req.user!.id });

    if (!profile) {
      return res.json({
        userId: req.user!.id,
        fullName: req.user!.name || "",
        email: req.user!.email || "",
        phone: "",
        linkedin: "",
        github: "",
        portfolio: "",
        skills: [],
        bio: "",
        projects: [],
      });
    }

    return res.json({
      ...profile,
      _id: profile._id.toString(),
      updatedAt: profile.updatedAt?.toISOString?.() ?? profile.updatedAt,
    });
  } catch (err) {
    console.error("[GET /api/outreach/profile]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/outreach/profile
router.post("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, linkedin, github, portfolio, skills, bio, projects } = req.body;
    const client = await clientPromise;
    const col = client.db().collection("outreach_profiles");

    const now = new Date();
    await col.updateOne(
      { userId: req.user!.id },
      {
        $set: {
          userId: req.user!.id,
          fullName: fullName || req.user!.name,
          email: email || req.user!.email,
          phone: phone || "",
          linkedin: linkedin || "",
          github: github || "",
          portfolio: portfolio || "",
          skills: skills || [],
          bio: bio || "",
          projects: projects || [],
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("[POST /api/outreach/profile]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// RECORDS
// ==========================================

// PATCH /api/outreach/records/:id
router.patch("/records/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, finalEmail, finalSubject, generatedEmail, emailSubject, companyContext, sentAt, repliedAt, messageId, opportunityId, followUpSentAt } = req.body;
    const update: Record<string, any> = { updatedAt: new Date() };

    if (status !== undefined) update.status = status;
    if (finalEmail !== undefined) update.finalEmail = finalEmail;
    if (finalSubject !== undefined) update.finalSubject = finalSubject;
    if (generatedEmail !== undefined) update.generatedEmail = generatedEmail;
    if (emailSubject !== undefined) update.emailSubject = emailSubject;
    if (companyContext !== undefined) update.companyContext = companyContext;
    if (sentAt !== undefined) update.sentAt = sentAt ? new Date(sentAt) : null;
    if (repliedAt !== undefined) update.repliedAt = repliedAt ? new Date(repliedAt) : null;
    if (messageId !== undefined) update.messageId = messageId;
    if (opportunityId !== undefined) update.opportunityId = opportunityId;
    if (followUpSentAt !== undefined) update.followUpSentAt = followUpSentAt ? new Date(followUpSentAt) : null;

    const client = await clientPromise;
    const result = await client.db().collection("outreach_records").updateOne(
      { _id: new ObjectId(req.params.id as string), userId: req.user!.id },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/outreach/records/:id]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/outreach/records/:id
router.delete("/records/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const result = await client.db().collection("outreach_records").deleteOne({
      _id: new ObjectId(req.params.id as string),
      userId: req.user!.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/outreach/records/:id]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// SEND & FOLLOW UP
// ==========================================

// POST /api/outreach/send
router.post("/send", requireAuth, async (req: Request, res: Response) => {
  try {
    const { campaignId, recordIds } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: "campaignId is required" });
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === "your_16_char_app_password_here") {
      return res.status(503).json({ error: "GMAIL_APP_PASSWORD not configured. Add it to .env to enable email sending." });
    }

    const client = await clientPromise;
    const db = client.db();
    const campaign = await db.collection("outreach_campaigns").findOne({ _id: new ObjectId(campaignId), userId: req.user!.id });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const query: any = { campaignId, userId: req.user!.id, status: "APPROVED" };
    if (recordIds?.length) {
      query._id = { $in: recordIds.map((id: string) => new ObjectId(id)) };
    }

    const records = await db.collection("outreach_records").find(query).limit(campaign.dailyLimit || 20).toArray();
    if (records.length === 0) {
      return res.json({ message: "No approved records to send", sent: 0 });
    }

    let attachmentData: { filename: string; content: string } | null = null;
    if (campaign.attachedCvId) {
      const cvDoc = await db.collection("cv_documents").findOne({ _id: new ObjectId(campaign.attachedCvId), userId: req.user!.id });
      if (cvDoc?.data) {
        attachmentData = { filename: cvDoc.name, content: cvDoc.data };
      }
    }

    await db.collection("outreach_campaigns").updateOne({ _id: new ObjectId(campaignId) }, { $set: { status: "SENDING", updatedAt: new Date() } });

    const results: any[] = [];
    const delayMs = (campaign.delaySeconds || 30) * 1000;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordId = record._id.toString();
      await db.collection("outreach_records").updateOne({ _id: record._id }, { $set: { status: "SENDING", updatedAt: new Date() } });

      try {
        const emailBody = record.finalEmail || record.generatedEmail || "";
        const subject = record.finalSubject || record.emailSubject || `Internship Inquiry – ${record.companyName}`;
        const toEmail = record.recruiterEmail;

        if (!toEmail || !emailBody) throw new Error("Missing recipient email or email body");

        const payload: any = { from: FROM_EMAIL, to: [toEmail], subject, text: emailBody };
        if (attachmentData) payload.attachments = [{ filename: attachmentData.filename, content: attachmentData.content }];

        const info = await transporter.sendMail(payload);
        const sentAt = new Date();

        await db.collection("outreach_records").updateOne(
          { _id: record._id },
          { $set: { status: "SENT", sentAt, messageId: info.messageId || null, updatedAt: new Date() } }
        );

        const opportunityDoc = {
          userId: req.user!.id,
          title: `Internship at ${record.companyName}`,
          company: record.companyName,
          location: null,
          isRemote: false,
          employmentType: "INTERNSHIP",
          salary: null,
          url: null,
          sourcePlatform: "OTHER",
          status: "APPLIED",
          priority: "MEDIUM",
          deadline: null,
          skills: record.techStack || [],
          tags: ["outreach"],
          notes: `Auto-created from outreach campaign: ${campaign.name}\nRecruiter: ${record.recruiterName} (${record.recruiterEmail})\n\n${emailBody}`,
          outreachId: recordId,
          timeline: [{ event: "Application sent", description: `Cold email sent to ${record.recruiterName || record.recruiterEmail} via HireCompass Outreach`, timestamp: sentAt }],
          createdAt: sentAt,
          updatedAt: sentAt,
        };

        const oppResult = await db.collection("opportunities").insertOne(opportunityDoc);

        await db.collection("reminders").insertOne({
          userId: req.user!.id,
          jobId: oppResult.insertedId.toString(),
          jobTitle: opportunityDoc.title,
          company: record.companyName,
          type: "FOLLOWUP",
          dueAt: new Date(sentAt.getTime() + 7 * 86400000),
          message: "Follow up on outreach email",
          done: false,
          createdAt: sentAt,
          updatedAt: sentAt,
        });

        await db.collection("outreach_records").updateOne({ _id: record._id }, { $set: { opportunityId: oppResult.insertedId.toString() } });
        results.push({ recordId, success: true, messageId: info.messageId });

        if (i < records.length - 1) await new Promise((r) => setTimeout(r, delayMs));
      } catch (sendErr) {
        await db.collection("outreach_records").updateOne({ _id: record._id }, { $set: { status: "APPROVED", updatedAt: new Date() } });
        results.push({ recordId, success: false, error: sendErr instanceof Error ? sendErr.message : "Send failed" });
      }
    }

    const sentCount = results.filter((r) => r.success).length;
    await db.collection("outreach_campaigns").updateOne(
      { _id: new ObjectId(campaignId) },
      { $inc: { sentCount }, $set: { status: sentCount === records.length ? "SENT" : "READY", updatedAt: new Date() } }
    );

    return res.json({ sent: sentCount, failed: results.filter((r) => !r.success).length, results });
  } catch (err) {
    console.error("[POST /api/outreach/send]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/outreach/followup
router.post("/followup", requireAuth, async (req: Request, res: Response) => {
  try {
    const { recordId } = req.body;
    if (!recordId) return res.status(400).json({ error: "recordId is required" });

    const client = await clientPromise;
    const db = client.db();
    const record = await db.collection("outreach_records").findOne({ _id: new ObjectId(recordId), userId: req.user!.id, status: { $in: ["SENT", "FOLLOW_UP_SENT"] } });
    if (!record) return res.status(404).json({ error: "Record not found or not in SENT status" });

    const profile = await db.collection("outreach_profiles").findOne({ userId: req.user!.id });
    if (!profile) return res.status(400).json({ error: "Please set up your outreach profile first" });

    const campaign = await db.collection("outreach_campaigns").findOne({ _id: new ObjectId(record.campaignId), userId: req.user!.id });
    const daysSinceSent = record.sentAt ? Math.floor((Date.now() - new Date(record.sentAt).getTime()) / (1000 * 60 * 60 * 24)) : 7;

    const prompt = `You are a professional email writer. Write a brief, warm follow-up email.

Context:
- Original email was sent ${daysSinceSent} days ago to ${record.recruiterName || "the hiring team"} at ${record.companyName}
- Original email subject: ${record.finalSubject || record.emailSubject}
- Applicant: ${profile.fullName}
- Company: ${record.companyName} (${record.industry || "Tech"})
- Tech Stack: ${(record.techStack || []).join(", ")}

Write a short follow-up (max 80 words) that:
1. References the original email politely
2. Reiterates genuine interest in ${record.companyName}
3. Asks if they had a chance to review your application
4. Ends with a low-pressure ask

FORMAT:
<SUBJECT>
Re: [reference original subject]
</SUBJECT>
<EMAIL>
[follow-up body]
</EMAIL>

Return JSON: { "subject": "...", "body": "..." }`;

    const generated = await extractJSON<{ subject: string; body: string }>(prompt);

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === "your_16_char_app_password_here") {
      return res.json({ preview: true, subject: generated.subject, body: generated.body });
    }

    let attachmentData: { filename: string; content: string } | null = null;
    if (campaign?.attachedCvId) {
      const cvDoc = await db.collection("cv_documents").findOne({ _id: new ObjectId(campaign.attachedCvId), userId: req.user!.id });
      if (cvDoc?.data) attachmentData = { filename: cvDoc.name, content: cvDoc.data };
    }

    const payload: any = { from: FROM_EMAIL, to: [record.recruiterEmail], subject: generated.subject || `Following up – ${record.companyName}`, text: generated.body };
    if (attachmentData) payload.attachments = [{ filename: attachmentData.filename, content: attachmentData.content }];

    const info = await transporter.sendMail(payload);
    const now = new Date();
    await db.collection("outreach_records").updateOne({ _id: new ObjectId(recordId) }, { $set: { status: "FOLLOW_UP_SENT", followUpSentAt: now, updatedAt: now } });

    return res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("[POST /api/outreach/followup]", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Follow-up failed" });
  }
});

// ==========================================
// GENERATE EMAILS (Streaming)
// ==========================================

// POST /api/outreach/generate-emails
router.post("/generate-emails", requireAuth, async (req: Request, res: Response) => {
  try {
    const { recordId, profile } = req.body;
    if (!recordId || !profile) return res.status(400).json({ error: "recordId and profile are required" });

    const client = await clientPromise;
    const db = client.db();
    const record = await db.collection("outreach_records").findOne({ _id: new ObjectId(recordId), userId: req.user!.id });
    if (!record) return res.status(404).json({ error: "Record not found" });

    const campaign = await db.collection("outreach_campaigns").findOne({ _id: new ObjectId(record.campaignId), userId: req.user!.id });
    let cvText: string | null = null;

    if (campaign?.attachedCvId) {
      const cvDoc = await db.collection("cv_documents").findOne({ _id: new ObjectId(campaign.attachedCvId), userId: req.user!.id });
      if (cvDoc?.data && cvDoc.mimeType === "application/pdf") {
        try {
          const base64Data = cvDoc.data.includes(",") ? cvDoc.data.split(",")[1] : cvDoc.data;
          const buffer = Buffer.from(base64Data, "base64");
          const { PDFParse } = require("pdf-parse");
          const parser = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          cvText = pdfData.text;
        } catch (err) {
          console.error("Error parsing PDF CV:", err);
        }
      }
    }

    const recruiterName = record.recruiterName || "Hiring Team";
    const companyName = record.companyName || "your company";
    const prompt = `Output the following EXACT email template, keeping all details exactly as written.

FORMAT EXACTLY LIKE THIS:
<SUBJECT>
Full-Stack Intern Application — MERN/Next.js/PostgreSQL
</SUBJECT>
<EMAIL>
Hi ${recruiterName},

I'm Kunal Dhangar, a final-year CS student at Lovely Professional University with hands-on full-stack experience in React, Next.js, Node.js, PostgreSQL, Redis, and Docker.

A few things I've shipped:
• Creolink — real-time collaborative video PM platform (WebSockets, Socket.io, PostgreSQL, Adobe UXP plugin) with 100ms state sync and 80% bandwidth reduction
• KripaConnect — full-stack ecommerce with JWT + Google OAuth 2.0 RBAC, Redis caching delivering 800ms API response under 1k+ concurrent users
• Orbosis Internship — reduced API latency by 30% via Redis caching, automated payment verification via Razorpay webhooks

I'd love to contribute to ${companyName}'s engineering team as an intern. My GitHub (github.com/imkunal01) has both projects live with documented READs.

Could we schedule a quick call?

Kunal Dhangar
+91-62660-89196 | kunaldhangar184@gmail.com
github.com/imkunal01 | linkedin.com/in/kunaldhangar
</EMAIL>`;

    await db.collection("outreach_records").updateOne({ _id: new ObjectId(recordId) }, { $set: { status: "DRAFT", updatedAt: new Date() } });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Cache-Control", "no-cache");

    const stream = streamText(prompt);
    stream.pipe(res);
  } catch (err) {
    console.error("[POST /api/outreach/generate-emails]", err);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// STATS
// ==========================================

// GET /api/outreach/stats
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = req.user!.id;

    const [campaigns, recordAgg] = await Promise.all([
      db.collection("outreach_campaigns").countDocuments({ userId }),
      db.collection("outreach_records").aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            sent: { $sum: { $cond: [{ $in: ["$status", ["SENT", "REPLIED", "INTERVIEW", "OFFER", "REJECTED", "FOLLOW_UP_SENT"]] }, 1, 0] } },
            replied: { $sum: { $cond: [{ $in: ["$status", ["REPLIED", "INTERVIEW", "OFFER"]] }, 1, 0] } },
            interview: { $sum: { $cond: [{ $eq: ["$status", "INTERVIEW"] }, 1, 0] } },
            offer: { $sum: { $cond: [{ $eq: ["$status", "OFFER"] }, 1, 0] } },
          }
        }
      ]).toArray()
    ]);

    const agg = recordAgg[0] || { total: 0, sent: 0, replied: 0, interview: 0, offer: 0 };

    return res.json({
      totalCampaigns: campaigns,
      totalRecruitersSaved: agg.total,
      totalEmailsSent: agg.sent,
      totalReplied: agg.replied,
      totalInterviews: agg.interview,
      totalOffers: agg.offer,
      responseRate: agg.sent > 0 ? Math.round((agg.replied / agg.sent) * 100) : 0,
      interviewRate: agg.sent > 0 ? Math.round((agg.interview / agg.sent) * 100) : 0,
    });
  } catch (err) {
    console.error("[GET /api/outreach/stats]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
