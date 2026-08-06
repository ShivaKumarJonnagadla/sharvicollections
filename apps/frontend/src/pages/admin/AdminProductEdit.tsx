import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GripVertical, Loader2, Trash2, Upload } from 'lucide-react';
import type { CategoryDTO, ProductDTO } from '@sharvi/shared';
import { api, ApiError } from '@/lib/api';
import { useCategories } from '@/hooks/catalog';
import { cloudinaryUrl } from '@/lib/utils';
import { PageLoader } from '@/components/PageLoader';

interface ImageState {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  alt?: string;
  color?: string;
}

interface FormState {
  name: string;
  nameSv: string;
  articleId: string;
  description: string;
  descriptionSv: string;
  priceKr: string;
  compareAtKr: string;
  stock: string;
  categoryId: string;
  subcategoryId: string;
  badge: ProductDTO['badge'];
  isPublished: boolean;
  isFeatured: boolean;
}

const empty: FormState = {
  name: '',
  nameSv: '',
  articleId: '',
  description: '',
  descriptionSv: '',
  priceKr: '',
  compareAtKr: '',
  stock: '10',
  categoryId: '',
  subcategoryId: '',
  badge: 'NONE',
  isPublished: true,
  isFeatured: false,
};

export function AdminProductEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categories } = useCategories();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(empty);
  const [images, setImages] = useState<ImageState[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin', 'product', id],
    enabled: isEdit,
    queryFn: () => api.get<Paginated>(`/products/admin/all?pageSize=60`),
  });

  // Populate form when editing (find product in the admin list response).
  useEffect(() => {
    if (!isEdit || !existing) return;
    const p = existing.items.find((x) => x.id === id);
    if (!p) return;
    setForm({
      name: p.name,
      nameSv: p.nameSv ?? '',
      articleId: p.articleId ?? '',
      description: p.description ?? '',
      descriptionSv: p.descriptionSv ?? '',
      priceKr: String(p.priceMinor / 100),
      compareAtKr: p.compareAtMinor ? String(p.compareAtMinor / 100) : '',
      stock: String(p.stock),
      categoryId: p.category.id,
      subcategoryId: p.subcategory?.id ?? '',
      badge: p.badge,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
    });
    setImages(
      p.images.map((im) => ({
        url: im.url,
        publicId: im.publicId,
        alt: im.alt ?? undefined,
        color: im.color ?? undefined,
      })),
    );
  }, [isEdit, existing, id]);

  const activeCategory = categories?.find((c) => c.id === form.categoryId);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('images', f));
      const res = await api.upload<{ images: ImageState[] }>('/uploads', fd);
      setImages((prev) => [...prev, ...res.images]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    setError(null);
    if (!form.name || !form.priceKr || !form.categoryId) {
      setError('Name, price and category are required.');
      return;
    }
    // Images without a publicId are pre-existing; keep only fully-formed ones for
    // create/replace. (Edit replaces the image set when images are provided.)
    const payloadImages = images
      .filter((im) => im.publicId)
      .map((im, i) => ({
        url: im.url,
        publicId: im.publicId,
        alt: im.alt ?? form.name,
        color: im.color?.trim() || null,
        width: im.width,
        height: im.height,
        sortOrder: i,
      }));

    const body = {
      name: form.name,
      nameSv: form.nameSv || null,
      articleId: form.articleId.trim() || null,
      description: form.description || undefined,
      descriptionSv: form.descriptionSv || null,
      priceMinor: Math.round(Number(form.priceKr) * 100),
      compareAtMinor: form.compareAtKr ? Math.round(Number(form.compareAtKr) * 100) : null,
      stock: Number(form.stock),
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      badge: form.badge,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      ...(payloadImages.length ? { images: payloadImages } : {}),
    };

    setSaving(true);
    try {
      if (isEdit) await api.patch(`/products/${id}`, body);
      else await api.post('/products', { ...body, images: payloadImages });
      await qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading) return <PageLoader />;

  const inputCls =
    'w-full rounded-xl border border-maroon-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-maroon-500';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate('/admin/products')} className="flex items-center gap-2 text-sm text-ink/60">
        <ArrowLeft className="h-4 w-4" /> Products
      </button>
      <h1 className="font-serif text-3xl text-maroon-700">{isEdit ? 'Edit' : 'New'} Product</h1>

      {/* Images */}
      <section className="card p-6">
        <h2 className="mb-4 font-serif text-lg text-maroon-700">Images</h2>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-maroon-200 p-8 text-center hover:bg-maroon-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-maroon-500" />
          ) : (
            <Upload className="h-6 w-6 text-maroon-400" />
          )}
          <p className="mt-2 text-sm text-ink/60">Drag &amp; drop or click to upload (JPG/PNG/WEBP)</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <div key={i} className="rounded-xl border border-maroon-100 p-1">
                <div className="group relative overflow-hidden rounded-lg">
                  <img src={cloudinaryUrl(img.url, { width: 200, crop: 'fill' })} alt="" className="aspect-square w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-maroon-600 px-1.5 py-0.5 text-[10px] text-white">
                      Cover
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/50 p-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => move(i, -1)} className="text-white" aria-label="Move left">
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <button onClick={() => setImages((p) => p.filter((_, x) => x !== i))} className="text-white" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Optional colour label for this image */}
                <input
                  value={img.color ?? ''}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((im, x) => (x === i ? { ...im, color: e.target.value } : im)),
                    )
                  }
                  placeholder="Colour (e.g. Gold)"
                  className="mt-1 w-full rounded-md border border-maroon-100 px-2 py-1 text-xs outline-none focus:border-maroon-300"
                />
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-ink/50">
          Tag images with a colour (e.g. Gold, Silver) to show colour swatches on the product page.
          {isEdit && ' Saving replaces the image set with the images shown here.'}
        </p>
      </section>

      {/* Details */}
      <section className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-ink/70">
              Name <span className="rounded bg-maroon-50 px-1.5 text-xs text-maroon-600">EN</span>
            </label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-ink/70">
              Namn <span className="rounded bg-gold-50 px-1.5 text-xs text-gold-600">SV</span>
            </label>
            <input
              value={form.nameSv}
              onChange={(e) => setForm({ ...form, nameSv: e.target.value })}
              placeholder="Swedish (optional — falls back to English)"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Article ID (4–6 digits)</label>
          <input
            value={form.articleId}
            onChange={(e) => setForm({ ...form, articleId: e.target.value })}
            inputMode="numeric"
            placeholder="e.g. 10234"
            className={`${inputCls} max-w-xs`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-ink/70">
              Description <span className="rounded bg-maroon-50 px-1.5 text-xs text-maroon-600">EN</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-ink/70">
              Beskrivning <span className="rounded bg-gold-50 px-1.5 text-xs text-gold-600">SV</span>
            </label>
            <textarea
              value={form.descriptionSv}
              onChange={(e) => setForm({ ...form, descriptionSv: e.target.value })}
              rows={4}
              placeholder="Swedish (optional — falls back to English)"
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-ink/70">Price (kr)</label>
            <input value={form.priceKr} onChange={(e) => setForm({ ...form, priceKr: e.target.value })} type="number" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Compare-at (kr)</label>
            <input value={form.compareAtKr} onChange={(e) => setForm({ ...form, compareAtKr: e.target.value })} type="number" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Stock</label>
            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} type="number" className={inputCls} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-ink/70">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategoryId: '' })}
              className={inputCls}
            >
              <option value="">Select…</option>
              {categories?.map((c: CategoryDTO) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Subcategory</label>
            <select
              value={form.subcategoryId}
              onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
              className={inputCls}
              disabled={!activeCategory?.subcategories.length}
            >
              <option value="">None</option>
              {activeCategory?.subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Badge</label>
            <select
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value as ProductDTO['badge'] })}
              className={inputCls}
            >
              {['NONE', 'NEW', 'TRENDING', 'SALE'].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-maroon-600" />
            Published (visible)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-maroon-600" />
            Featured
          </label>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/admin/products')} className="btn-ghost">
          Cancel
        </button>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Product'}
        </button>
      </div>
    </div>
  );
}

// Local alias for the admin list response shape.
interface Paginated {
  items: ProductDTO[];
}
