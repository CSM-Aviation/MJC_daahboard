import { Router, Request, Response } from "express";
import multer from "multer";
import { MaintenanceItem, MaintenanceUpload } from "../models/Maintenance";
import { requireAuth } from "../middleware/auth";
import { parseExcel } from "../services/excelParser";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const items = await MaintenanceItem.find().sort({ expectedDelivery: 1 });
  res.json({ success: true, data: items });
});

router.post("/upload", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }

  try {
    const rows = parseExcel(req.file.buffer);

    const uploadRecord = await MaintenanceUpload.create({
      filename: req.file.originalname,
      uploadedBy: req.user!.userId,
      itemCount: rows.length,
    });

    await MaintenanceItem.deleteMany({});
    const items = rows.map((row) => ({ ...row, uploadId: uploadRecord._id }));
    await MaintenanceItem.insertMany(items);

    res.status(201).json({ success: true, data: { uploadId: uploadRecord._id, itemCount: rows.length } });
  } catch (err) {
    res.status(400).json({ success: false, error: "Failed to parse Excel file" });
  }
});

router.get("/history", requireAuth, async (_req: Request, res: Response) => {
  const uploads = await MaintenanceUpload.find()
    .populate("uploadedBy", "username displayName")
    .sort({ uploadedAt: -1 })
    .limit(20);
  res.json({ success: true, data: uploads });
});

export default router;
