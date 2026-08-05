import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to top on every route change (respects reduced-motion via CSS). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}
