import mongoose, { Schema, Document } from "mongoose";

export interface IFlight extends Document {
  uid: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  startDate: Date;
  endDate: Date;
  rawEvent: Record<string, unknown>;
  fetchedAt: Date;
}

const flightSchema = new Schema<IFlight>({
  uid: { type: String, required: true, unique: true },
  summary: { type: String, required: true },
  description: { type: String, default: null },
  location: { type: String, default: null },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rawEvent: { type: Schema.Types.Mixed, default: {} },
  fetchedAt: { type: Date, default: Date.now },
});

flightSchema.index({ startDate: 1 });

export const Flight = mongoose.model<IFlight>("Flight", flightSchema);
