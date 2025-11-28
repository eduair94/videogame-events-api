import mongoose, { Schema } from 'mongoose';

export interface ISyncLog {
  syncedAt: Date;
  filesProcessed: string[];
  festivalsCount: number;
  steamFeaturesCount: number;
  status: 'success' | 'partial' | 'failed';
  syncErrors: string[];
}

const SyncLogSchema = new Schema<ISyncLog>({
  syncedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  filesProcessed: {
    type: [String],
    default: [],
  },
  festivalsCount: {
    type: Number,
    default: 0,
  },
  steamFeaturesCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    required: true,
  },
  syncErrors: {
    type: [String],
    default: [],
  },
});

export const SyncLog = mongoose.model<ISyncLog>('SyncLog', SyncLogSchema);
