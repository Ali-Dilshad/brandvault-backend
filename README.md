# BrandVault API

REST API for BrandVault, a brand kit and asset library. The web app is in [brandvault-frontend](<https://github.com/Ali-Dilshad/brandvault-frontend.git>).


## Live demo

- App: `https://brandvault-klepon-90763.netlify.app` (the API runs on a free tier and sleeps when idle, so the first load can take up to a minute)
- Demo login: `demo@brandvault.dev` / `Demo1234!`, or click "Continue as demo" on the login page

The API runs on a free hosting plan that sleeps when idle, so the first request after a pause can take up to a minute.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 22, TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (Supabase) |
| ORM and migrations | Drizzle ORM, drizzle-kit (SQL migrations) |
| Auth | JWT, bcryptjs |
| Validation | Zod |
| AI | Groq |
| Automation | n8n (webhook bonus) |
| Tests | Vitest, Supertest |
| Hosting | Render |

## Local setup

Requires Node.js 22+ and a Postgres database. A free Supabase project works: use the session pooler connection string, and URL-encode special characters in the password (`@` becomes `%40`).

```bash
git clone <repo-url>
cd brandvault-backend
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL`, `JWT_SECRET` and `CORS_ORIGIN`. On Windows, use `copy` instead of `cp`. Then:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

The API runs at `http://localhost:4000`.

`AI_PROVIDER` defaults to `mock`, which needs no API key and builds simple tags from the asset's own fields. To use Groq, set `AI_PROVIDER=groq`, `GROQ_API_KEY` and `GROQ_MODEL`.

## Environment variables

Copy `.env.example`. The app checks these at startup and exits with a clear message if something required is missing.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret used to sign tokens (16+ characters) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `PORT` | Server port, default `4000` |
| `CORS_ORIGIN` | Allowed frontend origin, with no trailing slash. Separate several with commas |
| `AI_PROVIDER` | `mock`, `groq`, `gemini`, `openai` or `anthropic`. Default `mock` |
| `GROQ_API_KEY`, `GROQ_MODEL` | Required when `AI_PROVIDER=groq` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Only for the Gemini provider |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Only for the OpenAI provider |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Only for the Anthropic provider |
| `N8N_WEBHOOK_URL` | Optional. If set, the API posts events to this URL |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | Account created by the seed script |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run the test suite |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Create the demo account and sample data |

## API

All routes except `/auth/*` and `/health` need `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create an account. Returns `{ token, user }` |
| POST | `/auth/signin` | Sign in. Returns `{ token, user }` |
| GET, POST, PATCH | `/brand` | Read, create, update the brand kit |
| GET, POST | `/folders` | List or create folders |
| PATCH, DELETE | `/folders/:id` | Rename, move or delete a folder |
| GET | `/assets` | List assets. Query: `q`, `sort` (`updated_desc` or `name_asc`), `trashed` (`true` or `false`) |
| POST | `/assets` | Create an asset |
| PATCH | `/assets/:id` | Update or move an asset. `folderId: null` removes it from its folder |
| DELETE | `/assets/:id` | Permanently delete an asset |
| POST | `/assets/:id/trash` | Move to Trash |
| POST | `/assets/:id/restore` | Restore from Trash |
| POST | `/assets/:id/ai-tags` | Generate a tag suggestion. Nothing is saved |
| PATCH | `/assets/:id/ai-tags/save` | Save a reviewed suggestion |

Errors are always `{ "error": "message" }`:

| Status | When |
|---|---|
| 400 | Invalid input, or folders nested too deep |
| 401 | Missing or invalid token, wrong credentials |
| 404 | Not found, or belongs to another user |
| 409 | Email already registered, brand already exists, folder not empty |
| 502 | The AI provider failed or returned invalid output |

## Data model

```
users
  |-- brands    one per user
  |-- folders   parent_id points to another folder, max depth 3
  |-- assets    folder_id is optional, deleted_at is set when trashed
```

- `brands`, `folders` and `assets` each have a `user_id` that references `users`.
- Assets have a type (`image`, `video`, `logo`, `document`, `font`), a URL, and optional `tags`, `description` and `usage_suggestion`.
- Asset and logo URLs must be `https://`. This is enforced by API validation, not by a database constraint.
- Trashing an asset sets `deleted_at`. Normal queries exclude those rows and the Trash view returns only those rows.
- Schema: `src/db/schema.ts`. Migrations: `drizzle/`.

## Authorization

- Every route except sign up, sign in and the health check requires a valid token.
- Every query is filtered by the signed-in user's id.
- If a folder, asset or brand belongs to someone else, the API returns 404, the same as if it did not exist. Returning 403 would confirm that the id is real.
- The tests sign up two users, create data as one, and try to read, edit, trash, restore, delete and tag it as the other. Every attempt returns 404 and the original data stays unchanged.

## Folder deletion

A folder cannot be deleted while it has subfolders or active assets. The API returns 409. Assets already in Trash do not block deletion. The database also enforces this for subfolders with `ON DELETE RESTRICT`.

## GenAI

- Provider: Groq. The model is set by `GROQ_MODEL`.
- Endpoints: `POST /assets/:id/ai-tags` returns a suggestion and saves nothing. `PATCH /assets/:id/ai-tags/save` stores it.
- Input: asset name, type, URL text, folder name, and the brand name and colors when a brand kit exists. The model does not open the file.
- Prompt file: `prompts/asset-tagging.md`. It tells the model to use only the input it is given.
- Validation: the model's JSON is checked against a Zod schema (`tags`, `description`, `usage_suggestion`). A response that does not match returns 502 and is never shown to the user. The save endpoint checks its request body against the same schema.
- Review before save: the app shows the suggestion first and only calls the save endpoint when the user confirms.
- The API key is read from the server environment and never reaches the client.

## n8n webhook (bonus)

The API sends a POST request to `N8N_WEBHOOK_URL` when one of three events happens: an AI tag suggestion is saved, an asset is restored from Trash, or the brand kit is updated.

- Events: `ai_tags_saved`, `asset_restored`, `brand_updated`
- Payload:
```json
  {
    "event": "asset_restored",
    "timestamp": "2026-09-29T12:00:00.000Z",
    "assetId": "...",
    "userEmail": "user@example.com"
  }
```
  `brand_updated` sends `brandId` instead of `assetId`.
- Workflow file: `n8n/brandvault-webhook.json` — a Webhook trigger into a Set node that builds a one-line summary (`<event>: <id> by <email> at <timestamp>`), visible in n8n's execution log. This satisfies the brief's "receive the webhook and send an email/log notification."
- Running on n8n Cloud's free trial. Verified directly: posting the exact payload shape the backend sends to the production webhook URL succeeds, and the execution log shows the correct summary extracted from it. The three call sites in the code (`restoreAsset`, `saveAiTags`, `updateBrand`) are deployed and live.
- Delivery is fire-and-forget with a 5-second timeout — a slow or unreachable webhook never blocks the actual request, and `sendWebhook()` does nothing at all if `N8N_WEBHOOK_URL` is unset.

## Testing

```bash
npm test
```

The tests run against the database in `DATABASE_URL`. Each test file creates temporary users and deletes them afterwards, so the seeded demo data is not touched.

| Area | What is covered |
|---|---|
| Auth | Sign up, sign in, duplicate email, weak password, wrong password, missing or invalid token |
| Brand | Create, duplicate create, invalid color, partial update |
| Folders | Depth limit, parent ownership, cycle prevention, delete blocked when not empty |
| Assets | https validation, search, sort, move, trash and restore, permanent delete |
| AI tagging | Generate without saving, invalid save body rejected, valid save stored |
| Authorization | Cross-user access to assets, folders, brand and AI routes |

## Deployment

The live API runs on Render as a free Node web service.

| Setting | Value |
|---|---|
| Build command | `npm install --include=dev && npm run build` |
| Start command | `node dist/db/migrate.js && node dist/server.js` |
| Health check path | `/health` |

Set the variables from the table above in Render's environment settings. Migrations run on every start and skip anything already applied.

## Project structure

```
src/
  app.ts            Express app, middleware, routes
  server.ts         starts the server
  config/env.ts     validates environment variables at startup
  db/               schema, client, migrate and seed scripts
  lib/              errors, JWT, password hashing, webhook helper
  middleware/       auth, validation, error handler
  modules/          auth, brand, folders, assets, ai
prompts/            asset-tagging.md
n8n/                brandvault-webhook.json
drizzle/            SQL migrations
tests/              Vitest and Supertest
```

## Tradeoffs and what I skipped

- Assets are URL records. There is no file upload.
- Tags come from asset metadata only. The model never opens the file.
- URLs are checked for format, not for whether they are reachable.
- Tokens last 7 days and there is no refresh flow.
- There is no rate limiting on sign in or on AI generation.
- `GET /folders` returns a flat list and the client builds the tree.
- `GET /assets` is not paginated.
- There is no activity log.
- The free hosting plan sleeps when idle.
- The n8n webhook runs on a 14-day free trial and will stop working once that expires.

## Next improvements

1. Rate limiting on `/auth/*` and the AI endpoint.
2. Real file upload to Supabase Storage or S3, for assets and the brand logo, instead of URL-only fields.
3. Pagination and a `folderId` filter on `GET /assets`.
4. A retry when the AI provider returns invalid JSON, before failing with a 502.
5. The n8n bonus fully self-hosted, avoiding the 14-day Cloud trial limit.