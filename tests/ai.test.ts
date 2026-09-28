import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, signupUser, cleanupUser } from './helpers';

// Runs against AI_PROVIDER=mock (the test/dev default) — deterministic,
// no network call, no API key required.
describe('AI tagging', () => {
  let token: string;
  let userId: string;
  let auth: Record<string, string>;
  let assetId: string;

  beforeAll(async () => {
    ({ token, userId } = await signupUser('ai'));
    auth = { Authorization: `Bearer ${token}` };
    const asset = await request(app)
      .post('/assets')
      .set(auth)
      .send({ name: 'banner.png', type: 'image', url: 'https://example.com/banner.png' });
    assetId = asset.body.id;
  });
  afterAll(() => cleanupUser(userId));

  it('generates a structured suggestion without saving it', async () => {
    const res = await request(app).post(`/assets/${assetId}/ai-tags`).set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(res.body.tags.length).toBeGreaterThan(0);
    expect(res.body.description).toBeTypeOf('string');
    expect(res.body.usage_suggestion).toBeTypeOf('string');

    const unchanged = await request(app).get('/assets').set(auth);
    expect(unchanged.body.find((a: any) => a.id === assetId).tags).toEqual([]);
  });

  it('rejects a save request missing a required field', async () => {
    const res = await request(app).patch(`/assets/${assetId}/ai-tags/save`).set(auth).send({ tags: ['x'], description: 'y' });
    expect(res.status).toBe(400);
  });

  it('rejects a save request where tags is not an array', async () => {
    const res = await request(app)
      .patch(`/assets/${assetId}/ai-tags/save`)
      .set(auth)
      .send({ tags: 'not-an-array', description: 'y', usage_suggestion: 'z' });
    expect(res.status).toBe(400);
  });

  it('saves a well-formed suggestion to the asset', async () => {
    const res = await request(app)
      .patch(`/assets/${assetId}/ai-tags/save`)
      .set(auth)
      .send({ tags: ['banner', 'hero'], description: 'A hero banner.', usage_suggestion: 'Use on the homepage.' });
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(['banner', 'hero']);
    expect(res.body.usageSuggestion).toBe('Use on the homepage.');
  });
});
