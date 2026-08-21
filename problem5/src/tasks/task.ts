export const taskStatuses = ['pending', 'in_progress', 'completed'] as const;
export const taskPriorities = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  limit: number;
  offset: number;
  sort: 'createdAt' | 'updatedAt' | 'title' | 'dueDate';
  order: 'asc' | 'desc';
}

export interface TaskPage {
  data: Task[];
  pagination: { total: number; limit: number; offset: number };
}
