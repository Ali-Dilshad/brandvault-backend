import { env } from '../../../config/env';
import { AiProvider, AiSuggestionInput } from './types';
import { renderPrompt } from './prompt';

const MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

export const geminiProvider: AiProvider = {
  name: 'gemini',
  async generate(input: AiSuggestionInput) {
    const prompt = renderPrompt(input);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${body}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return JSON.parse(text);
  },
};