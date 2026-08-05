import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/** Instant EN/SV toggle. Choice is remembered by i18next (localStorage). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('sv') ? 'sv' : 'en';

  return (
    <div
      className={cn('inline-flex items-center rounded-full bg-white/70 p-0.5 text-xs', className)}
      role="group"
      aria-label="Language"
    >
      {(['en', 'sv'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={cn(
            'rounded-full px-3 py-1 font-medium uppercase transition-colors',
            current === lng ? 'bg-maroon-600 text-white' : 'text-maroon-700 hover:bg-maroon-50',
          )}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}
