import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../src/app';
import { db } from '../src/db/client';
import { users } from '../src/db/schema';

// Every test file gets its own throwaway user with a unique email, so
// tests never collide with each other or with the seeded demo account —
// and never need a separate test database to stay isolated.
let counter = 0;
export function uniqueEmail(label: string) {
  counter++;
  return `test-${label}-${Date.now()}-${counter}@example.com`.toLowerCase();
}

export async function signupUser(label: string, password = 'Passw0rd1') {
  const email = uniqueEmail(label);
  const res = await request(app).post('/auth/signup').send({ email, password });
  if (res.status !== 201) throw new Error(`Test setup signup failed: ${JSON.stringify(res.body)}`);
  return { token: res.body.token as string, userId: res.body.user.id as string, email };
}

// Deleting the user cascades to brand/folders/assets (onDelete: cascade
// in the schema) — one call cleans up everything a test created.
export async function cleanupUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

export { app, request };
