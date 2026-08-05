import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { cloudinaryUrl } from '@/lib/utils';
import { PageLoader } from '@/components/PageLoader';

interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
  productName: string | null;
  productSlug: string | null;
}

export function AdminMedia() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'media'],
    queryFn: () => api.get<MediaItem[]>('/uploads/library'),
  });

  if (isLoading || !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-maroon-700">Media Library</h1>
        <span className="text-sm text-ink/50">{data.length} images</span>
      </div>

      {data.length === 0 ? (
        <div className="card p-12 text-center text-ink/50">
          No images yet. Upload images when creating products.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.map((m) => (
            <div key={m.id} className="card group overflow-hidden">
              <div className="aspect-square overflow-hidden bg-maroon-50">
                <img
                  src={cloudinaryUrl(m.url, { width: 300, crop: 'fill' })}
                  alt={m.alt ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-2">
                {m.productSlug ? (
                  <Link
                    to={`/product/${m.productSlug}`}
                    target="_blank"
                    className="line-clamp-1 text-xs text-ink/70 hover:text-maroon-600"
                  >
                    {m.productName}
                  </Link>
                ) : (
                  <span className="text-xs text-ink/40">Unlinked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
