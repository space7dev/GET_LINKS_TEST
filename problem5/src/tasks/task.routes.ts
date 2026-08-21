import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { TaskController } from './task.controller.js';
import { TaskRepository } from './task.repository.js';
import { createTaskSchema, listTasksSchema, taskIdSchema, updateTaskSchema } from './task.schemas.js';
import { TaskService } from './task.service.js';
import type { SqliteDatabase } from '../database/database.js';

export function createTaskRouter(database: SqliteDatabase): Router {
  const router = Router();
  const controller = new TaskController(new TaskService(new TaskRepository(database)));

  router.post('/', validate('body', createTaskSchema), controller.create);
  router.get('/', validate('query', listTasksSchema), controller.list);
  router.get('/:id', validate('params', taskIdSchema), controller.get);
  router.patch(
    '/:id',
    validate('params', taskIdSchema),
    validate('body', updateTaskSchema),
    controller.update,
  );
  router.delete('/:id', validate('params', taskIdSchema), controller.delete);

  return router;
}
