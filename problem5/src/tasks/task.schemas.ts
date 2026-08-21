import { z } from 'zod';
import { taskPriorities, taskStatuses } from './task.js';

const nullableDescription = z.string().trim().max(2_000).nullable();
const nullableDueDate = z.iso.datetime({ offset: true }).nullable();

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: nullableDescription.optional(),
    status: z.enum(taskStatuses).optional(),
    priority: z.enum(taskPriorities).optional(),
    dueDate: nullableDueDate.optional(),
  })
  .strict();

export const updateTaskSchema = createTaskSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one field must be supplied' },
);

export const taskIdSchema = z.object({ id: z.uuid() });

export const listTasksSchema = z.object({
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['createdAt', 'updatedAt', 'title', 'dueDate']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
