import { describe, it, expect, afterAll } from 'vitest';
import { request, app, uniqueEmail, cleanupUser } from './helpers';

describe('auth', () => {
  const createdUserIds: string[] = [];
  afterAll(async () => {
    for (const id of createdUserIds) await cleanupUser(id);
  });

  it('signs up with a valid email and password', async () => {
    const email = uniqueEmail('signup-ok');
    const res = await request(app).post('/auth/signup').send({ email, password: 'Passw0rd1' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.email).toBe(email);
    createdUserIds.push(res.body.user.id);
  });

  it('rejects a password with no number', async () => {
    const res = await request(app).post('/auth/signup').send({ email: uniqueEmail('weak'), password: 'nonumbers' });
    expect(res.status).toBe(400);
  });

  it('rejects signup with an already-registered email', async () => {
    const email = uniqueEmail('dup');
    const first = await request(app).post('/auth/signup').send({ email, password: 'Passw0rd1' });
    createdUserIds.push(first.body.user.id);

    const second = await request(app).post('/auth/signup').send({ email, password: 'Passw0rd1' });
    expect(second.status).toBe(409);
  });

  it('signs in with correct credentials', async () => {
    const email = uniqueEmail('signin-ok');
    const signup = await request(app).post('/auth/signup').send({ email, password: 'Passw0rd1' });
    createdUserIds.push(signup.body.user.id);

    const signin = await request(app).post('/auth/signin').send({ email, password: 'Passw0rd1' });
    expect(signin.status).toBe(200);
    expect(signin.body.token).toBeTypeOf('string');
  });

  it('rejects signin with the wrong password, same message as unknown email', async () => {
    const email = uniqueEmail('signin-bad');
    const signup = await request(app).post('/auth/signup').send({ email, password: 'Passw0rd1' });
    createdUserIds.push(signup.body.user.id);

    const wrongPassword = await request(app).post('/auth/signin').send({ email, password: 'WrongOne1' });
    const unknownEmail = await request(app).post('/auth/signin').send({ email: uniqueEmail('nope'), password: 'WrongOne1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  it('rejects a request with no token and one with a garbage token', async () => {
    const none = await request(app).get('/assets');
    const garbage = await request(app).get('/assets').set('Authorization', 'Bearer not-a-real-token');
    expect(none.status).toBe(401);
    expect(garbage.status).toBe(401);
  });
});
