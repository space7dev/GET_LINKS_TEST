import type { RequestHandler } from 'express';
import type { CreateTaskInput, TaskFilters, UpdateTaskInput } from './task.js';
import type { TaskService } from './task.service.js';

export class TaskController {
  public constructor(private readonly service: TaskService) {}

  public create: RequestHandler = (_request, response) => {
    const task = this.service.create(response.locals.body as CreateTaskInput);
    response.status(201).location(`/api/v1/tasks/${task.id}`).json({ data: task });
  };

  public list: RequestHandler = (_request, response) => {
    response.json(this.service.list(response.locals.query as TaskFilters));
  };

  public get: RequestHandler = (_request, response) => {
    const { id } = response.locals.params as { id: string };
    response.json({ data: this.service.get(id) });
  };

  public update: RequestHandler = (_request, response) => {
    const { id } = response.locals.params as { id: string };
    response.json({ data: this.service.update(id, response.locals.body as UpdateTaskInput) });
  };

  public delete: RequestHandler = (_request, response) => {
    const { id } = response.locals.params as { id: string };
    this.service.delete(id);
    response.status(204).send();
  };
}
