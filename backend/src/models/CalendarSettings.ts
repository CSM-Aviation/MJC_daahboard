import mongoose, { Schema, Document } from "mongoose";

export interface ICalendarSettings extends Document {
  icsUrl: string;
  pollingIntervalMinutes: number;
  lastFetchAt?: Date | null;
  lastFetchStatus?: "success" | "error";
  lastFetchError?: string | null;
  updatedAt: Date;
}

const calendarSettingsSchema = new Schema<ICalendarSettings>({
  icsUrl: { type: String, required: true },
  pollingIntervalMinutes: { type: Number, default: 10 },
  lastFetchAt: { type: Date, default: null },
  lastFetchStatus: { type: String, enum: ["success", "error"], default: null },
  lastFetchError: { type: String, default: null },
}, { timestamps: true });

export const CalendarSettings = mongoose.model<ICalendarSettings>("CalendarSettings", calendarSettingsSchema);
