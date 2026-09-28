import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, signupUser, cleanupUser } from './helpers';

describe('assets', () => {
  let token: string;
  let userId: string;
  let auth: Record<string, string>;

  beforeAll(async () => {
    ({ token, userId } = await signupUser('assets'));
    auth = { Authorization: `Bearer ${token}` };
  });
  afterAll(() => cleanupUser(userId));

  it('rejects a non-https URL', async () => {
    const res = await request(app).post('/assets').set(auth).send({ name: 'x.png', type: 'image', url: 'http://insecure.com/x.png' });
    expect(res.status).toBe(400);
  });

  it('creates, lists, searches, and sorts assets', async () => {
    await request(app).post('/assets').set(auth).send({ name: 'zebra.png', type: 'image', url: 'https://example.com/zebra.png' });
    await request(app).post('/assets').set(auth).send({ name: 'apple.png', type: 'image', url: 'https://example.com/apple.png' });

    const all = await request(app).get('/assets').set(auth);
    expect(all.body.length).toBe(2);

    const searched = await request(app).get('/assets?q=zeb').set(auth);
    expect(searched.body.map((a: any) => a.name)).toEqual(['zebra.png']);

    const sorted = await request(app).get('/assets?sort=name_asc').set(auth);
    expect(sorted.body.map((a: any) => a.name)).toEqual(['apple.png', 'zebra.png']);
  });

  it('moves an asset into a folder and back out to the root', async () => {
    const folder = await request(app).post('/folders').set(auth).send({ name: 'MoveTarget' });
    const asset = await request(app).post('/assets').set(auth).send({ name: 'movable.png', type: 'image', url: 'https://example.com/m.png' });

    const moved = await request(app).patch(`/assets/${asset.body.id}`).set(auth).send({ folderId: folder.body.id });
    expect(moved.body.folderId).toBe(folder.body.id);

    const movedOut = await request(app).patch(`/assets/${asset.body.id}`).set(auth).send({ folderId: null });
    expect(movedOut.body.folderId).toBeNull();
  });

  it('soft-deletes on trash, excludes it from the default list, and restores it', async () => {
    const asset = await request(app).post('/assets').set(auth).send({ name: 'trashme.png', type: 'image', url: 'https://example.com/t.png' });

    await request(app).post(`/assets/${asset.body.id}/trash`).set(auth);
    const live = await request(app).get('/assets').set(auth);
    expect(live.body.find((a: any) => a.id === asset.body.id)).toBeUndefined();

    const trashed = await request(app).get('/assets?trashed=true').set(auth);
    expect(trashed.body.find((a: any) => a.id === asset.body.id)).toBeDefined();

    const restored = await request(app).post(`/assets/${asset.body.id}/restore`).set(auth);
    expect(restored.body.deletedAt).toBeNull();
  });

  it('permanently deletes an asset', async () => {
    const asset = await request(app).post('/assets').set(auth).send({ name: 'gone.png', type: 'image', url: 'https://example.com/g.png' });
    const del = await request(app).delete(`/assets/${asset.body.id}`).set(auth);
    expect(del.status).toBe(204);

    const trashed = await request(app).get('/assets?trashed=true').set(auth);
    expect(trashed.body.find((a: any) => a.id === asset.body.id)).toBeUndefined();
  });
});
