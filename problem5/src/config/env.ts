import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_PATH: z.string().min(1).default('./data/app.db'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(environment);
}
