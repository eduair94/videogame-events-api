import { Router } from 'express';
import { triggerSync, getSyncHistory, getLastSync } from '../controllers';

const router = Router();

/**
 * @route   POST /api/sync
 * @desc    Trigger data synchronization from CSV files
 */
router.post('/', triggerSync);

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
