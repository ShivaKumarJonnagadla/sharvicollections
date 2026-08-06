import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatSEK, LOW_STOCK_THRESHOLD, type Paginated, type ProductDTO } from '@sharvi/shared';
import { api } from '@/lib/api';
import { cloudinaryUrl } from '@/lib/utils';
import { PageLoader } from '@/components/PageLoader';

export function AdminProducts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.get<Paginated<ProductDTO>>('/products/admin/all?pageSize=200'),
  });

  const toggle = useMutation({
    mutationFn: (p: ProductDTO) =>
      api.patch(`/products/${p.id}/visibility`, { isPublished: !p.isPublished }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  if (isLoading || !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-maroon-700">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-maroon-100 text-ink/50">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-maroon-50">
            {data.items.map((p) => (
              <tr key={p.id} className={p.isPublished ? '' : 'opacity-60'}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-10 overflow-hidden rounded-lg bg-maroon-50">
                      {p.images[0] && (
                        <img
                          src={cloudinaryUrl(p.images[0].url, { width: 80, crop: 'fill' })}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-ink">{p.name}</p>
                      {p.badge !== 'NONE' && (
                        <span className="text-xs text-gold-500">{p.badge}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-ink/70">{p.category.name}</td>
                <td className="p-4">{formatSEK(p.priceMinor, 'sv')}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.stock <= 0
                        ? 'bg-red-50 text-red-600'
                        : p.stock <= LOW_STOCK_THRESHOLD
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {p.stock <= 0 ? 'Out' : `${p.stock} left`}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-maroon-50 text-maroon-500'
                    }`}
                  >
                    {p.isPublished ? 'Published' : 'Hidden'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggle.mutate(p)}
                      title={p.isPublished ? 'Hide' : 'Show'}
                      className="grid h-9 w-9 place-items-center rounded-lg hover:bg-maroon-50"
                    >
                      {p.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Link
                      to={`/admin/products/${p.id}`}
                      title="Edit"
                      className="grid h-9 w-9 place-items-center rounded-lg hover:bg-maroon-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/admin/products/new?duplicate=${p.id}`}
                      title="Duplicate"
                      className="grid h-9 w-9 place-items-center rounded-lg hover:bg-maroon-50"
                    >
                      <Copy className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"? This cannot be undone.`)) remove.mutate(p.id);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
