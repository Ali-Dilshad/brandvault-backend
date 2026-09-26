import { AiProvider, AiSuggestionInput } from './types';

export const mockProvider: AiProvider = {
  name: 'mock',
  async generate(input: AiSuggestionInput) {
    const base = input.assetType.toLowerCase();
    const tags = [base];
    if (input.folderName) tags.push(slug(input.folderName));
    if (input.brand?.name) tags.push(slug(input.brand.name));
    tags.push('brandvault');

    return {
      tags: [...new Set(tags)].slice(0, 6),
      description: `A ${base} asset named "${input.assetName}"${input.folderName ? ` in the ${input.folderName} folder` : ''}.`,
      usage_suggestion: input.brand?.name
        ? `Use this ${base} to represent ${input.brand.name} in relevant campaigns.`
        : `Use this ${base} wherever a ${base} asset is needed.`,
    };
  },
};

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
