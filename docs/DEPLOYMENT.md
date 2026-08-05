# Deployment guide

The app deploys as a **single Vercel project** (static frontend + serverless Express API) backed
by **Neon PostgreSQL** and **Cloudinary**. Every push to `main` auto-deploys.

## 1. Prepare the services

### Neon (database)
1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string → `DATABASE_URL` (host contains `-pooler`).
3. Copy the **direct** connection string → `DIRECT_URL` (no `-pooler`; used by migrations).

### Cloudinary (images)
Create an account and copy **Cloud name**, **API key**, **API secret**.

## 2. Push to GitHub

```bash
git add -A
git commit -m "Sharvi Collections platform"
git branch -M main
git remote add origin git@github.com:<you>/sharvicollections.git
git push -u origin main
```

## 3. Import into Vercel

1. **Add New… → Project** and import the GitHub repo.
2. Vercel reads [`vercel.json`](../vercel.json) automatically:
   - Build: `npm run vercel-build` (builds shared + frontend)
   - Output: `apps/frontend/dist`
   - API: `api/index.ts` serverless function; `/api/*` is rewritten to it
   - Root `postinstall` runs `prisma generate`
3. Set the **Environment Variables** (Production + Preview):

   | Variable | Value |
   |---------|-------|
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_URL` | Neon **direct** URL |
   | `JWT_SECRET` | `openssl rand -base64 48` |
   | `JWT_REFRESH_SECRET` | `openssl rand -base64 48` |
   | `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | from Cloudinary |
   | `CORS_ORIGINS` | `https://sharvicollections.vercel.app` |
   | `NODE_ENV` | `production` |
   | `VITE_API_URL` | `/api/v1` (same-origin) |
   | `VITE_SITE_URL` | `https://sharvicollections.vercel.app` |

4. **Deploy.** Subsequent pushes to `main` deploy automatically; PRs get preview URLs.

## 4. Run migrations & seed against Neon

From your machine (with the production `DATABASE_URL`/`DIRECT_URL` in `.env`):

```bash
npm run prisma:deploy      # apply migrations to Neon
npm run prisma:seed        # taxonomy + admin + settings
npm run import:products    # optional: bulk product import
```

> Tip: keep a separate `.env.production` and load it explicitly when running these.

## 5. Post-deploy checklist

- [ ] `GET https://sharvicollections.vercel.app/api/v1/health` returns `{ success: true }`
- [ ] Storefront loads products and images (Cloudinary)
- [ ] Admin login works at `/admin/login`
- [ ] Swagger reachable at `/api/docs`
- [ ] Rotate any secrets that were ever shared in plaintext

## Notes & troubleshooting

- **Prisma engine on Vercel** — `binaryTargets` includes `rhel-openssl-3.0.x`; the function
  bundles `node_modules/.prisma/client/**` via `includeFiles`. If the engine is missing, redeploy
  after confirming `postinstall` ran.
- **Argon2** — the API uses `@node-rs/argon2` (prebuilt, serverless-safe). The seed/import scripts
  use node-`argon2`; both produce/verify standard Argon2id hashes.
- **Custom domain** — add it in Vercel and update `CORS_ORIGINS`, `VITE_SITE_URL`, `robots.txt`
  and `sitemap.xml` accordingly.
