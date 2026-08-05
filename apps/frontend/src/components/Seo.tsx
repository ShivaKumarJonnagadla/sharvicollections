import { useEffect } from 'react';
import { SITE_URL } from '@/lib/utils';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'product';
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_DESC =
  'Affordable multicultural jewellery inspired by Western, Indian and Middle Eastern styles. Based in Älmhult, Sweden.';

/** Upsert a <meta> tag by attribute, so repeated navigations don't duplicate it. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Lightweight, React-19-native SEO head manager (no react-helmet dependency).
 * Sets title, description, Open Graph, Twitter cards, canonical and JSON-LD.
 */
export function Seo({ title, description, image, path = '', type = 'website', jsonLd }: SeoProps) {
  const fullTitle = title
    ? `${title} — Sharvi Collections`
    : 'Sharvi Collections — Multicultural Jewellery';
  const desc = description ?? DEFAULT_DESC;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/og-image.png`;

  useEffect(() => {
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setLink('canonical', canonical);

    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'Sharvi Collections');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', ogImage);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', ogImage);

    const scriptId = 'seo-jsonld';
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [fullTitle, desc, canonical, ogImage, type, jsonLd]);

  return null;
}
