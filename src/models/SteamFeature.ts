import mongoose, { Schema, Document } from 'mongoose';

export interface ISteamFeature extends Document {
  festivalName: string;
  year2021: string;
  year2022: string;
  year2023: string;
  details2021: string;
  details2022: string;
  details2023: string;
  createdAt: Date;
  updatedAt: Date;
}

const SteamFeatureSchema = new Schema<ISteamFeature>(
  {
    festivalName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    year2021: {
      type: String,
      default: '',
    },
    year2022: {
      type: String,
      default: '',
    },
    year2023: {
      type: String,
      default: '',
    },
    details2021: {
      type: String,
      default: '',
    },
    details2022: {
      type: String,
      default: '',
    },
    details2023: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const SteamFeature = mongoose.model<ISteamFeature>('SteamFeature', SteamFeatureSchema);
