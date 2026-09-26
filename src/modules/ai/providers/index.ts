import { env } from '../../../config/env';
import { AiProvider } from './types';
import { mockProvider } from './mock';
import { openaiProvider } from './openai';
import { anthropicProvider } from './anthropic';

export const aiProvider: AiProvider = (() => {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return openaiProvider;
    case 'anthropic':
      return anthropicProvider;
    default:
      return mockProvider;
  }
})();
