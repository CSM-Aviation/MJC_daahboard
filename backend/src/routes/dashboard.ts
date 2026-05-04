import { Router, Request, Response } from "express";
import { DashboardConfig } from "../models/DashboardConfig";
import { requireAuth } from "../middleware/auth";

const DEFAULT_PANELS = [
  { panelId: "flights", visible: true, displayOrder: 0 },
  { panelId: "notices", visible: true, displayOrder: 1 },
  { panelId: "maintenance", visible: true, displayOrder: 2 },
];

const router = Router();

router.get("/config", async (_req: Request, res: Response) => {
  let config = await DashboardConfig.findOne();
  if (!config) {
    config = await DashboardConfig.create({
      panels: DEFAULT_PANELS,
      viewMode: "simultaneous",
      refreshIntervalSeconds: 60,
    });
  }
  res.json({ success: true, data: config });
});

router.put("/config", requireAuth, async (req: Request, res: Response) => {
  const config = await DashboardConfig.findOneAndUpdate(
    {},
    { ...req.body, updatedBy: req.user!.userId },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: config });
});

export default router;
