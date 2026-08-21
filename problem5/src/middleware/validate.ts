import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export type RequestLocation = 'body' | 'params' | 'query';

export function validate(location: RequestLocation, schema: ZodType): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse(request[location]);

    if (!result.success) {
      response.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      return;
    }

    response.locals[location] = result.data;
    next();
  };
}
