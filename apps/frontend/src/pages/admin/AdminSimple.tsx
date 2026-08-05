import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

const COPY: Record<string, { title: string; text: string }> = {
  '/admin/customers': {
    title: 'Customers',
    text: 'Customer profiles are derived from orders. A dedicated CRM view is on the roadmap.',
  },
  '/admin/settings': {
    title: 'Settings',
    text: 'Storefront settings (hero text, banners, policy version) are stored in the Settings table and editable here soon.',
  },
  '/admin/media': {
    title: 'Media Library',
    text: 'All product images live in Cloudinary under sharvi-collections/products. A browsable media grid is coming next.',
  },
};

/** Placeholder for admin sections planned but not yet built out. */
export function AdminSimple() {
  const { pathname } = useLocation();
  const copy = COPY[pathname] ?? { title: 'Coming soon', text: 'This section is under construction.' };
  return (
    <div className="mx-auto max-w-xl">
      <div className="card flex flex-col items-center p-12 text-center">
        <Construction className="mb-4 h-10 w-10 text-gold-400" />
        <h1 className="font-serif text-2xl text-maroon-700">{copy.title}</h1>
        <p className="mt-2 text-ink/60">{copy.text}</p>
      </div>
    </div>
  );
}
