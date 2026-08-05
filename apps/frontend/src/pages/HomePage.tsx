import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Gem, Globe2, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { useFeatured } from '@/hooks/catalog';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';
import { WhatsAppBanner } from '@/components/WhatsAppBanner';
import { Seo } from '@/components/Seo';
import type { ProductDTO } from '@sharvi/shared';

function SectionHeading({ eyebrow, title, to }: { eyebrow?: string; title: string; to?: string }) {
  const { t } = useTranslation();
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-sm font-medium uppercase tracking-widest text-gold-500">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl text-maroon-700 sm:text-4xl">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="hidden text-sm font-medium text-maroon-600 hover:underline sm:block">
          {t('nav.shop')} →
        </Link>
      )}
    </div>
  );
}

function Rail({ products, loading }: { products?: ProductDTO[]; loading: boolean }) {
  if (loading) return <ProductGridSkeleton count={4} />;
  if (!products?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.slice(0, 4).map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useFeatured();

  const whyItems = [
    { icon: Gem, title: t('why.affordable'), text: t('why.affordableText') },
    { icon: Globe2, title: t('why.multicultural'), text: t('why.multiculturalText') },
    { icon: ShieldCheck, title: t('why.quality'), text: t('why.qualityText') },
    { icon: MapPin, title: t('why.local'), text: t('why.localText') },
  ];

  const reviews = [
    { name: 'Anna L.', text: 'Beautiful pieces and unbeatable prices. My necklace still shines!' },
    { name: 'Priya R.', text: 'Love the multicultural designs — perfect for festivals and daily wear.' },
    { name: 'Sofia M.', text: 'Fast, friendly and the jewellery looks so much more expensive than it is.' },
  ];

  // Pin the hero to the Gold Star & Leaf Station Necklace, falling back to the
  // first featured product if it isn't available.
  const pool = [...(data?.featured ?? []), ...(data?.newArrivals ?? []), ...(data?.trending ?? [])];
  const heroProduct =
    pool.find((p) => p.slug === 'gold-star-and-leaf-station-necklace') ?? data?.featured?.[0];
  const heroImage = heroProduct?.images?.[0]?.url;

  return (
    <>
      <Seo
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: 'Sharvi Collections',
          description: t('brand.tagline'),
          address: { '@type': 'PostalAddress', addressLocality: 'Älmhult', addressCountry: 'SE' },
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-maroon-100/50 blur-3xl" />
        <div className="absolute -right-16 top-40 h-64 w-64 rounded-full bg-gold-100/60 blur-3xl" />
        <div className="container-px grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm text-maroon-600">
              <Sparkles className="h-4 w-4 text-gold-400" /> {t('brand.tagline')}
            </span>
            <h1 className="mt-5 font-serif text-4xl leading-[1.3] text-maroon-800 sm:text-5xl lg:text-6xl">
              {t('hero.subtitle')}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink/70">{t('hero.text')}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="btn-primary">
                {t('hero.cta')}
              </Link>
              <Link to="/shop?badge=NEW" className="btn-ghost">
                {t('hero.ctaSecondary')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="animate-float">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={heroProduct?.name ?? 'Sharvi Collections'}
                  className="mx-auto aspect-[4/5] w-full max-w-md rounded-[2rem] object-cover shadow-soft"
                />
              ) : (
                <div className="mx-auto aspect-[4/5] w-full max-w-md rounded-[2rem] bg-maroon-100" />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-px py-14">
        <SectionHeading eyebrow="Curated" title={t('sections.featured')} to="/shop" />
        <Rail products={data?.featured} loading={isLoading} />
      </section>

      {/* New Arrivals */}
      <section className="container-px py-14">
        <SectionHeading eyebrow="Fresh" title={t('sections.newArrivals')} to="/shop?badge=NEW" />
        <Rail products={data?.newArrivals} loading={isLoading} />
      </section>

      {/* Trending / Popular */}
      {data?.trending && data.trending.length > 0 && (
        <section className="container-px py-14">
          <SectionHeading eyebrow="Hot" title={t('sections.trending')} to="/shop?badge=TRENDING" />
          <Rail products={data.trending} loading={isLoading} />
        </section>
      )}

      {/* Why choose us */}
      <section className="container-px py-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl text-maroon-700 sm:text-4xl">{t('sections.whyUs')}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card p-6 text-center"
            >
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-maroon-50 text-maroon-600">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-white py-16">
        <div className="container-px">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl text-maroon-700 sm:text-4xl">
              {t('sections.reviews')}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r, i) => (
              <motion.blockquote
                key={r.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl bg-ivory p-6"
              >
                <div className="mb-3 flex gap-0.5 text-gold-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-gold-400" />
                  ))}
                </div>
                <p className="text-ink/80">“{r.text}”</p>
                <footer className="mt-4 text-sm font-medium text-maroon-600">— {r.name}</footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      <div className="py-16">
        <WhatsAppBanner />
      </div>

      {/* Find us */}
      <section className="container-px pb-8">
        <div className="rounded-3xl bg-maroon-50 p-8 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-maroon-500" />
          <h2 className="font-serif text-2xl text-maroon-700">{t('sections.findUs')}</h2>
          <p className="mt-2 text-ink/70">Älmhult, Sweden</p>
        </div>
      </section>
    </>
  );
}
