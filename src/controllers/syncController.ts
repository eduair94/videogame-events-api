import { NextFunction, Request, Response } from 'express';
import { SyncLog } from '../models';
import { syncAllData, syncFromGoogleSheets } from '../services';

export async function triggerSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log('🔄 Starting data sync...');
    const result = await syncAllData();

    res.json({
      success: result.errors.length === 0,
      message: result.errors.length === 0 
        ? 'Data synchronized successfully' 
        : 'Data synchronized with some errors',
      data: {
        festivalsCount: result.festivalsCount,
        steamFeaturesCount: result.steamFeaturesCount,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSyncHistory(
  req: Request<object, object, object, { limit?: number }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Number(req.query.limit) || 10;
    const logs = await SyncLog.find()
      .sort({ syncedAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLastSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const lastSync = await SyncLog.findOne().sort({ syncedAt: -1 });

    if (!lastSync) {
      res.status(404).json({
        success: false,
        error: 'No sync history found. Please run a sync first.',
      });
      return;
    }

    res.json({
      success: true,
      data: lastSync,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Trigger a sync from Google Sheets (Vercel-compatible, no filesystem)
 * This fetches the latest data from the Google Sheets and syncs it to MongoDB in-memory
 */
export async function triggerGoogleSheetsSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log('🔄 Starting Google Sheets sync...');
    const result = await syncFromGoogleSheets();

    res.json({
      success: result.errors.length === 0,
      message: result.errors.length === 0 
        ? 'Google Sheets data synchronized successfully' 
        : 'Google Sheets data synchronized with some errors',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
