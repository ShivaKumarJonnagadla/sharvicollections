# API reference

Base URL: `/(api)/v1` — e.g. `https://sharvicollections.vercel.app/api/v1`.
Interactive docs (Swagger UI): **`/api/docs`** · OpenAPI JSON: **`/api/docs.json`**.

## Conventions

- **Envelope:** success responses are `{ "success": true, "data": … }`; errors are
  `{ "success": false, "error": { "code", "message", "details? } }`.
- **Auth:** admin endpoints require the `sc_access` HttpOnly cookie (obtained via `/auth/login`).
- **CSRF:** all non-`GET` requests must send the `x-csrf-token` header matching the `sc_csrf`
  cookie (fetch it once from `GET /csrf-token`).
- **Money:** all amounts are integer **minor units** (öre). `34900` = `349 kr`.

## Endpoints

### System
| Method | Path | Description |
|-------|------|-------------|
| GET | `/health` | Liveness + DB connectivity |
| GET | `/csrf-token` | Issue a CSRF token (sets `sc_csrf`) |

### Auth
| Method | Path | Auth | Description |
|-------|------|------|-------------|
| POST | `/auth/login` | — | Login with `{ email, password }` (email **or** username `admin`). Sets cookies. |
| POST | `/auth/refresh` | cookie | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | cookie | Revoke refresh token, clear cookies |
| GET | `/auth/me` | access | Current user |

### Products
| Method | Path | Auth | Description |
|-------|------|------|-------------|
| GET | `/products` | — | List published products. Query: `q, category, subcategory, badge, minPrice, maxPrice, sort, page, pageSize` |
| GET | `/products/featured` | — | Homepage rails: featured / newArrivals / trending |
| GET | `/products/:slug` | — | Product + related (increments view count) |
| GET | `/products/admin/all` | admin | All products incl. hidden |
| POST | `/products` | admin | Create product |
| PATCH | `/products/:id` | admin | Update product (images replace set) |
| PATCH | `/products/:id/visibility` | admin | Hide/show `{ isPublished }` |
| DELETE | `/products/:id` | admin | Delete product + Cloudinary assets |

### Categories
| Method | Path | Description |
|-------|------|-------------|
| GET | `/categories` | Full taxonomy (active categories + subcategories) |

### Orders
| Method | Path | Auth | Description |
|-------|------|------|-------------|
| POST | `/orders` | — | Place an order. Body: `{ customerName, customerEmail, customerPhone, note?, paymentMethod, items[] }`. Prices re-derived server-side. |
| GET | `/orders/:orderNumber` | — | Public confirmation lookup |
| GET | `/orders/admin/list` | admin | List orders (`status?, page, pageSize`) |
| PATCH | `/orders/admin/:id/status` | admin | Update `{ status?, paymentStatus? }` |

### Uploads (admin)
| Method | Path | Description |
|-------|------|-------------|
| GET | `/uploads/sign` | Cloudinary signed-upload signature (direct browser upload) |
| POST | `/uploads` | Multipart server-side upload (`images[]`, ≤10, ≤8 MB each) |

### Analytics (admin)
| Method | Path | Description |
|-------|------|-------------|
| GET | `/analytics/dashboard` | KPI cards, 12-month sales trend, popular categories/products, recent orders, top customers |

### Consent
| Method | Path | Description |
|-------|------|-------------|
| POST | `/consent` | Record a GDPR consent event `{ visitorId, necessary, preferences, action }` |

## Example: place an order

```bash
CSRF=$(curl -s -c c.txt http://localhost:4000/api/v1/csrf-token | jq -r .data.csrfToken)
curl -s -b c.txt -X POST http://localhost:4000/api/v1/orders \
  -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" \
  -d '{"customerName":"Anna","customerEmail":"a@b.se","customerPhone":"+46700000000",
       "paymentMethod":"SWISH","items":[{"productId":"<id>","quantity":1}]}'
```
