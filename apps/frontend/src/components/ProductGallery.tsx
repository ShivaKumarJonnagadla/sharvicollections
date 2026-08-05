import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import type { ProductImageDTO } from '@sharvi/shared';
import { cloudinaryUrl, cn } from '@/lib/utils';

/** Large product gallery with hover-zoom (desktop) and fullscreen lightbox. */
export function ProductGallery({ images, name }: { images: ProductImageDTO[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  if (images.length === 0) {
    return <div className="aspect-square w-full rounded-3xl bg-maroon-50" />;
  }

  const current = images[active];
  const go = (dir: 1 | -1) => setActive((p) => (p + dir + images.length) % images.length);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="space-y-4">
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl bg-white"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
      >
        <motion.img
          key={current.id}
          src={cloudinaryUrl(current.url, { width: 1000, crop: 'fit' })}
          alt={current.alt ?? name}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="h-full w-full object-cover transition-transform duration-200"
          style={
            zoom
              ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : undefined
          }
        />
        <button
          onClick={() => setLightbox(true)}
          aria-label="Open fullscreen"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-maroon-700 opacity-0 backdrop-blur transition group-hover:opacity-100"
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        {images.length > 1 && (
          <>
            <button
              aria-label="Previous"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 opacity-0 transition group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Next"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 opacity-0 transition group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition',
                i === active ? 'border-maroon-500' : 'border-transparent opacity-70',
              )}
            >
              <img
                src={cloudinaryUrl(img.url, { width: 160, crop: 'fill' })}
                alt={img.alt ?? `${name} ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox (pinch-zoom enabled via native touch on the image) */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              aria-label="Close"
              className="absolute right-5 top-5 text-white"
              onClick={() => setLightbox(false)}
            >
              <X className="h-7 w-7" />
            </button>
            <img
              src={cloudinaryUrl(current.url, { width: 1600 })}
              alt={current.alt ?? name}
              className="max-h-full max-w-full touch-pinch-zoom rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <button
                  aria-label="Previous"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-4 text-white"
                >
                  <ChevronLeft className="h-9 w-9" />
                </button>
                <button
                  aria-label="Next"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-4 text-white"
                >
                  <ChevronRight className="h-9 w-9" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
