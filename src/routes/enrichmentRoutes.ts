import { Router } from 'express';
import { enrichFromSteam, getStats, startEnrichment } from '../controllers/enrichmentController';

const router = Router();

/**
 * @route   GET /api/enrich/stats
 * @desc    Get enrichment statistics
 */
router.get('/stats', getStats);

/**
 * @route   POST /api/enrich
 * @desc    Start enrichment process for festivals
 * @query   force - Re-enrich already processed festivals (default: false)
 * @query   limit - Maximum number of festivals to process (default: 10)
 * @query   delay - Delay between requests in ms (default: 1000)
 */
router.post('/', startEnrichment);

/**
 * @route   POST /api/enrich/steam
 * @desc    Enrich festivals from Steam pages
 * @query   limit - Maximum number of festivals to process (default: 10)
 * @query   delay - Delay between requests in ms (default: 1500)
 */
router.post('/steam', enrichFromSteam);

export default router;
