import { env } from '../../../config/env';
import { AiProvider, AiSuggestionInput } from './types';
import { renderPrompt } from './prompt';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

export const anthropicProvider: AiProvider = {
  name: 'anthropic',
  async generate(input: AiSuggestionInput) {
    const prompt = renderPrompt(input);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
    const text = data.content.find((b) => b.type === 'text')?.text ?? '';
    return parseJsonLoosely(text);
  },
};

function parseJsonLoosely(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

export { parseJsonLoosely };
