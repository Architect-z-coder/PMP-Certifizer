// Source: 21st.dev — "Horizontal Scroll Gallery" by @pulkitxm (demo id 20139) — https://21st.dev/@pulkitxm/components/horizontal-scroll-gallery
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollGalleryProps {
  children: React.ReactNode;
  className?: string;
  scroller?: React.RefObject<HTMLElement | null>;
  scrollHeight?: string;
}

export function HorizontalScrollGallery({
  children,
  className,
  scroller,
  scrollHeight = "300%",
}: HorizontalScrollGalleryProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState("100vh");

  useEffect(() => {
    const container = scroller?.current;
    if (!container) {
      setStickyHeight("100vh");
      return;
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setStickyHeight(`${entry.contentRect.height}px`);
      }
    });
    ro.observe(container);
    setStickyHeight(`${container.clientHeight}px`);
    return () => ro.disconnect();
  }, [scroller]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!(wrapper && track)) {
      return;
    }

    const getContainer = () => scroller?.current ?? null;

    const update = () => {
      const container = getContainer();
      const viewportTop = container ? container.getBoundingClientRect().top : 0;
      const viewportHeight = container
        ? container.clientHeight
        : window.innerHeight;

      const wrapperRect = wrapper.getBoundingClientRect();
      const scrollableRange = wrapperRect.height - viewportHeight;
      if (scrollableRange <= 0) {
        return;
      }

      const scrolled = viewportTop - wrapperRect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableRange));

      const trackWidth = track.scrollWidth;
      const maxOffset =
        trackWidth - (container?.clientWidth ?? window.innerWidth);
      if (maxOffset <= 0) {
        return;
      }

      track.style.transform = `translateX(-${progress * maxOffset}px)`;
    };

    const scrollTarget = getContainer() ?? window;

    scrollTarget.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(track);
    update();

    return () => {
      scrollTarget.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scroller]);

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full", className)}
      style={{ height: scrollHeight }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: stickyHeight }}
      >
        <div
          ref={trackRef}
          className="flex h-full w-max gap-4 will-change-transform"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default HorizontalScrollGallery;
