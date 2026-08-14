import mongoose, { Document, Schema } from "mongoose";

export interface IArtist extends Document {
  name: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema = new Schema<IArtist>(
  {
    name: { type: String, required: [true, "Artist name is required"], trim: true, unique: true },
    imageUrl: { type: String, required: [true, "Artist image is required"], trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const output = ret as any;
        output.id = output._id.toString();
        output.image = output.imageUrl;
      },
    },
  },
);

export const Artist = mongoose.models.Artist || mongoose.model<IArtist>("Artist", ArtistSchema);
