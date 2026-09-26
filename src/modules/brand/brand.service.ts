import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { brands } from '../../db/schema';
import { Conflict, NotFound } from '../../lib/errors';
import { sendWebhook } from '../../lib/webhook';
import { CreateBrandInput, UpdateBrandInput } from './brand.schema';

export async function getBrand(userId: string) {
  const brand = await db.query.brands.findFirst({ where: eq(brands.userId, userId) });
  if (!brand) throw NotFound('No brand kit yet.');
  return brand;
}

export async function createBrand(userId: string, input: CreateBrandInput) {
  const existing = await db.query.brands.findFirst({ where: eq(brands.userId, userId) });
  if (existing) throw Conflict('A brand kit already exists — use PATCH to update it.');

  const [brand] = await db.insert(brands).values({ userId, ...input }).returning();
  return brand;
}

export async function updateBrand(userId: string, input: UpdateBrandInput, userEmail: string) {
  const existing = await db.query.brands.findFirst({ where: eq(brands.userId, userId) });
  if (!existing) throw NotFound('No brand kit yet — create one first.');

  const [brand] = await db
    .update(brands)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(brands.userId, userId))
    .returning();

  await sendWebhook('brand_updated', { brandId: brand.id, userEmail });
  return brand;
}
