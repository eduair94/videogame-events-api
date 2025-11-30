import { Router } from 'express';
import { enrichFromSteam, enrichImagesFromGoogle, getStats, startEnrichment } from '../controllers/enrichmentController';

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

/**
 * @route   POST /api/enrich/google-images
 * @desc    Enrich festivals with images from Google Image Search using RapidAPI
 * @query   limit - Maximum number of festivals to process (default: 10)
 * @query   delay - Delay between requests in ms (default: 2000)
 */
router.post('/google-images', enrichImagesFromGoogle);

export default router;
