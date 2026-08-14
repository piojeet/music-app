import mongoose, { Document, Schema } from "mongoose";

export interface IMix extends Document {
  title: string;
  subtitle: string;
  imageUrl: string;
  songIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MixSchema = new Schema<IMix>({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "Made for you", trim: true },
  imageUrl: { type: String, required: true, trim: true },
  songIds: { type: [String], default: [] },
}, { timestamps: true, toJSON: { transform(_doc, ret) { const output = ret as any; output.id = output._id.toString(); output.image = output.imageUrl; } } });

export const Mix = mongoose.models.Mix || mongoose.model<IMix>("Mix", MixSchema);
