import { Router, Request, Response } from "express";
import { Flight } from "../models/Flight";
import { CalendarSettings } from "../models/CalendarSettings";
import { requireAuth } from "../middleware/auth";
import { fetchAndStoreFlights } from "../services/icsPoller";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const filter: Record<string, unknown> = {};

  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from as string);
    if (to) range.$lte = new Date(to as string);
    filter.startDate = range;
  } else {
    filter.startDate = { $gte: new Date() };
  }

  const flights = await Flight.find(filter).sort({ startDate: 1 }).limit(200);
  res.json({ success: true, data: flights });
});

router.post("/refresh", requireAuth, async (_req: Request, res: Response) => {
  try {
    await fetchAndStoreFlights();
    res.json({ success: true, data: { message: "Flights refreshed" } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to refresh flights" });
  }
});

router.get("/status", requireAuth, async (_req: Request, res: Response) => {
  const settings = await CalendarSettings.findOne();
  res.json({
    success: true,
    data: settings
      ? {
          lastFetchAt: settings.lastFetchAt,
          lastFetchStatus: settings.lastFetchStatus,
          lastFetchError: settings.lastFetchError,
          icsUrl: settings.icsUrl,
          pollingIntervalMinutes: settings.pollingIntervalMinutes,
        }
      : null,
  });
});

router.put("/settings", requireAuth, async (req: Request, res: Response) => {
  const { icsUrl, pollingIntervalMinutes } = req.body;
  const settings = await CalendarSettings.findOneAndUpdate(
    {},
    { ...(icsUrl && { icsUrl }), ...(pollingIntervalMinutes && { pollingIntervalMinutes }) },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: settings });
});

export default router;
