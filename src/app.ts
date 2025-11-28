import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging in development
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  // API Routes
  app.use('/api', routes);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      name: 'Indie Festivals API',
      version: '1.0.0',
      description: 'API for showcasing indie game festival information',
      endpoints: {
        health: 'GET /api/health',
        festivals: {
          list: 'GET /api/festivals',
          stats: 'GET /api/festivals/stats',
          types: 'GET /api/festivals/types',
          open: 'GET /api/festivals/open',
          upcoming: 'GET /api/festivals/upcoming',
          byId: 'GET /api/festivals/:id',
        },
        steamFeatures: {
          list: 'GET /api/steam-features',
          stats: 'GET /api/steam-features/stats',
          featured: 'GET /api/steam-features/featured',
          byName: 'GET /api/steam-features/:name',
        },
        sync: {
          trigger: 'POST /api/sync',
          history: 'GET /api/sync/history',
          last: 'GET /api/sync/last',
        },
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
