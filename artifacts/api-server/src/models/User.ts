import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document { name: string; email: string; passwordHash?: string; googleId?: string; authProvider: "email" | "google"; isEmailVerified: boolean; otpHash?: string; otpExpiresAt?: Date; otpLastSentAt?: Date; }
const UserSchema = new Schema<IUser>({ name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true }, passwordHash: String, googleId: { type: String, sparse: true }, authProvider: { type: String, enum: ["email", "google"], required: true }, isEmailVerified: { type: Boolean, default: false }, otpHash: String, otpExpiresAt: Date, otpLastSentAt: Date }, { timestamps: true });
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
