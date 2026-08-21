export class AppError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  public constructor(resource: string, id: string) {
    super(404, 'RESOURCE_NOT_FOUND', `${resource} '${id}' was not found`);
  }
}
