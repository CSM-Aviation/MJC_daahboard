import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  displayName?: string;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const User = mongoose.model<IUser>("User", userSchema);
