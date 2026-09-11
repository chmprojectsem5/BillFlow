const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

let server;

// Start server and connect to DB
const startServer = async () => {
  await connectDB();
  
  server = app.listen(env.port, () => {
    console.log(`[Server] Running on port ${env.port} in ${env.nodeEnv} mode`);
    
    // Auto-shutdown for testing if requested
    if (process.env.TEST_STARTUP) {
      setTimeout(() => {
        console.log('[Test] Gracefully shutting down...');
        server.close(() => process.exit(0));
      }, 1000);
    }
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION] Shutting down...');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on SIGTERM (e.g., Heroku, Render, Docker)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  }
});
