import fs from 'node:fs';
import path from 'node:path';
import { AiSuggestionInput } from './types';

const TEMPLATE_PATH = path.join(__dirname, '../../../../prompts/asset-tagging.md');
const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');


export function renderPrompt(input: AiSuggestionInput): string {
  return template
    .replaceAll('{{assetName}}', input.assetName)
    .replaceAll('{{assetType}}', input.assetType)
    .replaceAll('{{assetUrl}}', input.assetUrl)
    .replaceAll('{{folderName}}', input.folderName ?? '(none)')
    .replaceAll('{{brandName}}', input.brand?.name ?? '(no brand kit set)')
    .replaceAll('{{brandPrimaryColor}}', input.brand?.primaryColor ?? '(none)')
    .replaceAll('{{brandSecondaryColor}}', input.brand?.secondaryColor ?? '(none)');
}
