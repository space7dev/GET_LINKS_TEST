import type { Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';
import { createDatabase, type SqliteDatabase } from '../src/database/database.js';

const testConfig: AppConfig = {
  NODE_ENV: 'test',
  PORT: 3000,
  DATABASE_PATH: ':memory:',
  LOG_LEVEL: 'silent',
};

describe('Tasks API', () => {
  let app: Express;
  let database: SqliteDatabase;

  beforeEach(() => {
    database = createDatabase(':memory:');
    app = createApp({ config: testConfig, database });
  });

  afterEach(() => database.close());

  it('supports the complete CRUD lifecycle', async () => {
    const created = await request(app).post('/api/v1/tasks').send({
      title: 'Ship the API',
      description: 'Finish integration tests',
      priority: 'high',
    });

    expect(created.status).toBe(201);
    expect(created.headers.location).toMatch(/^\/api\/v1\/tasks\//);
    expect(created.body.data).toMatchObject({
      title: 'Ship the API',
      status: 'pending',
      priority: 'high',
    });
    const id = created.body.data.id as string;

    const fetched = await request(app).get(`/api/v1/tasks/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);

    const updated = await request(app)
      .patch(`/api/v1/tasks/${id}`)
      .send({ status: 'completed', description: null });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ status: 'completed', description: null });

    const deleted = await request(app).delete(`/api/v1/tasks/${id}`);
    expect(deleted.status).toBe(204);
    expect((await request(app).get(`/api/v1/tasks/${id}`)).status).toBe(404);
  });

  it('filters, searches, sorts, and paginates resources', async () => {
    await request(app).post('/api/v1/tasks').send({ title: 'Low priority note', priority: 'low' });
    await request(app).post('/api/v1/tasks').send({ title: 'Urgent release', priority: 'high' });

    const response = await request(app).get(
      '/api/v1/tasks?priority=high&search=release&sort=title&order=asc&limit=1&offset=0',
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('Urgent release');
    expect(response.body.pagination).toEqual({ total: 1, limit: 1, offset: 0 });
  });

  it('returns consistent validation and not-found errors', async () => {
    const invalid = await request(app).post('/api/v1/tasks').send({ title: '' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const malformedId = await request(app).get('/api/v1/tasks/not-a-uuid');
    expect(malformedId.status).toBe(400);

    const missing = await request(app).get('/api/v1/tasks/00000000-0000-4000-8000-000000000000');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('rejects malformed JSON as a client error', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('MALFORMED_JSON');
  });
});
