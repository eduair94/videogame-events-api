import { createApp } from './app';
import { connectDatabase } from './database';
import { config } from './config';
import { syncAllData } from './services';

async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Initial data sync
    console.log('🔄 Performing initial data sync...');
    const syncResult = await syncAllData();
    console.log(`📊 Synced ${syncResult.festivalsCount} festivals and ${syncResult.steamFeaturesCount} steam features`);
    
    if (syncResult.errors.length > 0) {
      console.warn('⚠️ Sync completed with errors:', syncResult.errors);
    }

    // Create and start server
    const app = createApp();
    
    app.listen(config.server.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.server.port}`);
      console.log(`📚 API documentation available at http://localhost:${config.server.port}`);
      console.log(`🔧 Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

bootstrap();
