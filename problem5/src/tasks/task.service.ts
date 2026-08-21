import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../errors/app-error.js';
import type { CreateTaskInput, Task, TaskFilters, TaskPage, UpdateTaskInput } from './task.js';
import type { TaskRepository } from './task.repository.js';

export class TaskService {
  public constructor(private readonly repository: TaskRepository) {}

  public create(input: CreateTaskInput): Task {
    return this.repository.create(randomUUID(), input, new Date().toISOString());
  }

  public list(filters: TaskFilters): TaskPage {
    return this.repository.list(filters);
  }

  public get(id: string): Task {
    const task = this.repository.getById(id);
    if (!task) throw new NotFoundError('Task', id);
    return task;
  }

  public update(id: string, input: UpdateTaskInput): Task {
    const task = this.repository.update(id, input, new Date().toISOString());
    if (!task) throw new NotFoundError('Task', id);
    return task;
  }

  public delete(id: string): void {
    if (!this.repository.delete(id)) throw new NotFoundError('Task', id);
  }
}
