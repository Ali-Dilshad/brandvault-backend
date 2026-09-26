import { env } from '../../../config/env';
import { AiProvider, AiSuggestionInput } from './types';
import { renderPrompt } from './prompt';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export const openaiProvider: AiProvider = {
  name: 'openai',
  async generate(input: AiSuggestionInput) {
    const prompt = renderPrompt(input);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const text = data.choices[0]?.message?.content ?? '';
    return JSON.parse(text);
  },
};
