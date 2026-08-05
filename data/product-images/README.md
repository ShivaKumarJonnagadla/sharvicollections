# Product image drop folder

Put the 12 jewellery photos here, named to match the `file` field in
[`../initial-products.json`](../initial-products.json):

```
01.jpg  →  Multi-Tone Hammered Statement Necklace Set
02.jpg  →  Antique Amethyst & CZ Necklace Set
03.jpg  →  Antique Rose Floral Drop Earrings
04.jpg  →  Ruby & Gold Bead Chain Necklace
05.jpg  →  Black Bead CZ Mangalsutra Chain
06.jpg  →  Gold Heart Charm Necklace
07.jpg  →  Black Bead CZ Chain Necklace
08.jpg  →  CZ Bow Pendant Black Bead Necklace
09.jpg  →  Tri-Tone Heart Necklace Set
10.jpg  →  Cubic Zirconia Line Drop Earrings
11.jpg  →  Multicolour CZ Leaf Choker
12.jpg  →  Gold Star & Leaf Station Necklace
```

`.jpg`, `.jpeg`, `.png` and `.webp` are all accepted — the importer matches by
the base name (`01`, `02`, …), so `01.png` works too.

Then, from the repo root, with `.env` filled in (Cloudinary + DATABASE_URL):

```bash
npm run import:products
```

The script uploads each image to Cloudinary (folder `sharvi-collections/products`)
and creates the product with its description and price. Re-running is safe — it
upserts by product slug and skips images that already exist.
