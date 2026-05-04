import mongoose, { Schema, Document } from "mongoose";

export interface INotice extends Document {
  title: string;
  body: string;
  priority: "normal" | "important" | "urgent";
  publishDate: Date;
  expiryDate?: Date | null;
  displayOrder: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>({
  title: { type: String, required: true },
  body: { type: String, required: true },
  priority: { type: String, enum: ["normal", "important", "urgent"], default: "normal" },
  publishDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: null },
  displayOrder: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export const Notice = mongoose.model<INotice>("Notice", noticeSchema);
