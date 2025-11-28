import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { swaggerSpec } from './swagger';

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

  // Swagger Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Indie Festivals API Documentation',
  }));

  // OpenAPI JSON endpoint (for AI/programmatic access)
  app.get('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API Routes
  app.use('/api', routes);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      name: 'Indie Festivals API',
      version: '1.0.0',
      description: 'API for showcasing indie game festival information',
      documentation: {
        swagger_ui: '/docs',
        openapi_json: '/openapi.json',
        ai_note: 'For AI/LLM integration, fetch /openapi.json for the complete OpenAPI 3.0 specification with semantic descriptions'
      },
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
        enrichment: {
          trigger: 'POST /api/enrich',
          stats: 'GET /api/enrich/stats',
          steam: 'POST /api/enrich/steam',
        },
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
