import { and, asc, desc, eq, ilike, isNotNull, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { assets, brands, folders } from '../../db/schema';
import { BadRequest, NotFound } from '../../lib/errors';
import { sendWebhook } from '../../lib/webhook';
import { generateSuggestion } from '../ai/ai.service';
import { AiSuggestion } from '../ai/ai.schema';
import { CreateAssetInput, ListAssetsQuery, UpdateAssetInput } from './assets.schema';

async function assertFolderOwned(userId: string, folderId: string) {
  const folder = await db.query.folders.findFirst({ where: and(eq(folders.id, folderId), eq(folders.userId, userId)) });
  if (!folder) throw NotFound('Folder not found.');
  return folder;
}


async function getOwnedAsset(userId: string, assetId: string) {
  const asset = await db.query.assets.findFirst({ where: and(eq(assets.id, assetId), eq(assets.userId, userId)) });
  if (!asset) throw NotFound('Asset not found.');
  return asset;
}

async function getOwnedLiveAsset(userId: string, assetId: string) {
  const asset = await getOwnedAsset(userId, assetId);
  if (asset.deletedAt) throw NotFound('Asset not found.'); // trashed items aren't editable via this route
  return asset;
}

export async function listAssets(userId: string, query: ListAssetsQuery) {
  const conditions = [eq(assets.userId, userId), query.trashed ? isNotNull(assets.deletedAt) : isNull(assets.deletedAt)];
  if (query.q) conditions.push(ilike(assets.name, `%${query.q}%`));

  return db.query.assets.findMany({
    where: and(...conditions),
    orderBy: query.sort === 'name_asc' ? [asc(assets.name)] : [desc(assets.updatedAt)],
  });
}

export async function createAsset(userId: string, input: CreateAssetInput) {
  if (input.folderId) await assertFolderOwned(userId, input.folderId);

  const [asset] = await db.insert(assets).values({ userId, ...input }).returning();
  return asset;
}

export async function updateAsset(userId: string, assetId: string, input: UpdateAssetInput) {
  await getOwnedLiveAsset(userId, assetId);
  if (input.folderId) await assertFolderOwned(userId, input.folderId);

  const [asset] = await db
    .update(assets)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .returning();
  return asset;
}

export async function trashAsset(userId: string, assetId: string) {
  const asset = await getOwnedAsset(userId, assetId);
  if (asset.deletedAt) throw BadRequest('Asset is already in Trash.');

  const [updated] = await db
    .update(assets)
    .set({ deletedAt: new Date() })
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .returning();
  return updated;
}

export async function restoreAsset(userId: string, assetId: string, userEmail: string) {
  const asset = await getOwnedAsset(userId, assetId);
  if (!asset.deletedAt) throw BadRequest('Asset is not in Trash.');

  const [updated] = await db
    .update(assets)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .returning();

  await sendWebhook('asset_restored', { assetId, userEmail });
  return updated;
}

export async function deleteAssetForever(userId: string, assetId: string) {
  await getOwnedAsset(userId, assetId);
  await db.delete(assets).where(and(eq(assets.id, assetId), eq(assets.userId, userId)));
}

export async function generateAiTags(userId: string, assetId: string) {
  const asset = await getOwnedLiveAsset(userId, assetId);

  const [folder, brand] = await Promise.all([
    asset.folderId ? db.query.folders.findFirst({ where: eq(folders.id, asset.folderId) }) : null,
    db.query.brands.findFirst({ where: eq(brands.userId, userId) }),
  ]);

  return generateSuggestion({
    assetName: asset.name,
    assetType: asset.type,
    assetUrl: asset.url,
    folderName: folder?.name ?? null,
    brand: brand ? { name: brand.name, primaryColor: brand.primaryColor, secondaryColor: brand.secondaryColor } : null,
  });
}

export async function saveAiTags(userId: string, assetId: string, suggestion: AiSuggestion, userEmail: string) {
  await getOwnedLiveAsset(userId, assetId);

  const [asset] = await db
    .update(assets)
    .set({
      tags: suggestion.tags,
      description: suggestion.description,
      usageSuggestion: suggestion.usage_suggestion,
      updatedAt: new Date(),
    })
    .where(and(eq(assets.id, assetId), eq(assets.userId, userId)))
    .returning();

  await sendWebhook('ai_tags_saved', { assetId, userEmail });
  return asset;
}
