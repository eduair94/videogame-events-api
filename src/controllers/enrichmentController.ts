import { Request, Response } from 'express';
import { enrichAllFestivals, enrichFromSteamPages, getEnrichmentStats } from '../services/enrichmentService';

/**
 * Get enrichment statistics
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getEnrichmentStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * Start enrichment process for all festivals
 */
export const startEnrichment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { force, limit, delay } = req.query;
    
    const options = {
      force: force === 'true',
      limit: limit ? parseInt(limit as string, 10) : 0,
      delayMs: delay ? parseInt(delay as string, 10) : 1000,
    };

    // For API calls, we limit by default to avoid long-running requests
    if (!options.limit) {
      options.limit = 10;
    }

    console.log(`\n🚀 Starting enrichment via API (limit: ${options.limit})\n`);
    
    const stats = await enrichAllFestivals(options);
    
    res.json({
      success: true,
      message: 'Enrichment completed',
      data: stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
};

/**
 * Enrich festivals from Steam pages
 */
export const enrichFromSteam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, delay } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit as string, 10) : 10,
      delayMs: delay ? parseInt(delay as string, 10) : 1500,
    };

    console.log(`\n🎮 Starting Steam enrichment via API (limit: ${options.limit})\n`);
    
    const stats = await enrichFromSteamPages(options);
    
    res.json({
      success: true,
      message: 'Steam enrichment completed',
      data: stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
};
