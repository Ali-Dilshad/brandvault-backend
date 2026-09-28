import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color like #5B4FE8.');
const httpsUrl = z.url('Must be a valid URL.').refine((u) => u.startsWith('https://'), {
  message: 'Must be an https:// URL.',
});

export const createBrandSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required.'),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  logoUrl: httpsUrl.optional().nullable(),
  fontName: z.string().trim().min(1).optional().nullable(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
