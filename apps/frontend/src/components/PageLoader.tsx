import { motion } from 'framer-motion';

/** Full-viewport loader shown during lazy route transitions. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        aria-label="Loading"
        role="status"
        className="h-10 w-10 rounded-full border-2 border-maroon-200 border-t-maroon-600"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
      />
    </div>
  );
}
