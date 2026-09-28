import { env } from '../../../config/env';
import { AiProvider } from './types';
import { mockProvider } from './mock';
import { openaiProvider } from './openai';
import { anthropicProvider } from './anthropic';
import { geminiProvider } from './gemini';
import { groqProvider } from './groq';

export const aiProvider: AiProvider = (() => {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return openaiProvider;
    case 'anthropic':
      return anthropicProvider;
    case 'gemini':
      return geminiProvider;
    case 'groq':
      return groqProvider;
    default:
      return mockProvider;
  }
})();