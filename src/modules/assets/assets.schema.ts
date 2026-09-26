import { z } from 'zod';

const assetTypeEnum = z.enum(['image', 'video', 'logo', 'document', 'font']);
const httpsUrl = z.url('Must be a valid URL.').refine((u) => u.startsWith('https://'), {
  message: 'Must be an https:// URL.',
});

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, 'Asset name is required.'),
  type: assetTypeEnum,
  url: httpsUrl,
  folderId: z.string().min(1).optional().nullable(),
});


export const updateAssetSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: assetTypeEnum.optional(),
  url: httpsUrl.optional(),
  folderId: z.string().min(1).nullable().optional(),
});

export const listAssetsQuerySchema = z.object({
  q: z.string().trim().optional(),
  sort: z.enum(['updated_desc', 'name_asc']).default('updated_desc'),
  trashed: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});


export { aiSuggestionSchema as saveAiTagsSchema } from '../ai/ai.schema';

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
