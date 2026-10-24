// Motion runtime of the Chantier screens: GSAP, gated by prefers-reduced-motion.
// Rule: with reduced motion, nothing animates — screens render straight into their final state.
import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export { gsap };

const mq = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null);

/** true when the OS asks for reduced motion (live: follows the setting). */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => !!mq()?.matches);
  useEffect(() => {
    const m = mq(); if (!m) return;
    const h = (e) => setReduced(e.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return reduced;
}

/** gsap.context bound to a root ref; `fn(rootEl)` runs after layout and is reverted on cleanup.
 *  Pass `reduced` so the effect is skipped entirely (no inline styles left behind). */
export function useGsap(fn, deps = [], reduced = false) {
  const root = useRef(null);
  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context(() => fn(root.current), root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return root;
}

/** Fade + rise a list of elements with a small stagger (the one entrance used across screens). */
export function rise(targets, opts = {}) {
  return gsap.from(targets, { y: 12, opacity: 0, duration: .45, stagger: .06, ease: "power3.out", clearProps: "transform,opacity", ...opts });
}
