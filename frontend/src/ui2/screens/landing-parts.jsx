// Motion parts of the « Présentation » page (ui2 Landing), ported from ui-lab/src/chantier/components (Film + the six
// 21st.dev components adapted there). Same values as in ui-lab; GSAP ScrollTrigger only (no Lenis: no new dependency).
// Every part renders its final state when `reduced` is true. Source and changes are kept in each header.
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

// A film, by the MEDIA.md rules: muted, looping, playsinline, with a poster; plays only while on screen
// (IntersectionObserver, threshold 0.15); with reduced motion the poster alone is shown. Films are decorative
// (aria-hidden), so every caption lives in the DOM next to them.
export function Film({ src, poster, reduced, className = "film" }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (reduced || !v || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); }), { threshold: 0.15 });
    io.observe(v);
    return () => { io.disconnect(); v.pause(); };
  }, [reduced]);
  if (reduced) return <img className={className} src={poster} alt="" aria-hidden="true" />;
  return <video ref={ref} className={className} muted loop playsInline preload="metadata" poster={poster} aria-hidden="true"><source src={src} type="video/mp4" /></video>;
}

// Source: 21st.dev — "Scroll Progress" by @cnippet-dev (demo id 18715). Original: motion/react useScroll + useSpring
// driving scaleX of a fixed bar. Changes: the spring became a GSAP quickTo (0.5 s, power3.out) fed by a ScrollTrigger
// over the whole page. Hidden with reduced motion.
export function ScrollProgress({ reduced }) {
  const ref = useRef(null);
  useEffect(() => {
    if (reduced || !ref.current) return undefined;
    const setProg = gsap.quickTo(ref.current, "scaleX", { duration: 0.5, ease: "power3.out" });
    const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => setProg(s.progress) });
    return () => st.kill();
  }, [reduced]);
  if (reduced) return null;
  return <div ref={ref} className="progress" aria-hidden="true" />;
}

// Source: 21st.dev — "Reveal" by @asanshay (demo id 19240). Original: hidden { opacity 0, y 40, blur 10px } → show
// { delay index*0.15, 0.6 s easeOut }, once. Changes: same values on a GSAP ScrollTrigger (start "top 80%", once).
export function Reveal({ children, className, index = 0, as: Tag = "div", reduced, ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (reduced || !ref.current) return undefined;
    const tween = gsap.from(ref.current, { opacity: 0, y: 40, filter: "blur(10px)", duration: 0.6, ease: "power2.out", delay: index * 0.15, clearProps: "filter", scrollTrigger: { trigger: ref.current, start: "top 80%", once: true } });
    return () => { tween.scrollTrigger?.kill(); tween.revert(); };
  }, [reduced, index]);
  return <Tag ref={ref} className={className} {...rest}>{children}</Tag>;
}

// Source: 21st.dev — "Video Scroll Hero" by @isaiahbjork (demo id 7512). Original: a 200vh container with a sticky 100vh
// stage; scroll progress scales the video frame from startScale (0.25) to 1; a caption overlay fades in.
// Changes: the scroll listener became a GSAP ScrollTrigger (scrub 0.8); the video is <Film>; reduced → scale(1).
export function VideoScrollHero({ src, poster, startScale = 0.25, children, reduced, label }) {
  const root = useRef(null);
  const frame = useRef(null);
  useLayoutEffect(() => {
    if (reduced || !root.current) return undefined;
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8 } });
    tl.fromTo(frame.current, { scale: startScale, borderRadius: 28 }, { scale: 1, borderRadius: 0, ease: "power2.inOut", duration: 1 })
      .from(frame.current.querySelectorAll(".reel-cap > *"), { y: 30, opacity: 0, stagger: 0.12, duration: 0.4 }, 0.55);
    return () => { tl.scrollTrigger?.kill(); tl.revert(); };
  }, [reduced, startScale]);
  return (
    <section ref={root} className="vsh" aria-label={label} style={reduced ? { height: "auto" } : undefined}>
      <div className="vsh-sticky" style={reduced ? { position: "static", height: "70vh" } : undefined}>
        <div ref={frame} className="vsh-frame" style={reduced ? { borderRadius: 0 } : { transform: `scale(${startScale})` }}>
          <Film src={src} poster={poster} reduced={reduced} />
          <div className="reel-cap wrap">{children}</div>
        </div>
      </div>
    </section>
  );
}

// Source: 21st.dev — "Horizontal Scroll Gallery" by @pulkitxm (demo id 20139). Original: a 300% wrapper with a sticky
// viewport; scroll progress maps to translateX on a flex track. Changes: a GSAP ScrollTrigger (scrub 0.6,
// invalidateOnRefresh) whose tween is handed to `onAnimation` (containerAnimation for the cards); the cleanup that
// `onAnimation` returns runs on unmount; reduced motion → the track scrolls sideways (overflow-x: auto).
export function HorizontalScrollGallery({ children, intro, scrollHeight = "300%", reduced, onAnimation, regionLabel, ...rest }) {
  const wrapper = useRef(null);
  const track = useRef(null);
  useLayoutEffect(() => {
    if (reduced || !wrapper.current || !track.current) return undefined;
    const dist = () => Math.max(0, track.current.scrollWidth - window.innerWidth + 32);
    const t = gsap.to(track.current, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: wrapper.current, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
    const undo = onAnimation ? onAnimation(t) : null;
    return () => { if (typeof undo === "function") undo(); t.scrollTrigger?.kill(); t.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  return (
    <section ref={wrapper} className="hz" style={{ height: reduced ? "auto" : scrollHeight }} {...rest}>
      <div className="hz-sticky" style={reduced ? { position: "static", minHeight: 0, overflow: "visible" } : undefined}>
        {intro}
        <div style={reduced ? { overflowX: "auto", overflowY: "hidden" } : undefined} {...(reduced ? { tabIndex: 0, role: "region", "aria-label": regionLabel } : {})}>
          <div ref={track} className="hz-track">{children}</div>
        </div>
      </div>
    </section>
  );
}

// Source: 21st.dev — "Reveal Image Mask" by @daiwiikharihar (demo id 10905). Original: useScroll(["start 85%", "end 15%"])
// → spring → clip-path (circle 16% → 75% · rounded inset 30% → 0). Changes: GSAP ScrollTrigger (scrub 0.8), a
// <figcaption> slot; reduced motion = final frame (no clip).
export function RevealImageMask({ src, alt, shape = "rounded", className = "", caption, reduced, width, height, loading = "lazy" }) {
  const ref = useRef(null);
  const img = useRef(null);
  useLayoutEffect(() => {
    if (reduced || !img.current) return undefined;
    const from = shape === "circle" ? "circle(16% at 50% 50%)" : "inset(30% round 10%)";
    const to = shape === "circle" ? "circle(75% at 50% 50%)" : "inset(0% round 0%)";
    const tween = gsap.fromTo(img.current, { clipPath: from }, { clipPath: to, ease: "none", scrollTrigger: { trigger: ref.current, start: "top 85%", end: "bottom 15%", scrub: 0.8 } });
    return () => { tween.scrollTrigger?.kill(); tween.revert(); };
  }, [reduced, shape]);
  return (
    <figure ref={ref} className={`person ${className}`}>
      <div className="ph" ref={img} style={{ willChange: reduced ? undefined : "clip-path" }}><img src={src} alt={alt} width={width} height={height} loading={loading} /></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// Source: 21st.dev — "Scroll Reveal Image" by @unlumen (demo id 24466). Original: useScroll(["start end", "start start"])
// animating the container width (40 → 95vw), the inner image scale (1.6 → 1) and the radius (0 → 22px from 0.5).
// Changes: one GSAP timeline (scrub 1), widths as % of the column; reduced motion = final frame.
export function ScrollRevealImage({ src, alt, boxHeight = "46vh", fromWidth = "40%", toWidth = "100%", fromRadius = 0, toRadius = 22, radiusStart = 0.5, fromScale = 1.6, toScale = 1, reduced, width, height, className = "" }) {
  const box = useRef(null);
  const inner = useRef(null);
  useLayoutEffect(() => {
    if (reduced || !box.current) return undefined;
    const tl = gsap.timeline({ scrollTrigger: { trigger: box.current, start: "top bottom", end: "top top", scrub: 1 } });
    tl.fromTo(box.current, { width: fromWidth, borderRadius: fromRadius }, { width: toWidth, ease: "none", duration: 1 }, 0)
      .fromTo(box.current, { borderRadius: fromRadius }, { borderRadius: toRadius, ease: "none", duration: 1 - radiusStart }, radiusStart)
      .fromTo(inner.current, { scale: fromScale }, { scale: toScale, ease: "none", duration: 1 }, 0);
    return () => { tl.scrollTrigger?.kill(); tl.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  return (
    <div ref={box} className={`sri ${className}`} style={{ height: boxHeight, width: reduced ? toWidth : fromWidth, borderRadius: reduced ? toRadius : fromRadius }}>
      <div ref={inner} className="sri-inner" style={{ width: "100%", transformOrigin: "50% 50%" }}><img src={src} alt={alt} width={width} height={height} loading="lazy" /></div>
    </div>
  );
}
