import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import type { CategoryDTO } from '@sharvi/shared';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { useCategories } from '@/hooks/catalog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

/** Split subcategories into up to two content-sized columns (no overlap). */
function columns<T>(items: T[]): T[][] {
  if (items.length <= 6) return [items];
  const half = Math.ceil(items.length / 2);
  return [items.slice(0, half), items.slice(half)];
}

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const count = useCart((s) => s.count());
  const openCart = useUi((s) => s.openCart);
  const { data: categories } = useCategories();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
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

  const cats = categories ?? [];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'bg-ivory/90 shadow-card backdrop-blur' : 'bg-ivory/70 backdrop-blur-sm',
      )}
    >
      <div className="container-px flex h-16 items-center justify-between gap-3">
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
            <img
              src="/brand/logo.png"
              alt=""
              aria-hidden="true"
              className="h-10 w-10 shrink-0 rounded-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="whitespace-nowrap font-serif text-xl font-semibold leading-none text-maroon-700">
              Sharvi<span className="text-gold-500"> Collections</span>
            </span>
          </Link>
        </div>

        {/* Desktop nav with fancy hover sub-category dropdowns */}
        <nav className="hidden items-center lg:flex">
          {cats.map((c) => (
            <div key={c.id} className="group relative">
              <Link
                to={`/shop/${c.slug}`}
                className="flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-maroon-50 hover:text-maroon-600 xl:text-sm"
              >
                {c.name}
                {c.subcategories.length > 0 && (
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                )}
              </Link>

              {c.subcategories.length > 0 && (
                <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-maroon-100 bg-white/95 shadow-soft backdrop-blur">
                    <div className="flex items-center justify-between gap-8 bg-gradient-to-r from-maroon-600 to-maroon-700 px-5 py-3">
                      <p className="font-serif text-sm text-white">{c.name}</p>
                      <Link
                        to={`/shop/${c.slug}`}
                        className="whitespace-nowrap text-xs font-medium text-white/80 hover:text-white"
                      >
                        {t('nav.viewAll')} →
                      </Link>
                    </div>
                    <div className="flex gap-8 p-5">
                      {columns(c.subcategories).map((col, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                          {col.map((s) => (
                            <Link
                              key={s.id}
                              to={`/shop/${c.slug}?subcategory=${s.slug}`}
                              className="whitespace-nowrap rounded-lg px-2 py-1.5 text-sm text-ink/80 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                            >
                              {s.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <form onSubmit={submitSearch} className="hidden xl:block">
            <div className="flex h-10 items-center rounded-full border border-maroon-100 bg-white/70 px-3 transition-colors focus-within:border-maroon-300 focus-within:bg-white">
              <Search className="h-4 w-4 shrink-0 text-maroon-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('nav.search')}
                aria-label={t('nav.search')}
                className="w-40 bg-transparent px-2 text-sm outline-none placeholder:text-maroon-300 focus-visible:ring-0"
              />
            </div>
          </form>
          <LanguageSwitcher className="hidden h-10 sm:inline-flex" />
          <motion.button
            type="button"
            onClick={openCart}
            aria-label={t('nav.cart')}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.06 }}
            className="relative grid h-10 w-10 place-items-center rounded-full text-maroon-700 transition-colors hover:bg-maroon-50"
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-maroon-600 text-[11px] font-semibold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile drawer nav — portalled to <body> to escape the header's blur. */}
      {createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-[70] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileOpen(false)} />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-ivory shadow-soft"
              >
                <div className="flex items-center justify-between border-b border-maroon-100 p-5">
                  <span className="font-serif text-lg text-maroon-700">Menu</span>
                  <button aria-label="Close" onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <form onSubmit={submitSearch} className="mb-4 flex items-center rounded-full bg-white px-3">
                    <Search className="h-4 w-4 text-maroon-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('nav.search')}
                      className="w-full bg-transparent px-2 py-2.5 text-sm outline-none focus-visible:ring-0"
                    />
                  </form>

                  <nav className="flex flex-col">
                    {cats.map((c) => (
                      <MobileCategory
                        key={c.id}
                        category={c}
                        open={expanded === c.id}
                        onToggle={() => setExpanded((e) => (e === c.id ? null : c.id))}
                        onNavigate={() => setMobileOpen(false)}
                        allLabel={t('nav.viewAll')}
                      />
                    ))}
                  </nav>
                </div>

                <div className="border-t border-maroon-100 p-4">
                  <LanguageSwitcher />
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}

/** Mobile accordion row for a category with expandable subcategories. */
function MobileCategory({
  category,
  open,
  onToggle,
  onNavigate,
  allLabel,
}: {
  category: CategoryDTO;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  allLabel: string;
}) {
  const hasSubs = category.subcategories.length > 0;
  return (
    <div className="border-b border-maroon-50">
      <div className="flex items-center">
        <Link
          to={`/shop/${category.slug}`}
          onClick={onNavigate}
          className="flex-1 py-3 text-[15px] font-medium text-ink hover:text-maroon-600"
        >
          {category.name}
        </Link>
        {hasSubs && (
          <button
            aria-label={`Toggle ${category.name}`}
            aria-expanded={open}
            onClick={onToggle}
            className="grid h-9 w-9 place-items-center text-maroon-500"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {hasSubs && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col pb-2 pl-3">
              <Link
                to={`/shop/${category.slug}`}
                onClick={onNavigate}
                className="rounded-lg px-2 py-2 text-sm font-medium text-maroon-600 hover:bg-maroon-50"
              >
                {allLabel} {category.name}
              </Link>
              {category.subcategories.map((s) => (
                <Link
                  key={s.id}
                  to={`/shop/${category.slug}?subcategory=${s.slug}`}
                  onClick={onNavigate}
                  className="rounded-lg px-2 py-2 text-sm text-ink/75 hover:bg-maroon-50 hover:text-maroon-700"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
