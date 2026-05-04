import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { CalendarSettings } from "../models/CalendarSettings";
import { DashboardConfig } from "../models/DashboardConfig";
import { env } from "../config/env";

export async function seedDefaults(): Promise<void> {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash("admin", 12);
    await User.create({
      username: "admin",
      passwordHash,
      displayName: "Administrator",
    });
    console.log("Default admin user created (username: admin, password: admin)");
  }

  const calSettings = await CalendarSettings.countDocuments();
  if (calSettings === 0 && env.icsFeedUrl) {
    await CalendarSettings.create({
      icsUrl: env.icsFeedUrl,
      pollingIntervalMinutes: 10,
    });
    console.log("Default calendar settings created");
  }

  const dashConfig = await DashboardConfig.countDocuments();
  if (dashConfig === 0) {
    await DashboardConfig.create({
      panels: [
        { panelId: "flights", visible: true, displayOrder: 0 },
        { panelId: "notices", visible: true, displayOrder: 1 },
        { panelId: "maintenance", visible: true, displayOrder: 2 },
      ],
      viewMode: "simultaneous",
      refreshIntervalSeconds: 60,
    });
    console.log("Default dashboard config created");
  }
}
