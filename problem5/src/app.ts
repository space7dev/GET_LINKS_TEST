import express, { type Express } from 'express';
import pino, { type Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { AppConfig } from './config/env.js';
import type { SqliteDatabase } from './database/database.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createTaskRouter } from './tasks/task.routes.js';

export interface AppDependencies {
  config: AppConfig;
  database: SqliteDatabase;
  logger?: Logger;
}

export function createApp({ config, database, logger = createLogger(config) }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    pinoHttp({
      logger,
      autoLogging: config.NODE_ENV !== 'test',
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use('/api/v1/tasks', createTaskRouter(database));

  app.use(notFoundHandler());
  app.use(errorHandler(logger));
  return app;
}

export function createLogger(config: AppConfig): Logger {
  return pino({ level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL });
}
