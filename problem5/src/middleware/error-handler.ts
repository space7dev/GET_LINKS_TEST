import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
import { AppError } from '../errors/app-error.js';

export function notFoundHandler(): RequestHandler {
  return (request, response) => {
    response.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${request.method} ${request.path} was not found`,
      },
    });
  };
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, _next) => {
    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      });
      return;
    }

    if (isMalformedJsonError(error)) {
      response.status(400).json({
        error: { code: 'MALFORMED_JSON', message: 'Request body contains invalid JSON' },
      });
      return;
    }

    logger.error({ error, method: request.method, path: request.path }, 'Unhandled request error');
    response.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
    });
  };
}

function isMalformedJsonError(error: unknown): error is SyntaxError & { status: number } {
  return (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400 &&
    'body' in error
  );
}
