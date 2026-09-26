// Seeds the demo account the assignment asks for: demo@brandvault.dev /
// Demo1234!, plus a brand kit, a couple of nested folders, and a few
// sample assets — enough that a first-time reviewer sees a populated
// library immediately, not an empty one. Safe to re-run: it skips
// creating the user (and everything under it) if the demo account
// already exists, rather than erroring or duplicating data.
import dotenv from 'dotenv';
dotenv.config();
import { eq } from 'drizzle-orm';
import { db, pool } from './client';
import { assets, brands, folders, users } from './schema';
import { hashPassword } from '../lib/password';
import { env } from '../config/env';

async function main() {
  const existing = await db.query.users.findFirst({ where: eq(users.email, env.DEMO_EMAIL) });
  if (existing) {
    console.log(`Demo account ${env.DEMO_EMAIL} already exists — nothing to do.`);
    return;
  }

  const passwordHash = await hashPassword(env.DEMO_PASSWORD);
  const [user] = await db.insert(users).values({ email: env.DEMO_EMAIL, passwordHash }).returning();

  await db.insert(brands).values({
    userId: user.id,
    name: 'Nordwind Coffee',
    primaryColor: '#5B4FE8',
    secondaryColor: '#1C1F22',
    fontName: 'Söhne',
  });

  const [campaigns] = await db.insert(folders).values({ userId: user.id, name: 'Campaigns' }).returning();
  const [q4Launch] = await db.insert(folders).values({ userId: user.id, name: 'Q4 Launch', parentId: campaigns.id }).returning();
  const [logos] = await db.insert(folders).values({ userId: user.id, name: 'Logos' }).returning();

  await db.insert(assets).values([
    {
      userId: user.id,
      name: 'hero-banner-q4.png',
      type: 'image',
      url: 'https://example.com/hero-banner-q4.png',
      folderId: q4Launch.id,
    },
    {
      userId: user.id,
      name: 'brand-intro-reel.mp4',
      type: 'video',
      url: 'https://example.com/brand-intro-reel.mp4',
    },
    {
      userId: user.id,
      name: 'primary-logo-mark.svg',
      type: 'logo',
      url: 'https://example.com/primary-logo-mark.svg',
      folderId: logos.id,
      tags: ['campaign', 'hero', 'social'],
      description: 'Primary logo mark for use across campaign creative.',
      usageSuggestion: 'Best used as a homepage hero or top-of-feed social post.',
    },
  ]);

  console.log(`Seeded demo account: ${env.DEMO_EMAIL} / ${env.DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
