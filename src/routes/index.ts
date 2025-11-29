import { Request, Response, Router } from 'express';
import enrichmentRoutes from './enrichmentRoutes';
import festivalRoutes from './festivalRoutes';
import steamFeatureRoutes from './steamFeatureRoutes';
import syncRoutes from './syncRoutes';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routes
router.use('/festivals', festivalRoutes);
router.use('/steam-features', steamFeatureRoutes);
router.use('/sync', syncRoutes);
router.use('/enrich', enrichmentRoutes);

export default router;
