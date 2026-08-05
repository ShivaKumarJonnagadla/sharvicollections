import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari standalone flag
    window.navigator.standalone === true
  );
}

/** True on iPhone/iPod and iPadOS (which reports as Mac + touch). */
export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const iphone = /iphone|ipod|ipad/i.test(ua);
  const ipadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return (iphone || ipadOs) && isSafari;
}

/**
 * Central PWA-install state. Reads the early-captured `window.__pwaPrompt`
 * (set by the inline script in index.html) so we never miss the event.
 */
export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(() => Boolean(window.__pwaPrompt));
  const [standalone, setStandalone] = useState<boolean>(isStandalone());

  useEffect(() => {
    const update = () => {
      setCanInstall(Boolean(window.__pwaPrompt));
      setStandalone(isStandalone());
    };
    update();
    window.addEventListener('pwa-available', update);
    // Also listen directly in case the inline handler was bypassed.
    window.addEventListener('beforeinstallprompt', update);
    window.addEventListener('appinstalled', update);
    return () => {
      window.removeEventListener('pwa-available', update);
      window.removeEventListener('beforeinstallprompt', update);
      window.removeEventListener('appinstalled', update);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const e = window.__pwaPrompt;
    if (!e) return false;
    await e.prompt();
    await e.userChoice;
    window.__pwaPrompt = null;
    window.dispatchEvent(new Event('pwa-available'));
    return true;
  }, []);

  return { canInstall, standalone, isIos: isIosDevice(), promptInstall };
}
