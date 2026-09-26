import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required.'),
  parentId: z.string().min(1).optional().nullable(),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1).optional(),
  // Explicit null clears the parent (moves the folder to the top level) —
  // same "present vs. null vs. absent" convention as the asset move route.
  parentId: z.string().min(1).nullable().optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
