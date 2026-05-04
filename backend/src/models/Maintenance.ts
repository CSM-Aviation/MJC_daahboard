import mongoose, { Schema, Document } from "mongoose";

export interface IMaintenanceItem extends Document {
  partName: string;
  partNumber?: string | null;
  aircraft?: string | null;
  status: string;
  orderDate?: Date | null;
  expectedDelivery?: Date | null;
  notes?: string | null;
  uploadId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const maintenanceItemSchema = new Schema<IMaintenanceItem>({
  partName: { type: String, required: true },
  partNumber: { type: String, default: null },
  aircraft: { type: String, default: null },
  status: { type: String, required: true },
  orderDate: { type: Date, default: null },
  expectedDelivery: { type: Date, default: null },
  notes: { type: String, default: null },
  uploadId: { type: Schema.Types.ObjectId, ref: "MaintenanceUpload", required: true },
}, { timestamps: true });

export const MaintenanceItem = mongoose.model<IMaintenanceItem>("MaintenanceItem", maintenanceItemSchema);

export interface IMaintenanceUpload extends Document {
  filename: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  itemCount: number;
}

const maintenanceUploadSchema = new Schema<IMaintenanceUpload>({
  filename: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
  itemCount: { type: Number, default: 0 },
});

export const MaintenanceUpload = mongoose.model<IMaintenanceUpload>("MaintenanceUpload", maintenanceUploadSchema);
