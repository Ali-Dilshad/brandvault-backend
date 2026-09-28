import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET should be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required (comma-separate multiple origins)'),
  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic', 'gemini', 'groq']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
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

if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
  console.error('AI_PROVIDER=openai requires OPENAI_API_KEY to be set.');
  process.exit(1);
}
if (env.AI_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
  console.error('AI_PROVIDER=anthropic requires ANTHROPIC_API_KEY to be set.');
  process.exit(1);
}
if (env.AI_PROVIDER === 'gemini' && !env.GEMINI_API_KEY) {
  console.error('AI_PROVIDER=gemini requires GEMINI_API_KEY to be set.');
  process.exit(1);
}
if (env.AI_PROVIDER === 'groq' && !env.GROQ_API_KEY) {
  console.error('AI_PROVIDER=groq requires GROQ_API_KEY to be set.');
  process.exit(1);
}