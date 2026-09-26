import { AppError } from '../../lib/errors';
import { aiSuggestionSchema, AiSuggestion } from './ai.schema';
import { aiProvider } from './providers';
import { AiSuggestionInput } from './providers/types';


export async function generateSuggestion(input: AiSuggestionInput): Promise<AiSuggestion> {
  let raw: unknown;
  try {
    raw = await aiProvider.generate(input);
  } catch (err) {
    throw new AppError(502, 'The AI provider did not respond. Please try again.');
  }

  const result = aiSuggestionSchema.safeParse(raw);
  if (!result.success) {
    throw new AppError(502, 'The AI provider returned an unexpected response. Please try again.');
  }
  return result.data;
}
