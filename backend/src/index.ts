import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { seedDefaults } from "./services/seed";
import { startIcsPolling } from "./services/icsPoller";

import authRoutes from "./routes/auth";
import flightRoutes from "./routes/flights";
import noticeRoutes from "./routes/notices";
import maintenanceRoutes from "./routes/maintenance";
import dashboardRoutes from "./routes/dashboard";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: "Too many attempts" } });
app.use("/api/v1/auth/login", authLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/flights", flightRoutes);
app.use("/api/v1/notices", noticeRoutes);
app.use("/api/v1/maintenance", maintenanceRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function start() {
  await connectDB();
  await seedDefaults();
  startIcsPolling();

  app.listen(env.port, () => {
    console.log(`MJC API running on port ${env.port}`);
  });
}

start();
