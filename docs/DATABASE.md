# Database

PostgreSQL (Neon) modelled with Prisma. Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma).

## ER diagram

```mermaid
erDiagram
  User ||--o{ RefreshToken : has
  User ||--o{ AuditLog : writes
  Category ||--o{ Subcategory : contains
  Category ||--o{ Product : groups
  Subcategory ||--o{ Product : groups
  Product ||--o{ ProductImage : has
  Product ||--o{ OrderItem : "referenced by"
  Order ||--o{ OrderItem : contains

  User {
    string id PK
    string email UK
    string name
    string passwordHash
    enum   role "ADMIN|CUSTOMER"
    bool   isActive
    datetime lastLoginAt
  }
  RefreshToken {
    string id PK
    string userId FK
    string tokenHash UK "sha256"
    datetime expiresAt
    datetime revokedAt
  }
  Category {
    string id PK
    string name UK
    string slug UK
    int    sortOrder
    bool   isActive
  }
  Subcategory {
    string id PK
    string categoryId FK
    string name
    string slug
  }
  Product {
    string id PK
    string name
    string slug UK
    int    priceMinor "öre"
    int    compareAtMinor
    string currency "SEK"
    int    stock
    bool   isPublished
    bool   isFeatured
    enum   badge "NONE|NEW|TRENDING|SALE"
    int    viewCount
    string categoryId FK
    string subcategoryId FK
  }
  ProductImage {
    string id PK
    string productId FK
    string url
    string publicId "cloudinary"
    int    sortOrder
  }
  Order {
    string id PK
    string orderNumber UK "SC-YYYY-NNNN"
    string customerName
    string customerEmail
    string customerPhone
    enum   status
    enum   paymentMethod "CASH|SWISH"
    enum   paymentStatus
    string paymentRef
    int    subtotalMinor
    int    totalMinor
  }
  OrderItem {
    string id PK
    string orderId FK
    string productId FK "nullable"
    string productName "snapshot"
    int    unitPriceMinor
    int    quantity
    int    lineTotalMinor
  }
  Setting {
    string id PK
    string key UK
    json   value
  }
  ConsentLog {
    string id PK
    string visitorId
    enum   action "GRANTED|REVOKED|UPDATED"
    string policyVersion
  }
```

## Design notes

- **Money** is stored as integer minor units (`priceMinor`, `totalMinor`, …) to avoid float errors.
- **Order items snapshot** `productName`, `productImage` and `unitPriceMinor` so historical orders
  remain correct even if the product is later edited or deleted (`productId` is nullable with
  `onDelete: SetNull`).
- **Hidden products** (`isPublished = false`) are filtered out of every storefront query.
- **Refresh tokens** are stored only as SHA-256 hashes and can be revoked (rotation on refresh).
- **Order numbers** are human-friendly and double as the **Swish payment reference** (`SC-2026-0001`).

## Migrations & seed

```bash
npm run prisma:migrate     # create/apply a dev migration
npm run prisma:deploy      # apply migrations in production/CI
npm run prisma:seed        # taxonomy + admin + settings
```

The seed inserts the exact category/subcategory taxonomy, the bootstrap admin (from
`SEED_ADMIN_*` env vars), and baseline settings.
