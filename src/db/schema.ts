// Drizzle schema for BrandVault.
//
// Design notes (see README.md "Data model" for the full explanation):
// - No separate `workspaces` table: the assignment allows "one workspace
//   per signed-in user", so `userId` on every table IS the workspace
//   scope. Every query in the app is filtered by it — that's what makes
//   cross-user access impossible, not a separate access-control layer.
// - `deletedAt` on `assets` implements soft delete / Trash. There is no
//   `deletedAt` on `folders`: folder deletion is blocked while it still
//   has children or live assets (see README "Tradeoffs" for why that
//   choice, not cascading soft-deletes, was made).
import { pgTable, pgEnum, text, timestamp, uniqueIndex, index, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const id = () => text('id').primaryKey().$defaultFn(() => createId());

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('users_email_key').on(t.email),
]);

export const brands = pgTable('brands', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  primaryColor: text('primary_color').notNull(),
  secondaryColor: text('secondary_color').notNull(),
  logoUrl: text('logo_url'),
  fontName: text('font_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('brands_user_id_key').on(t.userId), // enforces "one brand per user"
]);

export const assetTypeEnum = pgEnum('asset_type', ['image', 'video', 'logo', 'document', 'font']);

export const folders = pgTable('folders', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Self-relation for nesting. onDelete: 'restrict' is a DB-level backstop:
  // even if the application check were ever bypassed, Postgres itself
  // refuses to delete a folder that still has children.
  parentId: text('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('folders_user_id_idx').on(t.userId),
  index('folders_parent_id_idx').on(t.parentId),
  foreignKey({ columns: [t.parentId], foreignColumns: [t.id], name: 'folders_parent_id_fkey' }).onDelete('restrict'),
]);

export const assets = pgTable('assets', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: assetTypeEnum('type').notNull(),
  url: text('url').notNull(),
  // SetNull, not Restrict, on purpose: deleting a folder that only
  // contains already-trashed assets should still succeed.
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  tags: text('tags').array().notNull().default([]),
  description: text('description'),
  usageSuggestion: text('usage_suggestion'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('assets_user_id_idx').on(t.userId),
  index('assets_folder_id_idx').on(t.folderId),
  index('assets_user_id_deleted_at_idx').on(t.userId, t.deletedAt),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  brand: one(brands, { fields: [users.id], references: [brands.userId] }),
  folders: many(folders),
  assets: many(assets),
}));
export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id], relationName: 'folderChildren' }),
  children: many(folders, { relationName: 'folderChildren' }),
  assets: many(assets),
}));
export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, { fields: [assets.userId], references: [users.id] }),
  folder: one(folders, { fields: [assets.folderId], references: [folders.id] }),
}));

export type User = typeof users.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Asset = typeof assets.$inferSelect;
