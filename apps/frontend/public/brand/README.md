# Brand logo drop folder

Save the two Sharvi Collections logos here as **PNG**:

- `logo-lotus.png` — the lotus + green pear-gem badge
- `logo-monogram.png` — the "S" monogram + aquamarine pendant badge

Then, from the repo root, generate every icon size from your chosen primary
logo (default: the lotus badge):

```bash
npm run brand:icons              # uses logo-lotus.png
npm run brand:icons -- monogram  # uses logo-monogram.png
```

This regenerates `favicon` usage, `apple-touch-icon.png`, the PWA
`icons/icon-*.png`, `og-image.png`, and `brand/logo.png` (used by the site
header). It uses the macOS built-in `sips` — no extra tooling required.
