import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { useCategories } from '@/hooks/catalog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const count = useCart((s) => s.count());
  const openCart = useUi((s) => s.openCart);
  const { data: categories } = useCategories();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
    setMobileOpen(false);
  };

  const topCategories = categories?.slice(0, 6) ?? [];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'bg-ivory/90 shadow-card backdrop-blur' : 'bg-ivory/60 backdrop-blur-sm',
      )}
    >
      <div className="container-px flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-maroon-700 lg:hidden"
            aria-label={t('nav.menu')}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            {/* Brand badge — falls back gracefully to the wordmark if absent. */}
            <img
              src="/brand/logo.png"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 rounded-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="font-serif text-xl font-semibold text-maroon-700 sm:text-2xl">
              Sharvi<span className="text-gold-400"> Collections</span>
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink lg:flex">
          <Link to="/shop" className="hover:text-maroon-600">
            {t('nav.shop')}
          </Link>
          {topCategories.map((c) => (
            <Link key={c.id} to={`/shop/${c.slug}`} className="hover:text-maroon-600">
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="hidden items-center md:flex">
            <div className="flex items-center rounded-full bg-white/70 px-3">
              <Search className="h-4 w-4 text-maroon-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('nav.search')}
                aria-label={t('nav.search')}
                className="w-40 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-maroon-300"
              />
            </div>
          </form>
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={openCart}
            aria-label={t('nav.cart')}
            className="relative grid h-10 w-10 place-items-center rounded-full text-maroon-700 hover:bg-maroon-50"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-maroon-600 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-ivory p-6 shadow-soft"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-serif text-lg text-maroon-700">Menu</span>
                <button aria-label="Close" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitSearch} className="mb-4 flex items-center rounded-full bg-white px-3">
                <Search className="h-4 w-4 text-maroon-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('nav.search')}
                  className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                />
              </form>
              <nav className="flex flex-col gap-1">
                <Link to="/shop" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-maroon-50">
                  {t('nav.shop')}
                </Link>
                {categories?.map((c) => (
                  <Link
                    key={c.id}
                    to={`/shop/${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 hover:bg-maroon-50"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
              <div className="mt-6">
                <LanguageSwitcher />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
