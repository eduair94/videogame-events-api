import { Router } from 'express';
import { getLastSync, getSyncHistory, triggerGoogleSheetsSync, triggerSync } from '../controllers';

const router = Router();

/**
 * @route   POST /api/sync
 * @desc    Trigger data synchronization from CSV files (requires filesystem)
 */
router.post('/', triggerSync);

/**
 * @route   POST /api/sync/sheets
 * @desc    Trigger data synchronization from Google Sheets (Vercel-compatible, no filesystem)
 */
router.post('/sheets', triggerGoogleSheetsSync);

/**
 * @route   GET /api/sync/history
 * @desc    Get sync history
 * @query   limit (default: 10)
 */
router.get('/history', getSyncHistory);

/**
 * @route   GET /api/sync/last
 * @desc    Get the last sync record
 */
router.get('/last', getLastSync);

export default router;
