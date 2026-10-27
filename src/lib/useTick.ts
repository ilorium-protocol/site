import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * A slow clock for illustrative animations.
 *  - Server render, no-JS, reduced motion and "before it scrolls into view" all return R = true:
 *    components must draw their complete, static state when R is true.
 *  - Once visible and motion is allowed, R turns false and t counts up every `ms`.
 *  - The clock pauses when the block leaves the viewport.
 */
export function useTick(ms = 200) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { margin: '0px 0px -8% 0px' });
  const [started, setStarted] = useState(false);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (inView && !reduced) setStarted(true);
  }, [inView, reduced]);

  useEffect(() => {
    if (!started || !inView || reduced) return;
    const id = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [started, inView, reduced, ms]);

  return { ref, t, R: !started || !!reduced };
}
