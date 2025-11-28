import mongoose, { Schema, Document } from 'mongoose';

export interface IFestivalEnrichment {
  imageUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  twitter: string | null;
  discord: string | null;
  location: string | null;
  organizer: string | null;
  verifiedAt: Date | null;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'outdated';
  lastCheckedAt: Date | null;
}

export interface IFestival extends Document {
  name: string;
  type: string;
  when: string;
  deadline: string | null;
  submissionOpen: boolean;
  price: string;
  hasSteamPage: string;
  worthIt: string;
  comments: string;
  eventOfficialPage: string;
  latestSteamPage: string;
  daysToSubmit: number | null;
  category: 'curated' | 'on-the-fence';
  // Enrichment fields
  enrichment: IFestivalEnrichment;
  createdAt: Date;
  updatedAt: Date;
}

const EnrichmentSchema = new Schema<IFestivalEnrichment>(
  {
    imageUrl: { type: String, default: null },
    logoUrl: { type: String, default: null },
    description: { type: String, default: null },
    twitter: { type: String, default: null },
    discord: { type: String, default: null },
    location: { type: String, default: null },
    organizer: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'outdated'],
      default: 'pending',
    },
    lastCheckedAt: { type: Date, default: null },
  },
  { _id: false }
);

const FestivalSchema = new Schema<IFestival>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    when: {
      type: String,
      default: '',
    },
    deadline: {
      type: String,
      default: null,
    },
    submissionOpen: {
      type: Boolean,
      default: false,
    },
    price: {
      type: String,
      default: '',
    },
    hasSteamPage: {
      type: String,
      default: '',
    },
    worthIt: {
      type: String,
      default: '',
    },
    comments: {
      type: String,
      default: '',
    },
    eventOfficialPage: {
      type: String,
      default: '',
    },
    latestSteamPage: {
      type: String,
      default: '',
    },
    daysToSubmit: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      enum: ['curated', 'on-the-fence'],
      required: true,
      index: true,
    },
    enrichment: {
      type: EnrichmentSchema,
      default: () => ({
        imageUrl: null,
        logoUrl: null,
        description: null,
        twitter: null,
        discord: null,
        location: null,
        organizer: null,
        verifiedAt: null,
        verificationStatus: 'pending',
        lastCheckedAt: null,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for common queries
FestivalSchema.index({ category: 1, type: 1 });
FestivalSchema.index({ deadline: 1 });
FestivalSchema.index({ submissionOpen: 1 });

export const Festival = mongoose.model<IFestival>('Festival', FestivalSchema);
