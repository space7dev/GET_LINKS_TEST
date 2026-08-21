export const migrations = [
  {
    version: 1,
    name: 'create_tasks',
    sql: `
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'in_progress', 'completed')),
        priority TEXT NOT NULL DEFAULT 'medium'
          CHECK (priority IN ('low', 'medium', 'high')),
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_tasks_status ON tasks(status);
      CREATE INDEX idx_tasks_priority ON tasks(priority);
      CREATE INDEX idx_tasks_created_at ON tasks(created_at);
    `,
  },
] as const;
