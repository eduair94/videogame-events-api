import { NextFunction, Request, Response } from 'express';
import { Festival } from '../models';

interface FestivalQuery {
  category?: 'curated' | 'on-the-fence';
  type?: string;
  submissionOpen?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getAllFestivals(
  req: Request<object, object, object, FestivalQuery>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      category,
      type,
      submissionOpen,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query: Record<string, unknown> = {};

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }

    if (submissionOpen !== undefined) {
      query.submissionOpen = submissionOpen === true || String(submissionOpen) === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { comments: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === 'desc' ? -1 : 1,
    };

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);

    const [festivals, total] = await Promise.all([
      Festival.find(query).sort(sort).skip(skip).limit(limitNum),
      Festival.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: festivals,
      pagination: {
        page: Number(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFestivalById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const festival = await Festival.findById(req.params.id);

    if (!festival) {
      res.status(404).json({
        success: false,
        error: 'Festival not found',
      });
      return;
    }

    res.json({
      success: true,
      data: festival,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOpenSubmissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const festivals = await Festival.find({
      submissionOpen: true,
    }).sort({ deadline: 1 });

    res.json({
      success: true,
      data: festivals,
      count: festivals.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingDeadlines(
  req: Request<object, object, object, { days?: number }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const days = Number(req.query.days) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    // Get festivals with upcoming deadlines within the specified days
    const festivals = await Festival.find({
      deadline: { $nin: [null, 'TBA', ''] },
      daysToSubmit: {
        $gte: 0,
        $lte: days,
      },
    }).sort({ daysToSubmit: 1 });

    res.json({
      success: true,
      data: festivals,
      count: festivals.length,
      period: {
        from: today.toISOString().split('T')[0],
        to: futureDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTbaFestivals(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const festivals = await Festival.find({
      deadline: 'TBA',
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: festivals,
      count: festivals.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFestivalTypes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const types = await Festival.distinct('type') as string[];

    res.json({
      success: true,
      data: types.filter((t: string) => t && t.trim() !== ''),
    });
  } catch (error) {
    next(error);
  }
}

interface TypeBreakdown {
  _id: string;
  count: number;
}

export async function getFestivalStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalCount,
      curatedCount,
      onTheFenceCount,
      openSubmissionsCount,
      typeBreakdown,
    ] = await Promise.all([
      Festival.countDocuments(),
      Festival.countDocuments({ category: 'curated' }),
      Festival.countDocuments({ category: 'on-the-fence' }),
      Festival.countDocuments({ submissionOpen: true }),
      Festival.aggregate<TypeBreakdown>([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total: totalCount,
        curated: curatedCount,
        onTheFence: onTheFenceCount,
        openSubmissions: openSubmissionsCount,
        byType: typeBreakdown.map((t: TypeBreakdown) => ({
          type: t._id || 'Unknown',
          count: t.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
