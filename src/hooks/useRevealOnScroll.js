import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the returned ref's element first enters the viewport.
 * Used to trigger the story's fade-in-on-scroll sections.
 */
// why a margin, not Retrace's threshold of 0.15: a long race's checkpoints section is many
// screens tall, and 15% of it may never be on screen at once; it would never reveal.
export function useRevealOnScroll() {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return [ref, revealed];
}
