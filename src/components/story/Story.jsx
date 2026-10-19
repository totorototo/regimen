import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import useStore from "../../store/store.js";
import StoryCheckpoints from "./sections/StoryCheckpoints.jsx";
import StoryEnd from "./sections/StoryEnd.jsx";
import StoryFueling from "./sections/StoryFueling.jsx";
import StoryHero from "./sections/StoryHero.jsx";
import StoryMargin from "./sections/StoryMargin.jsx";
import StoryModel from "./sections/StoryModel.jsx";
import style from "./Story.style.js";
import StoryDotNav from "./StoryDotNav.jsx";

const CONTOUR_WIDTH = 200;
const CONTOUR_HEIGHT = 1000;

// The plan as Terminus's and Retrace's story: one column of sections, start to finish. The
// model sits right under the verdict it produces; fueling has its section only while on.
export function storySections(fueling) {
  return [
    { id: "hero", label: "Overview", Component: StoryHero },
    { id: "model", label: "Model", Component: StoryModel },
    { id: "margin", label: "Margin", Component: StoryMargin },
    { id: "checkpoints", label: "Checkpoints", Component: StoryCheckpoints },
    ...(fueling ? [{ id: "fueling", label: "Fueling", Component: StoryFueling }] : []),
    { id: "end", label: "Export", Component: StoryEnd },
  ];
}

// The route behind the story, as Terminus draws it: the course's real elevation, rotated so
// distance runs down the page and elevation across. Scrolling down is walking the race.
// why a hand-built path, not d3-shape: 400 evenly spaced samples need no smoothing, and the
// page has no other use for d3.
export function contourPath(profile) {
  if (profile.length < 2) return null;
  const elevations = profile.map((point) => point.elevation_m);
  const low = Math.min(...elevations);
  const range = Math.max(...elevations) - low || 1;
  const length = profile.at(-1).distance_m || 1;
  const x = (elevation_m) =>
    CONTOUR_WIDTH * 0.15 + ((elevation_m - low) / range) * CONTOUR_WIDTH * 0.7;
  const y = (distance_m) => (distance_m / length) * CONTOUR_HEIGHT;
  return profile
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${x(point.elevation_m).toFixed(1)},${y(point.distance_m).toFixed(1)}`;
    })
    .join("");
}

const Story = memo(function Story({ className }) {
  const profile = useStore((state) => state.profile);
  const fueling = useStore((state) => state.plan?.model.fueling ?? null);
  const sections = useMemo(() => storySections(Boolean(fueling)), [fueling]);
  const contour = useMemo(() => contourPath(profile), [profile]);
  const sectionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const jumpToIndex = (index) => {
    // why: the global reduced-motion rule only reaches CSS; a JS smooth scroll checks the
    // preference itself.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    sectionRefs.current[index]?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  // A thin band near the top of the viewport decides the current section, and the topmost
  // section crossing it wins (Terminus's why-comments explain both).
  useEffect(() => {
    // Fueling off drops a section: forget its element.
    sectionRefs.current.length = sections.length;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        const index = sectionRefs.current.indexOf(topmost.target);
        if (index !== -1) setActiveIndex(index);
      },
      { rootMargin: "-15% 0px -80% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      {createPortal(
        <StoryDotNav sections={sections} activeIndex={activeIndex} onJump={jumpToIndex} />,
        document.body,
      )}
      <div className={className} data-testid="story">
        {contour && (
          <svg
            className="story-contour"
            viewBox={`0 0 ${CONTOUR_WIDTH} ${CONTOUR_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={contour} className="contour-line" fill="none" />
          </svg>
        )}
        <div className="story-content">
          {sections.map(({ id, Component }, index) => (
            <div
              key={id}
              id={`story-${id}`}
              ref={(element) => {
                sectionRefs.current[index] = element;
              }}
            >
              <Component />
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

export default style(Story);
