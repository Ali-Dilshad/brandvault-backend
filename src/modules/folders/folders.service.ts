import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { assets, folders } from '../../db/schema';
import { BadRequest, Conflict, NotFound } from '../../lib/errors';
import { CreateFolderInput, UpdateFolderInput } from './folders.schema';

// The frontend's own maxFolderDepth constant (dashboard_page.dart) — kept
// in sync deliberately rather than trusting the client to enforce it.
export const MAX_FOLDER_DEPTH = 3;

async function getOwnedFolder(userId: string, folderId: string) {
  const folder = await db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
  });
  // A folder that exists but belongs to someone else looks identical to
  // one that doesn't exist at all — see README "Authorization rules".
  if (!folder) throw NotFound('Folder not found.');
  return folder;
}

// 1 for a top-level folder, 2 for its child, and so on. Depth is capped
// at MAX_FOLDER_DEPTH, so this loop runs at most a few times — no need
// for a recursive SQL query.
async function depthOf(userId: string, folderId: string): Promise<number> {
  let depth = 1;
  let current = await getOwnedFolder(userId, folderId);
  while (current.parentId) {
    depth++;
    current = await getOwnedFolder(userId, current.parentId);
  }
  return depth;
}

// True if `candidateParentId` is `folderId` itself, or a descendant of
// it — either would make the tree circular if allowed.
async function wouldCreateCycle(userId: string, folderId: string, candidateParentId: string): Promise<boolean> {
  if (candidateParentId === folderId) return true;
  let current = await getOwnedFolder(userId, candidateParentId);
  while (current.parentId) {
    if (current.parentId === folderId) return true;
    current = await getOwnedFolder(userId, current.parentId);
  }
  return false;
}

export async function listFolders(userId: string) {
  return db.query.folders.findMany({ where: eq(folders.userId, userId), orderBy: (f, { asc }) => asc(f.name) });
}

export async function createFolder(userId: string, input: CreateFolderInput) {
  let depth = 1;
  if (input.parentId) {
    const parentDepth = await depthOf(userId, input.parentId); // throws 404 if not owned
    depth = parentDepth + 1;
  }
  if (depth > MAX_FOLDER_DEPTH) {
    throw BadRequest(`Folders can only be nested ${MAX_FOLDER_DEPTH} levels deep.`);
  }

  const [folder] = await db.insert(folders).values({ userId, name: input.name, parentId: input.parentId ?? null }).returning();
  return folder;
}

export async function updateFolder(userId: string, folderId: string, input: UpdateFolderInput) {
  await getOwnedFolder(userId, folderId); // 404 if missing or not theirs

  if (input.parentId) {
    if (await wouldCreateCycle(userId, folderId, input.parentId)) {
      throw BadRequest('A folder cannot be moved inside itself or one of its own subfolders.');
    }
    const parentDepth = await depthOf(userId, input.parentId);
    if (parentDepth + 1 > MAX_FOLDER_DEPTH) {
      throw BadRequest(`Folders can only be nested ${MAX_FOLDER_DEPTH} levels deep.`);
    }
  }

  const [folder] = await db
    .update(folders)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning();
  return folder;
}

// "Block deletion if the folder is not empty" — the choice documented in
// README.md "Tradeoffs". A folder counts as empty when it has no child
// folders and no *live* (non-trashed) assets; already-trashed assets
// don't block cleanup elsewhere in the tree.
export async function deleteFolder(userId: string, folderId: string) {
  await getOwnedFolder(userId, folderId);

  const childFolder = await db.query.folders.findFirst({ where: and(eq(folders.parentId, folderId), eq(folders.userId, userId)) });
  if (childFolder) throw Conflict('This folder still has subfolders — move or delete them first.');

  const liveAsset = await db.query.assets.findFirst({
    where: and(eq(assets.folderId, folderId), eq(assets.userId, userId), isNull(assets.deletedAt)),
  });
  if (liveAsset) throw Conflict('This folder still has assets in it — move or trash them first.');

  await db.delete(folders).where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
}
