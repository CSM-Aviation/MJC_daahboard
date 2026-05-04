import mongoose, { Schema, Document } from "mongoose";

export interface IDashboardConfig extends Document {
  panels: Array<{
    panelId: string;
    visible: boolean;
    displayOrder: number;
  }>;
  viewMode: "simultaneous" | "rotating" | "single";
  rotationIntervalSeconds?: number | null;
  singlePanelFocus?: string | null;
  refreshIntervalSeconds: number;
  updatedAt: Date;
  updatedBy?: mongoose.Types.ObjectId;
}

const dashboardConfigSchema = new Schema<IDashboardConfig>({
  panels: [{
    panelId: { type: String, required: true },
    visible: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  }],
  viewMode: { type: String, enum: ["simultaneous", "rotating", "single"], default: "simultaneous" },
  rotationIntervalSeconds: { type: Number, default: null },
  singlePanelFocus: { type: String, default: null },
  refreshIntervalSeconds: { type: Number, default: 60 },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const DashboardConfig = mongoose.model<IDashboardConfig>("DashboardConfig", dashboardConfigSchema);
