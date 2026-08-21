import type { SqliteDatabase } from '../database/database.js';
import type { CreateTaskInput, Task, TaskFilters, TaskPage, UpdateTaskInput } from './task.js';

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: Task['status'];
  priority: Task['priority'];
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

const sortColumns: Record<TaskFilters['sort'], string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  title: 'title',
  dueDate: 'due_date',
};

export class TaskRepository {
  public constructor(private readonly database: SqliteDatabase) {}

  public create(id: string, input: CreateTaskInput, now: string): Task {
    this.database
      .prepare(`
        INSERT INTO tasks
          (id, title, description, status, priority, due_date, created_at, updated_at)
        VALUES
          (@id, @title, @description, @status, @priority, @dueDate, @createdAt, @updatedAt)
      `)
      .run({
        id,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'pending',
        priority: input.priority ?? 'medium',
        dueDate: input.dueDate ?? null,
        createdAt: now,
        updatedAt: now,
      });

    return this.getById(id) as Task;
  }

  public list(filters: TaskFilters): TaskPage {
    const clauses: string[] = [];
    const parameters: Record<string, string | number> = {};

    if (filters.status) {
      clauses.push('status = @status');
      parameters.status = filters.status;
    }
    if (filters.priority) {
      clauses.push('priority = @priority');
      parameters.priority = filters.priority;
    }
    if (filters.search) {
      clauses.push("(title LIKE @search ESCAPE '\\' OR description LIKE @search ESCAPE '\\')");
      parameters.search = `%${escapeLike(filters.search)}%`;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const total = (
      this.database.prepare(`SELECT COUNT(*) AS count FROM tasks ${where}`).get(parameters) as {
        count: number;
      }
    ).count;
    const rows = this.database
      .prepare(`
        SELECT * FROM tasks ${where}
        ORDER BY ${sortColumns[filters.sort]} ${filters.order.toUpperCase()}, id ASC
        LIMIT @limit OFFSET @offset
      `)
      .all({ ...parameters, limit: filters.limit, offset: filters.offset }) as TaskRow[];

    return {
      data: rows.map(toTask),
      pagination: { total, limit: filters.limit, offset: filters.offset },
    };
  }

  public getById(id: string): Task | null {
    const row = this.database.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
      | TaskRow
      | undefined;
    return row ? toTask(row) : null;
  }

  public update(id: string, input: UpdateTaskInput, now: string): Task | null {
    const columns: Record<keyof UpdateTaskInput, string> = {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      dueDate: 'due_date',
    };
    const assignments: string[] = [];
    const parameters: Record<string, string | null> = { id, updatedAt: now };

    for (const key of Object.keys(input) as (keyof UpdateTaskInput)[]) {
      assignments.push(`${columns[key]} = @${key}`);
      parameters[key] = input[key] ?? null;
    }

    const result = this.database
      .prepare(`UPDATE tasks SET ${assignments.join(', ')}, updated_at = @updatedAt WHERE id = @id`)
      .run(parameters);
    return result.changes === 0 ? null : this.getById(id);
  }

  public delete(id: string): boolean {
    return this.database.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0;
  }
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
