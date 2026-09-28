import { env } from '../../../config/env';
import { AiProvider, AiSuggestionInput } from './types';
import { renderPrompt } from './prompt';

export const groqProvider: AiProvider = {
  name: 'groq',
  async generate(input: AiSuggestionInput) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        messages: [{ role: 'user', content: renderPrompt(input) }],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`Groq API error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? '';
    return extractJson(text);
  },
};

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error(`Groq returned no JSON object: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}