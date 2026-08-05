import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Floating "Install app" chip. Appears once the browser fires
 * `beforeinstallprompt` (Chrome/Edge/Android). Hidden if already installed or
 * previously dismissed. iOS Safari has no prompt event — a hint is shown there.
 */
export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sc_pwa_dismissed')) return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (isStandalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS doesn't support beforeinstallprompt — offer manual instructions.
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIos) {
      setIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('sc_pwa_dismissed', '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,26rem)] -translate-x-1/2"
        >
          <div className="card flex items-center gap-3 border border-maroon-100 p-3">
            <img src="/brand/logo.png" alt="" className="h-10 w-10 rounded-full" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-maroon-700">Install Sharvi Collections</p>
              <p className="text-xs text-ink/60">
                {iosHint ? 'Tap Share, then “Add to Home Screen”.' : 'Add the app to your home screen.'}
              </p>
            </div>
            {!iosHint && (
              <button onClick={install} className="btn-primary px-4 py-2 text-xs">
                <Download className="h-4 w-4" /> Install
              </button>
            )}
            <button onClick={dismiss} aria-label="Dismiss" className="text-ink/40 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
