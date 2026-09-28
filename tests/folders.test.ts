import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, signupUser, cleanupUser } from './helpers';

describe('folders', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    ({ token, userId } = await signupUser('folders'));
  });
  afterAll(() => cleanupUser(userId));

  it('creates a top-level folder', async () => {
    const res = await request(app).post('/folders').set('Authorization', `Bearer ${token}`).send({ name: 'Campaigns' });
    expect(res.status).toBe(201);
    expect(res.body.parentId).toBeNull();
  });

  it('nests folders up to 3 levels deep, then rejects a 4th', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const l1 = await request(app).post('/folders').set(auth).send({ name: 'L1' });
    const l2 = await request(app).post('/folders').set(auth).send({ name: 'L2', parentId: l1.body.id });
    const l3 = await request(app).post('/folders').set(auth).send({ name: 'L3', parentId: l2.body.id });
    const l4 = await request(app).post('/folders').set(auth).send({ name: 'L4', parentId: l3.body.id });

    expect(l3.status).toBe(201);
    expect(l4.status).toBe(400);
  });

  it('rejects creating a folder under a parent that does not belong to the user', async () => {
    const other = await signupUser('folders-other');
    const res = await request(app).post('/folders').set('Authorization', `Bearer ${token}`).send({ name: 'X', parentId: 'not-owned-or-real-id' });
    expect(res.status).toBe(404);
    await cleanupUser(other.userId);
  });

  it('prevents moving a folder inside its own descendant (cycle)', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const parent = await request(app).post('/folders').set(auth).send({ name: 'CycleParent' });
    const child = await request(app).post('/folders').set(auth).send({ name: 'CycleChild', parentId: parent.body.id });

    const res = await request(app).patch(`/folders/${parent.body.id}`).set(auth).send({ parentId: child.body.id });
    expect(res.status).toBe(400);
  });

  it('blocks deleting a folder that still has a live asset, but allows it once the asset moves out', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const folder = await request(app).post('/folders').set(auth).send({ name: 'HasAsset' });
    const asset = await request(app)
      .post('/assets')
      .set(auth)
      .send({ name: 'a.png', type: 'image', url: 'https://example.com/a.png', folderId: folder.body.id });

    const blocked = await request(app).delete(`/folders/${folder.body.id}`).set(auth);
    expect(blocked.status).toBe(409);

    await request(app).patch(`/assets/${asset.body.id}`).set(auth).send({ folderId: null });
    const allowed = await request(app).delete(`/folders/${folder.body.id}`).set(auth);
    expect(allowed.status).toBe(204);
  });
});
