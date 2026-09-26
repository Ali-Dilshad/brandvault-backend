import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signToken } from '../../lib/jwt';
import { Conflict, Unauthorized } from '../../lib/errors';
import { Credentials } from './auth.schema';

const toPublicUser = (u: { id: string; email: string }) => ({ id: u.id, email: u.email });

export async function signUp({ email, password }: Credentials) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw Conflict('An account with that email already exists.');

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: toPublicUser(user) };
}

export async function signIn({ email, password }: Credentials) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Same message whether the email doesn't exist or the password is
  // wrong — confirming which one it was would let an attacker enumerate
  // registered emails.
  if (!user) throw Unauthorized('Incorrect email or password.');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw Unauthorized('Incorrect email or password.');

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: toPublicUser(user) };
}
