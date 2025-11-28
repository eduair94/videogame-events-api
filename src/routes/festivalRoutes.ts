import { Router } from 'express';
import {
  getAllFestivals,
  getFestivalById,
  getOpenSubmissions,
  getUpcomingDeadlines,
  getFestivalTypes,
  getFestivalStats,
} from '../controllers';

const router = Router();

/**
 * @route   GET /api/festivals
 * @desc    Get all festivals with filtering, sorting, and pagination
 * @query   category, type, submissionOpen, search, sortBy, sortOrder, page, limit
 */
router.get('/', getAllFestivals);

/**
 * @route   GET /api/festivals/stats
 * @desc    Get festival statistics
 */
router.get('/stats', getFestivalStats);

/**
 * @route   GET /api/festivals/types
 * @desc    Get all unique festival types
 */
router.get('/types', getFestivalTypes);

/**
 * @route   GET /api/festivals/open
 * @desc    Get festivals with open submissions
 */
router.get('/open', getOpenSubmissions);

/**
 * @route   GET /api/festivals/upcoming
 * @desc    Get festivals with upcoming deadlines
 * @query   days (default: 30)
 */
router.get('/upcoming', getUpcomingDeadlines);

/**
 * @route   GET /api/festivals/:id
 * @desc    Get a single festival by ID
 */
router.get('/:id', getFestivalById);

export default router;
