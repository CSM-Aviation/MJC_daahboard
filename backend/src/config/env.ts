import dotenv from "dotenv";
dotenv.config();

const mongoPassword = process.env.MONGO_PASSWORD || "root";
const mongodbUri = (process.env.MONGODB_URI || "mongodb://localhost:27017/mjc_dashboard")
  .replace("${MONGO_PASSWORD}", mongoPassword);

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongodbUri,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  icsFeedUrl: process.env.ICS_FEED_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};
