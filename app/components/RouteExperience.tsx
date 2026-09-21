"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export function RouteExperience() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const resetScroll = () => {
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previousBehavior;
    };

    window.history.scrollRestoration = "manual";
    resetScroll();

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(resetScroll);
    });

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.classList.add("motion-ready");

    if (reduceMotion) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.cancelAnimationFrame(secondFrame);
        root.classList.remove("motion-ready");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -4%", threshold: 0.01 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, [pathname]);

  return null;
}
