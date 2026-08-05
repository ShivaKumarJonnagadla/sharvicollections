<div align="center">

# 💎 Sharvi Collections

**Affordable Multicultural Jewelry for Every Moment**

Everyday Wear · Special Occasions · Thoughtful Gifts — from Älmhult, Sweden.

Production-ready jewellery e-commerce platform · React 19 · Node 22 · Prisma · Neon · Cloudinary · Vercel

</div>

---

## Overview

A full-stack, mobile-first e-commerce storefront and admin dashboard for **Sharvi Collections**,
a Swedish multicultural jewellery business. Prices are shown exclusively in **SEK (kr)**, the UI
is bilingual (**English / Swedish**), and checkout supports **Cash** and **Swish** (with app
deep-linking + QR).

- 🛍️ Premium, animated storefront (Framer Motion) — hero, featured rails, product galleries with zoom & lightbox, slide-out cart, checkout.
- 🔐 Secure admin dashboard — JWT (HttpOnly cookies) + refresh rotation, Argon2 hashing, product CRUD, Cloudinary uploads, orders, analytics charts.
- 🌍 i18n (EN/SV) with instant switching, remembered per browser.
- 📱 PWA — installable, offline-capable, app icons & manifest.
- 🛡️ OWASP-minded — Helmet, CORS allow-list, rate limiting, CSRF (double-submit), input sanitisation, Prisma-parameterised queries.
- 🇸🇪 GDPR — no tracking cookies, no analytics until consent, auditable consent log.

## Tech stack

| Layer | Technology |
|------|------------|
| Frontend | React 19, Vite, TypeScript, TailwindCSS, Framer Motion, React Router, TanStack Query, Zustand, React Hook Form, Zod, i18next, PWA |
| Backend | Node 22, Express, TypeScript, JWT + refresh cookies, Helmet, CORS, Compression, Rate limiting, CSRF, Multer, Cloudinary SDK |
| Database | Neon PostgreSQL via Prisma ORM |
| Images | Cloudinary (signed uploads, auto format/quality) |
| Deploy | Vercel (static frontend + serverless API) · Neon · Cloudinary |

## Monorepo structure

```
sharvicollections/
├── apps/
│   ├── backend/        # Express API (TypeScript)
│   └── frontend/       # React 19 + Vite storefront & admin
├── packages/
│   └── shared/         # Shared types, Zod schemas, money & slug utils
├── prisma/             # schema.prisma, migrations, seed
├── api/                # Vercel serverless entry (wraps the Express app)
├── scripts/            # Product importer, icon generators
├── data/               # Product import manifest + image drop folder
├── docker/             # Dockerfiles + nginx config
├── docs/               # Architecture, ER diagram, API, deployment
└── .github/workflows/  # CI
```

## Prerequisites

- **Node 22+** and npm 10+
- A **Neon PostgreSQL** database (or any Postgres via Docker Compose)
- A **Cloudinary** account (for image uploads)

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env       # then fill in DATABASE_URL, JWT secrets, Cloudinary…

# 3. Set up the database
npm run prisma:migrate     # apply migrations
npm run prisma:seed        # taxonomy + admin user + settings

# 4. (optional) Import the initial product catalogue
#    Drop images in data/product-images/ then:
npm run import:products

# 5. Run locally
npm run dev:backend        # http://localhost:4000/api/v1
npm run dev:frontend       # http://localhost:5173
```

Admin dashboard: <http://localhost:5173/admin/login> · API docs (Swagger): <http://localhost:4000/api/docs>

## Environment variables

See [`.env.example`](.env.example). Never commit real secrets — they live only in `.env`
(gitignored) locally and in the Vercel/Neon/Cloudinary dashboards in production.

Key variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`CORS_ORIGINS`, and the `VITE_*` public frontend vars.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev:backend` / `dev:frontend` | Start API / storefront in watch mode |
| `npm run build` | Build shared + backend + frontend |
| `npm run prisma:migrate` / `:deploy` | Apply migrations (dev / prod) |
| `npm run prisma:seed` | Seed taxonomy, admin, settings |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run import:products` | Bulk import products + Cloudinary uploads |
| `npm run brand:icons` | Regenerate favicon/PWA icons from a brand logo |
| `npm run test` | Run all unit tests (Vitest) |
| `npm run typecheck` / `lint` | Static checks |

## Branding & icons

Place the brand logos in `apps/frontend/public/brand/` (see its README), then:

```bash
npm run brand:icons              # from the lotus logo (default)
npm run brand:icons -- monogram  # from the monogram logo
```

## Deployment

Full guide in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). In short: push to GitHub, import the
repo into Vercel (it auto-detects [`vercel.json`](vercel.json)), add the environment variables,
and every push to `main` auto-deploys to `https://sharvicollections.vercel.app`.

## Docker (local, offline)

```bash
docker compose up --build
# frontend → http://localhost:8080 · backend → http://localhost:4000 · postgres → 5432
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database / ER diagram](docs/DATABASE.md)
- [API reference](docs/API.md) (+ live Swagger at `/api/docs`)
- [Deployment guide](docs/DEPLOYMENT.md)

## Security

See [docs/ARCHITECTURE.md#security](docs/ARCHITECTURE.md#security). Highlights: Argon2id password
hashing, JWT access + rotating refresh tokens in HttpOnly/SameSite=Strict cookies, CSRF
double-submit, Helmet headers, per-route rate limiting, input sanitisation, Cloudinary signed
uploads, and audit logging of privileged actions.

## License

Proprietary — © Sharvi Collections. All rights reserved.
