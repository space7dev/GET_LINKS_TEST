import { createApp, createLogger } from './app.js';
import { loadConfig } from './config/env.js';
import { createDatabase } from './database/database.js';

const config = loadConfig();
const logger = createLogger(config);
const database = createDatabase(config.DATABASE_PATH);
const app = createApp({ config, database, logger });

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, environment: config.NODE_ENV }, 'Server listening');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down');
  server.close((error) => {
    database.close();
    if (error) {
      logger.error({ error }, 'Graceful shutdown failed');
      process.exitCode = 1;
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
