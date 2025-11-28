import { Router } from 'express';
import {
  getAllSteamFeatures,
  getSteamFeatureByFestival,
  getFeaturedFestivals,
  getSteamFeatureStats,
} from '../controllers';

const router = Router();

/**
 * @route   GET /api/steam-features
 * @desc    Get all Steam feature tracking records
 */
router.get('/', getAllSteamFeatures);

/**
 * @route   GET /api/steam-features/stats
 * @desc    Get Steam featuring statistics
 */
router.get('/stats', getSteamFeatureStats);

/**
 * @route   GET /api/steam-features/featured
 * @desc    Get festivals that were featured on Steam
 * @query   year (2021, 2022, or 2023)
 */
router.get('/featured', getFeaturedFestivals);

/**
 * @route   GET /api/steam-features/:name
 * @desc    Get Steam feature record for a specific festival
 */
router.get('/:name', getSteamFeatureByFestival);

export default router;
