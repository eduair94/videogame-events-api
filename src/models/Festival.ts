import mongoose, { Document, Schema } from 'mongoose';

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

export interface IAIEnrichment {
  entity: string | null;
  type: string | null;
  status: string | null;
  overview: {
    description: string | null;
    primaryPlatform: string | null;
    organizers: string[];
    objective: string | null;
    bannerImageUrl: string | null;
  };
  eventDetails: {
    currentEdition: string | null;
    typicalDuration: string | null;
    offerings: string[];
  };
  keyParticipants: {
    notableStudios: string[];
    featuredGames: {
      title: string;
      developer: string;
      genre: string;
      imageUrl: string | null;
      steamUrl: string | null;
    }[];
  };
  industryContext: {
    location: string | null;
    significance: string | null;
  };
  version: number;
  enrichedAt: Date | null;
  enrichmentStatus: 'pending' | 'enriched' | 'failed' | 'skipped';
}

export interface IFestival extends Document {
  name: string;
  slug: string;
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
  // Sync tracking field
  lastSyncedAt: Date | null;
  // Enrichment fields
  enrichment: IFestivalEnrichment;
  aiEnrichment: IAIEnrichment;
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

const FeaturedGameSchema = new Schema(
  {
    title: { type: String, default: '' },
    developer: { type: String, default: '' },
    genre: { type: String, default: '' },
    imageUrl: { type: String, default: null },
    steamUrl: { type: String, default: null },
  },
  { _id: false }
);

const AIEnrichmentSchema = new Schema<IAIEnrichment>(
  {
    entity: { type: String, default: null },
    type: { type: String, default: null },
    status: { type: String, default: null },
    overview: {
      description: { type: String, default: null },
      primaryPlatform: { type: String, default: null },
      organizers: [{ type: String }],
      objective: { type: String, default: null },
      bannerImageUrl: { type: String, default: null },
    },
    eventDetails: {
      currentEdition: { type: String, default: null },
      typicalDuration: { type: String, default: null },
      offerings: [{ type: String }],
    },
    keyParticipants: {
      notableStudios: [{ type: String }],
      featuredGames: [FeaturedGameSchema],
    },
    industryContext: {
      location: { type: String, default: null },
      significance: { type: String, default: null },
    },
    version: { type: Number, default: 0 },
    enrichedAt: { type: Date, default: null },
    enrichmentStatus: {
      type: String,
      enum: ['pending', 'enriched', 'failed', 'skipped'],
      default: 'pending',
    },
  },
  { _id: false }
);

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

const FestivalSchema = new Schema<IFestival>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
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
    lastSyncedAt: {
      type: Date,
      default: null,
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
    aiEnrichment: {
      type: AIEnrichmentSchema,
      default: () => ({
        entity: null,
        type: null,
        status: null,
        overview: {
          description: null,
          primaryPlatform: null,
          organizers: [],
          objective: null,
          bannerImageUrl: null,
        },
        eventDetails: {
          currentEdition: null,
          typicalDuration: null,
          offerings: [],
        },
        keyParticipants: {
          notableStudios: [],
          featuredGames: [],
        },
        industryContext: {
          location: null,
          significance: null,
        },
        version: 0,
        enrichedAt: null,
        enrichmentStatus: 'pending',
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug from name
FestivalSchema.pre('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for duplicate slugs and append counter if needed
    while (true) {
      const existing = await mongoose.models.Festival.findOne({ 
        slug, 
        _id: { $ne: this._id } 
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

// Compound unique index for name + category (prevents duplicate festivals)
FestivalSchema.index({ name: 1, category: 1 }, { unique: true });

// Compound index for common queries
FestivalSchema.index({ category: 1, type: 1 });
FestivalSchema.index({ deadline: 1 });
FestivalSchema.index({ submissionOpen: 1 });
FestivalSchema.index({ 'aiEnrichment.enrichmentStatus': 1 });

export const Festival = mongoose.model<IFestival>('Festival', FestivalSchema);

// Export the generateSlug function for use in scripts
export { generateSlug };
