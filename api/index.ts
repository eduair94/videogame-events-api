import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/database';

// Cache the database connection
let isConnected = false;

async function ensureDbConnection() {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
}

const app = createApp();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureDbConnection();
    
    // Forward the request to Express
    return app(req as any, res as any);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
