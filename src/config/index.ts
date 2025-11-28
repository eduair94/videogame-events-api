import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/indie-festivals',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  data: {
    csvPath: process.env.CSV_DATA_PATH || './downloads',
  },
} as const;

export const csvFiles = {
  curated: path.resolve(config.data.csvPath, 'Worthy festivals for Indie games - Curated.csv'),
  onTheFence: path.resolve(config.data.csvPath, 'Worthy festivals for Indie games - On the Fence.csv'),
  steamTracker: path.resolve(config.data.csvPath, 'Worthy festivals for Indie games - Steam feature tracker.csv'),
};
