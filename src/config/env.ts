// Loads and validates every environment variable the app needs, once, at
// startup. If something required is missing or malformed, the app fails
// immediately with a clear message instead of crashing later mid-request.
import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET should be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required (comma-separate multiple origins)'),
  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  N8N_WEBHOOK_URL: z.string().optional(),
  DEMO_EMAIL: z.string().default('demo@brandvault.dev'),
  DEMO_PASSWORD: z.string().default('Demo1234!'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

// A provider is only usable if its key is actually set — catch this at
// boot, not on the first real AI request from a user.
if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
  console.error('AI_PROVIDER=openai requires OPENAI_API_KEY to be set.');
  process.exit(1);
}
if (env.AI_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
  console.error('AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set.');
  process.exit(1);
}
