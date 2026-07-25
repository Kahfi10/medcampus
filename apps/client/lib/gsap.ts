"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

// Register plugins — client only
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

export { gsap, ScrollTrigger, TextPlugin };

export const EASE_OUT = "power2.out";
export const EASE_EXPO = "expo.out";
export const EASE_BACK = "back.out(1.2)";

/** Stagger reveal: opacity + translateY */
export function revealItems(
  targets: gsap.TweenTarget,
  options?: gsap.TweenVars
) {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 40 },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: EASE_OUT,
      stagger: 0.1,
      ...options,
    }
  );
}

/** ScrollTrigger batch reveal */
export function scrollReveal(
  targets: string,
  trigger: Element | string,
  options?: gsap.TweenVars
) {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: EASE_OUT,
      stagger: 0.12,
      scrollTrigger: {
        trigger,
        start: "top 80%",
        toggleActions: "play none none none",
      },
      ...options,
    }
  );
}

/** Counter animation */
export function countUp(
  target: Element,
  endValue: number,
  options?: { duration?: number; prefix?: string; suffix?: string }
) {
  const { duration = 2, prefix = "", suffix = "" } = options || {};
  const obj = { value: 0 };
  return gsap.to(obj, {
    value: endValue,
    duration,
    ease: "power1.out",
    scrollTrigger: {
      trigger: target,
      start: "top 80%",
      toggleActions: "play none none none",
    },
    onUpdate() {
      target.textContent = prefix + Math.round(obj.value) + suffix;
    },
  });
}
