import { Request, Response, NextFunction } from 'express';
import { SteamFeature, ISteamFeature } from '../models';

export async function getAllSteamFeatures(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const features = await SteamFeature.find().sort({ festivalName: 1 });

    res.json({
      success: true,
      data: features,
      count: features.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSteamFeatureByFestival(
  req: Request<{ name: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const feature = await SteamFeature.findOne({
      festivalName: { $regex: req.params.name, $options: 'i' },
    });

    if (!feature) {
      res.status(404).json({
        success: false,
        error: 'Steam feature record not found for this festival',
      });
      return;
    }

    res.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFeaturedFestivals(
  req: Request<object, object, object, { year?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const year = req.query.year || '2023';
    const yearField = `year${year}` as 'year2021' | 'year2022' | 'year2023';

    const features = await SteamFeature.find({
      [yearField]: 'Y',
    }).sort({ festivalName: 1 });

    res.json({
      success: true,
      data: features,
      count: features.length,
      year,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSteamFeatureStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const features = await SteamFeature.find();

    const stats = {
      total: features.length,
      featured2021: features.filter((f: ISteamFeature) => f.year2021 === 'Y').length,
      featured2022: features.filter((f: ISteamFeature) => f.year2022 === 'Y').length,
      featured2023: features.filter((f: ISteamFeature) => f.year2023 === 'Y').length,
      noFeaturing2021: features.filter((f: ISteamFeature) => f.year2021 === 'N').length,
      noFeaturing2022: features.filter((f: ISteamFeature) => f.year2022 === 'N').length,
      noFeaturing2023: features.filter((f: ISteamFeature) => f.year2023 === 'N').length,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
