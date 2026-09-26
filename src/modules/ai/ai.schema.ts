import { z } from 'zod';

export const aiSuggestionSchema = z.object({
  tags: z
    .array(z.string().trim().min(1).max(30))
    .min(1, 'Expected at least one tag.')
    .max(10, 'Expected no more than 10 tags.'),
  description: z.string().trim().min(1).max(500),
  usage_suggestion: z.string().trim().min(1).max(500),
});

export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
