import { Router, Request, Response } from "express";
import clientPromise from "../config/db";
import { ObjectId } from "mongodb";
// @ts-ignore
const pdfParse = require("pdf-parse");

const router = Router();

// GET /api/debug/cv
router.get("/cv", async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();

    const campaigns = await db.collection("outreach_campaigns").find().sort({ _id: -1 }).limit(1).toArray();
    const campaign = campaigns[0];

    if (!campaign?.attachedCvId) {
      return res.json({ error: "No CV attached to latest campaign" });
    }

    const cvDoc = await db.collection("cv_documents").findOne({
      _id: new ObjectId(campaign.attachedCvId),
    });

    if (!cvDoc) {
      return res.json({ error: "Attached CV not found in DB" });
    }

    let cvText = null;
    let errorStr = null;
    let cvType = cvDoc.mimeType;

    if (cvDoc.data && cvDoc.mimeType === "application/pdf") {
      try {
        const base64Data = cvDoc.data.includes(",") ? cvDoc.data.split(",")[1] : cvDoc.data;
        const buffer = Buffer.from(base64Data, "base64");
        const pdfData = await pdfParse(buffer);
        cvText = pdfData.text;
      } catch (err) {
        errorStr = String(err);
      }
    }

    return res.json({
      cvId: cvDoc._id,
      cvType,
      textLength: cvText?.length,
      textSnippet: cvText ? cvText.substring(0, 500) : null,
      errorStr,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// GET /api/debug/cv2
router.get("/cv2", async (req: Request, res: Response) => {
  try {
    const client = await clientPromise;
    const db = client.db();

    const campaigns = await db.collection("outreach_campaigns").find().sort({ _id: -1 }).limit(1).toArray();
    const campaign = campaigns[0];

    if (!campaign?.attachedCvId) {
      return res.json({ error: "No CV attached to latest campaign" });
    }

    const cvDoc = await db.collection("cv_documents").findOne({
      _id: new ObjectId(campaign.attachedCvId),
    });

    if (!cvDoc) {
      return res.json({ error: "Attached CV not found in DB" });
    }

    let cvText = null;
    let errorStr = null;
    let cvType = cvDoc.mimeType;

    if (cvDoc.data && cvDoc.mimeType === "application/pdf") {
      try {
        const base64Data = cvDoc.data.includes(",") ? cvDoc.data.split(",")[1] : cvDoc.data;
        const buffer = Buffer.from(base64Data, "base64");

        const { PDFParse } = require("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const pdfData = await parser.getText();
        cvText = pdfData.text;
      } catch (err) {
        errorStr = String(err);
      }
    }

    return res.json({
      cvId: cvDoc._id,
      cvType,
      textLength: cvText?.length,
      textSnippet: cvText ? cvText.substring(0, 500) : null,
      errorStr,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// GET /api/debug/pdf-parse
router.get("/pdf-parse", async (req: Request, res: Response) => {
  try {
    return res.json({
      type: typeof pdfParse,
      keys: Object.keys(pdfParse || {}),
      defaultType: typeof (pdfParse as any).default,
      pdfParseStr: String(pdfParse),
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
