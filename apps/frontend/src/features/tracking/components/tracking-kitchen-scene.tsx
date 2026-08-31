'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { GiCookingPot } from 'react-icons/gi';
import type { KitchenOrderStatus } from '@/features/kitchen/services/kitchen-queue';

type TrackingKitchenSceneProps = { status: KitchenOrderStatus };

const steamColumns = [0, 1, 2];

export function TrackingKitchenScene({ status }: TrackingKitchenSceneProps) {
  const reduceMotion = useReducedMotion();
  const cooking = status === 'QUEUED' || status === 'PREPARING';

  if (!cooking) return null;

  return <div className="tracking-kitchen-scene" aria-hidden="true">
    <div className="tracking-steam">
      {steamColumns.map((column) => <motion.span
        key={column}
        className={`tracking-steam-column steam-${column}`}
        animate={reduceMotion ? undefined : { y: [4, -12], opacity: [0, 0.72, 0] }}
        transition={reduceMotion ? undefined : { duration: 1.8, delay: column * 0.28, repeat: Infinity, ease: 'easeOut' }}
      />)}
    </div>
    <motion.div
      className="tracking-pot"
      animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
      transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <GiCookingPot size={76} />
    </motion.div>
  </div>;
}
