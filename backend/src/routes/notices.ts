import { Router, Request, Response } from "express";
import { Notice } from "../models/Notice";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const now = new Date();
  const notices = await Notice.find({
    publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
  }).sort({ displayOrder: 1 });
  res.json({ success: true, data: notices });
});

router.get("/all", requireAuth, async (_req: Request, res: Response) => {
  const notices = await Notice.find().sort({ createdAt: -1 });
  res.json({ success: true, data: notices });
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { title, body, priority, publishDate, expiryDate } = req.body;
  if (!title || !body) {
    res.status(400).json({ success: false, error: "Title and body required" });
    return;
  }

  const maxOrder = await Notice.findOne().sort({ displayOrder: -1 });
  const notice = await Notice.create({
    title,
    body,
    priority: priority || "normal",
    publishDate: publishDate || new Date(),
    expiryDate: expiryDate || null,
    displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
    createdBy: req.user!.userId,
  });
  res.status(201).json({ success: true, data: notice });
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!notice) {
    res.status(404).json({ success: false, error: "Notice not found" });
    return;
  }
  res.json({ success: true, data: notice });
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.put("/order", requireAuth, async (req: Request, res: Response) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    res.status(400).json({ success: false, error: "Order array required" });
    return;
  }
  await Promise.all(
    order.map((id: string, index: number) =>
      Notice.findByIdAndUpdate(id, { displayOrder: index })
    )
  );
  res.json({ success: true });
});

export default router;
