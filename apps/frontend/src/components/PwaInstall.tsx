import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

/**
 * Centered "Install app" chip. Shows when the browser offers installation
 * (Android/Chrome/Edge) or on iOS Safari (with manual instructions). A guaranteed
 * manual entry point also lives in the footer via <FooterInstallButton>.
 */
export function PwaInstall() {
  const { canInstall, standalone, isIos, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => Boolean(localStorage.getItem('sc_pwa_dismissed')));
  const [showIosSheet, setShowIosSheet] = useState(false);

  // Give the page a moment before offering (nicer UX), and only when relevant.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(id);
  }, []);

  const eligible = !standalone && !dismissed && ready && (canInstall || isIos);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('sc_pwa_dismissed', '1');
  };

  const onInstall = async () => {
    if (isIos && !canInstall) {
      setShowIosSheet(true);
      return;
    }
    const ok = await promptInstall();
    if (ok) dismiss();
  };

  return (
    <>
      <AnimatePresence>
        {eligible && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed inset-x-0 bottom-4 z-[55] flex justify-center px-4"
          >
            <div className="card flex w-full max-w-md items-center gap-3 border border-maroon-100 p-3">
              <img src="/brand/logo.png" alt="" className="h-11 w-11 rounded-full" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-maroon-700">Install Sharvi Collections</p>
                <p className="text-xs text-ink/60">Add the app to your home screen.</p>
              </div>
              <button onClick={onInstall} className="btn-primary px-4 py-2 text-xs">
                <Download className="h-4 w-4" /> Install
              </button>
              <button onClick={dismiss} aria-label="Dismiss" className="text-ink/40 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <IosInstructions open={showIosSheet} onClose={() => setShowIosSheet(false)} />
    </>
  );
}

/**
 * Always-available "Install app" button for the footer. Hidden only when the
 * app is already installed. On iOS it opens the manual instructions.
 */
export function FooterInstallButton() {
  const { canInstall, standalone, isIos, promptInstall } = usePwaInstall();
  const [showIosSheet, setShowIosSheet] = useState(false);

  if (standalone || (!canInstall && !isIos)) return null;

  const onClick = async () => {
    if (isIos && !canInstall) return setShowIosSheet(true);
    await promptInstall();
  };

  return (
    <>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-maroon-600"
      >
        <Download className="h-4 w-4" /> Install app
      </button>
      <IosInstructions open={showIosSheet} onClose={() => setShowIosSheet(false)} />
    </>
  );
}

/** iOS "Add to Home Screen" instructions modal. */
function IosInstructions({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-sm p-6 text-center"
          >
            <img src="/brand/logo.png" alt="" className="mx-auto mb-3 h-14 w-14 rounded-full" />
            <h2 className="font-serif text-lg text-maroon-700">Install on iPhone / iPad</h2>
            <ol className="mt-4 space-y-3 text-left text-sm text-ink/75">
              <li className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-maroon-50 text-maroon-600">
                  1
                </span>
                <span className="flex items-center gap-1">
                  Tap the <Share className="inline h-4 w-4" /> Share button in Safari.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-maroon-50 text-maroon-600">
                  2
                </span>
                <span>Choose “Add to Home Screen”.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-maroon-50 text-maroon-600">
                  3
                </span>
                <span>Tap “Add” — done!</span>
              </li>
            </ol>
            <button onClick={onClose} className="btn-primary mt-6 w-full">
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
