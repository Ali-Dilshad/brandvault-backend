import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, signupUser, cleanupUser } from './helpers';

// Directly targets the assignment's auto-fail condition: "One user can
// access another user's private data." Every check here creates real
// data as user A, then attempts to read or modify it as user B — and
// asserts B gets a 404, and that A's data is provably untouched.
describe('cross-user authorization', () => {
  let ownerToken: string, ownerId: string, ownerAuth: Record<string, string>;
  let attackerToken: string, attackerId: string, attackerAuth: Record<string, string>;
  let assetId: string, folderId: string;

  beforeAll(async () => {
    const owner = await signupUser('owner');
    ownerToken = owner.token;
    ownerId = owner.userId;
    ownerAuth = { Authorization: `Bearer ${ownerToken}` };

    const attacker = await signupUser('attacker');
    attackerToken = attacker.token;
    attackerId = attacker.userId;
    attackerAuth = { Authorization: `Bearer ${attackerToken}` };

    await request(app).post('/brand').set(ownerAuth).send({ name: 'Owner Brand', primaryColor: '#5B4FE8', secondaryColor: '#1C1F22' });
    const folder = await request(app).post('/folders').set(ownerAuth).send({ name: "Owner's Folder" });
    folderId = folder.body.id;
    const asset = await request(app)
      .post('/assets')
      .set(ownerAuth)
      .send({ name: "owner-secret.png", type: 'image', url: 'https://example.com/secret.png', folderId });
    assetId = asset.body.id;
  });

  afterAll(async () => {
    await cleanupUser(ownerId);
    await cleanupUser(attackerId);
  });

  it("the attacker's own asset list is empty, not the owner's", async () => {
    const res = await request(app).get('/assets').set(attackerAuth);
    expect(res.body).toEqual([]);
  });

  it('cannot read the owner\'s brand kit', async () => {
    const res = await request(app).get('/brand').set(attackerAuth);
    expect(res.status).toBe(404);
  });

  it("cannot read, rename, trash, restore, or permanently delete the owner's asset by ID", async () => {
    const get = await request(app).get(`/assets?q=owner-secret`).set(attackerAuth);
    expect(get.body).toEqual([]);

    const rename = await request(app).patch(`/assets/${assetId}`).set(attackerAuth).send({ name: 'hacked.png' });
    expect(rename.status).toBe(404);

    const trash = await request(app).post(`/assets/${assetId}/trash`).set(attackerAuth);
    expect(trash.status).toBe(404);

    const restore = await request(app).post(`/assets/${assetId}/restore`).set(attackerAuth);
    expect(restore.status).toBe(404);

    const destroy = await request(app).delete(`/assets/${assetId}`).set(attackerAuth);
    expect(destroy.status).toBe(404);
  });

  it("cannot generate or save AI tags on the owner's asset", async () => {
    const generate = await request(app).post(`/assets/${assetId}/ai-tags`).set(attackerAuth);
    expect(generate.status).toBe(404);

    const save = await request(app)
      .patch(`/assets/${assetId}/ai-tags/save`)
      .set(attackerAuth)
      .send({ tags: ['x'], description: 'y', usage_suggestion: 'z' });
    expect(save.status).toBe(404);
  });

  it("cannot rename or delete the owner's folder, or create a folder nested under it", async () => {
    const rename = await request(app).patch(`/folders/${folderId}`).set(attackerAuth).send({ name: 'hacked' });
    expect(rename.status).toBe(404);

    const del = await request(app).delete(`/folders/${folderId}`).set(attackerAuth);
    expect(del.status).toBe(404);

    const nestUnder = await request(app).post('/folders').set(attackerAuth).send({ name: 'sneaky', parentId: folderId });
    expect(nestUnder.status).toBe(404);
  });

  it("cannot create an asset that references the owner's folder", async () => {
    const res = await request(app)
      .post('/assets')
      .set(attackerAuth)
      .send({ name: 'sneaky.png', type: 'image', url: 'https://example.com/s.png', folderId });
    expect(res.status).toBe(404);
  });

  it("the owner's data is provably untouched after every attempt above", async () => {
    const assets = await request(app).get('/assets').set(ownerAuth);
    const asset = assets.body.find((a: any) => a.id === assetId);
    expect(asset.name).toBe('owner-secret.png');
    expect(asset.deletedAt).toBeNull();

    const folders = await request(app).get('/folders').set(ownerAuth);
    expect(folders.body.find((f: any) => f.id === folderId).name).toBe("Owner's Folder");

    const brand = await request(app).get('/brand').set(ownerAuth);
    expect(brand.body.name).toBe('Owner Brand');
  });
});
