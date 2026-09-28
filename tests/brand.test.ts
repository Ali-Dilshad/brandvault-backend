import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, signupUser, cleanupUser } from './helpers';

describe('brand', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    ({ token, userId } = await signupUser('brand'));
  });
  afterAll(() => cleanupUser(userId));

  it('has no brand kit yet for a brand-new user', async () => {
    const res = await request(app).get('/brand').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('creates a brand kit', async () => {
    const res = await request(app)
      .post('/brand')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme', primaryColor: '#5B4FE8', secondaryColor: '#1C1F22' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Acme');
  });

  it('rejects a second create for the same user', async () => {
    const res = await request(app)
      .post('/brand')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme 2', primaryColor: '#5B4FE8', secondaryColor: '#1C1F22' });
    expect(res.status).toBe(409);
  });

  it('rejects an invalid hex color', async () => {
    const res = await request(app)
      .patch('/brand')
      .set('Authorization', `Bearer ${token}`)
      .send({ primaryColor: 'not-a-color' });
    expect(res.status).toBe(400);
  });

  it('updates the brand kit', async () => {
    const res = await request(app).patch('/brand').set('Authorization', `Bearer ${token}`).send({ name: 'Acme Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Acme Renamed');
    expect(res.body.primaryColor).toBe('#5B4FE8'); // untouched fields survive a partial PATCH
  });
});
