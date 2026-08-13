import mongoose, { Schema, Document } from "mongoose";

export interface ISong extends Document {
  title: string;
  artist: string;
  album: string;
  coverImage: string;
  audioUrl: string;
  year: number;
  genre: string;
  duration: number; // Duration in seconds
  createdAt: Date;
  updatedAt: Date;
}

const SongSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
    },
    artist: {
      type: String,
      required: [true, "Artist name is required"],
      trim: true,
    },
    album: {
      type: String,
      required: [true, "Album name is required"],
      trim: true,
    },
    coverImage: {
      type: String,
      required: [true, "Cover image URL is required"],
      trim: true,
    },
    audioUrl: {
      type: String,
      required: [true, "Audio URL is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Release year is required"],
      min: [1900, "Year must be 1900 or later"],
      max: [2100, "Year must be 2100 or earlier"],
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration in seconds is required"],
      min: [1, "Duration must be at least 1 second"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        (ret as any).id = ret._id.toString();
        return ret;
      },
    },
  }
);

export const Song = mongoose.models.Song || mongoose.model<ISong>("Song", SongSchema);
