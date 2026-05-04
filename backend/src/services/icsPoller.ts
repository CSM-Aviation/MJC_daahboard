import ical from "node-ical";
import cron from "node-cron";
import { Flight } from "../models/Flight";
import { CalendarSettings } from "../models/CalendarSettings";
import { env } from "../config/env";

export async function fetchAndStoreFlights(): Promise<void> {
  const settings = await CalendarSettings.findOne();
  const url = settings?.icsUrl || env.icsFeedUrl;

  if (!url) {
    console.warn("No ICS feed URL configured — skipping flight fetch");
    return;
  }

  try {
    const events = await ical.async.fromURL(url);

    for (const [, event] of Object.entries(events)) {
      if (event.type !== "VEVENT") continue;

      await Flight.findOneAndUpdate(
        { uid: event.uid },
        {
          uid: event.uid,
          summary: event.summary || "Untitled",
          description: event.description || null,
          location: event.location || null,
          startDate: event.start,
          endDate: event.end,
          rawEvent: event,
          fetchedAt: new Date(),
        },
        { upsert: true }
      );
    }

    await CalendarSettings.findOneAndUpdate(
      {},
      { lastFetchAt: new Date(), lastFetchStatus: "success", lastFetchError: null },
      { upsert: true }
    );

    console.log("ICS feed fetched successfully");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await CalendarSettings.findOneAndUpdate(
      {},
      { lastFetchAt: new Date(), lastFetchStatus: "error", lastFetchError: message },
      { upsert: true }
    );
    console.error("ICS fetch error:", message);
  }
}

export function startIcsPolling(): void {
  cron.schedule("*/10 * * * *", () => {
    fetchAndStoreFlights();
  });
  console.log("ICS polling scheduled (every 10 minutes)");

  fetchAndStoreFlights();
}
