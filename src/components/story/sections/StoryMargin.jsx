import { memo, useEffect, useId, useRef, useState } from "react";

import {
  cutoffMargin,
  MARGIN_TIGHT_S,
  marginScale,
  marginTier,
  TIER_WORDS,
} from "../../../plan/summary.js";
import useStore from "../../../store/store.js";
import { formatMargin } from "../../../utils/format.js";
import StorySection from "../StorySection.jsx";
import style from "./StoryMargin.style.js";

const WIDTH = 300;
const HEIGHT = 110;
const VPAD = 6;

// The cutoffs the plan meets, with their margin, in race order. The start is not a cutoff.
export function cutoffBars(plan) {
  return plan.entries
    .map((entry, index) => ({ entry, margin_s: cutoffMargin(entry, index) }))
    .filter(({ margin_s }) => Number.isFinite(margin_s))
    .map(({ entry, margin_s }) => ({
      name: entry.name,
      distance_m: entry.distance_m,
      margin_s,
      tier: marginTier(margin_s),
    }));
}

// Round km ticks along the course: 4 to 6 of them, at 5, 10, 20, 25 or 50 km.
export function kmTicks(length_m) {
  const km = length_m / 1000;
  const step = [5, 10, 20, 25, 50, 100].find((candidate) => km / candidate <= 6) ?? 100;
  const ticks = [];
  for (let tick = 0; tick <= km; tick += step) ticks.push(tick);
  return ticks;
}

const reading = (cutoff) =>
  cutoff.margin_s < 0
    ? `over by ${formatMargin(-cutoff.margin_s)}`
    : `${formatMargin(cutoff.margin_s)} to spare`;

// The index of the cutoff nearest the pointer along the course: the whole plot is the
// target, not a 7px dot.
function nearest(event, cutoffs, length) {
  const rect = event.currentTarget.getBoundingClientRect();
  const distance_m = ((event.clientX - rect.left) / (rect.width || 1)) * length;
  let best = 0;
  cutoffs.forEach((cutoff, index) => {
    if (
      Math.abs(cutoff.distance_m - distance_m) < Math.abs(cutoffs[best].distance_m - distance_m)
    ) {
      best = index;
    }
  });
  return best;
}

const KEY_STEPS = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };

// The margin along the course, as Retrace draws the gap to the plan: one line joining the
// cutoffs over its area, the cutoff itself the zero line, the hour under it banded as
// tight, a missed cutoff below it in the behind tone. A cursor reads one cutoff out: hover
// with a mouse, a tap on touch, the arrow keys from the keyboard.
// why a chart here: the question is where the race gets tight, and that is a shape along
// the course, which a list of numbers hides.
function StoryMargin({ className }) {
  const plan = useStore((state) => state.plan);
  const clipId = useId();
  const plotRef = useRef(null);
  // Hovered with a mouse; pinned by a tap or the arrow keys, until a tap elsewhere or Escape.
  // why pinned on touch: a finger lifting fires pointerleave at once, so a hover reading
  // would vanish the moment it appeared.
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);

  useEffect(() => {
    if (pinned === null) return;
    const onDown = (event) => {
      if (!plotRef.current?.contains(event.target)) setPinned(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pinned]);

  if (!plan) return null;

  const cutoffs = cutoffBars(plan);
  if (cutoffs.length === 0) {
    return (
      <StorySection className={className} eyebrow="The margin" title="Where it gets tight">
        <p className="empty">No cutoffs on this course.</p>
      </StorySection>
    );
  }

  const length = plan.course.distance_m || 1;
  const { over_s, spare_s } = marginScale(plan.entries);
  const top = Math.max(spare_s, MARGIN_TIGHT_S) * 1.1;
  const bottom = over_s > 0 ? -over_s * 1.1 : -top * 0.06;
  const x = (distance_m) => (distance_m / length) * WIDTH;
  const y = (margin_s) => ((top - margin_s) / (top - bottom)) * HEIGHT;
  const zeroY = y(0);
  const tightY = y(MARGIN_TIGHT_S);

  // From the first cutoff to the last: the margin is only known at a cutoff.
  const line = cutoffs.map((c, i) => `${i ? "L" : "M"}${x(c.distance_m)},${y(c.margin_s)}`);
  const first = cutoffs[0];
  const last = cutoffs.at(-1);
  const area =
    `M${x(first.distance_m)},${zeroY}L` +
    line.join("").slice(1) +
    `L${x(last.distance_m)},${zeroY}Z`;

  const tightest = cutoffs.reduce((a, b) => (b.margin_s < a.margin_s ? b : a));
  const index = pinned ?? hovered;
  const shown = (index !== null && cutoffs[index]) || tightest;

  const onKeyDown = (event) => {
    if (event.key === "Escape") return setPinned(null);
    const from = index ?? cutoffs.indexOf(tightest);
    let next = null;
    if (KEY_STEPS[event.key]) next = from + KEY_STEPS[event.key];
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = cutoffs.length - 1;
    if (next === null) return;
    event.preventDefault();
    setPinned(Math.min(cutoffs.length - 1, Math.max(0, next)));
  };
  const pct = (value, of) => `${(value / of) * 100}%`;

  return (
    <StorySection className={className} eyebrow="The margin" title="Where it gets tight">
      <p className="lede">
        Time to spare at each cutoff, after the stop. Inside the band is <strong>tight</strong>,
        under an hour; below the cutoff line is <strong>over</strong>.
      </p>
      <figure className="chart-frame">
        <p className="readout" aria-live="polite">
          <span>
            <b>{shown.name}</b>
          </span>
          <span>
            km <b>{(shown.distance_m / 1000).toFixed(1)}</b>
          </span>
          <span className={`tone ${shown.tier}`}>
            <b>{reading(shown)}</b>
          </span>
          {shown.tier !== "ok" && (
            <span className={`badge ${shown.tier}`}>{TIER_WORDS[shown.tier]}</span>
          )}
          {index === null && <span className="hint">the tightest</span>}
        </p>
        <div
          ref={plotRef}
          className="plot"
          role="slider"
          tabIndex={0}
          aria-label="Margin at each cutoff"
          aria-valuemin={1}
          aria-valuemax={cutoffs.length}
          aria-valuenow={cutoffs.indexOf(shown) + 1}
          aria-valuetext={`${shown.name}, ${reading(shown)}`}
          onKeyDown={onKeyDown}
          onPointerMove={(event) => {
            if (event.pointerType === "mouse") setHovered(nearest(event, cutoffs, length));
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setHovered(null);
          }}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse") return;
            const hit = nearest(event, cutoffs, length);
            setPinned((current) => (current === hit ? null : hit));
          }}
        >
          <svg
            viewBox={`0 -${VPAD} ${WIDTH} ${HEIGHT + VPAD * 2}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={`${clipId}-spare`}>
                <rect x={0} y={-VPAD} width={WIDTH} height={zeroY + VPAD} />
              </clipPath>
              <clipPath id={`${clipId}-over`}>
                <rect x={0} y={zeroY} width={WIDTH} height={HEIGHT - zeroY + VPAD} />
              </clipPath>
            </defs>
            <rect className="tight-band" x={0} y={tightY} width={WIDTH} height={zeroY - tightY} />
            {cutoffs.map((cutoff) => (
              <line
                key={`${cutoff.name}-${cutoff.distance_m}`}
                className="checkpoint-line"
                x1={x(cutoff.distance_m)}
                x2={x(cutoff.distance_m)}
                y1={-VPAD}
                y2={HEIGHT + VPAD}
              />
            ))}
            <path className="margin-area spare" d={area} clipPath={`url(#${clipId}-spare)`} />
            <path className="margin-area over" d={area} clipPath={`url(#${clipId}-over)`} />
            <path
              className="margin-edge spare"
              d={line.join("")}
              clipPath={`url(#${clipId}-spare)`}
            />
            <path
              className="margin-edge over"
              d={line.join("")}
              clipPath={`url(#${clipId}-over)`}
            />
            <line className="zero-line" x1={0} x2={WIDTH} y1={zeroY} y2={zeroY} />
            <line
              className="cursor-line"
              x1={x(shown.distance_m)}
              x2={x(shown.distance_m)}
              y1={-VPAD}
              y2={HEIGHT + VPAD}
            />
          </svg>
          {/* HTML, not SVG: a circle in the stretched viewBox would draw as an ellipse. */}
          {cutoffs.map((cutoff) => (
            <span
              key={`${cutoff.name}-${cutoff.distance_m}`}
              className={`dot ${cutoff.tier}${cutoff === shown ? " shown" : ""}`}
              style={{
                left: pct(x(cutoff.distance_m), WIDTH),
                top: pct(y(cutoff.margin_s) + VPAD, HEIGHT + VPAD * 2),
              }}
            />
          ))}
          <span className="plot-label under" style={{ top: pct(zeroY + VPAD, HEIGHT + VPAD * 2) }}>
            cutoff
          </span>
        </div>
        <div className="axis" aria-hidden="true">
          {kmTicks(length).map((tick) => (
            <span key={tick} style={{ left: pct(tick * 1000, length) }}>
              {tick} km
            </span>
          ))}
        </div>
        <div className="legend" aria-hidden="true">
          <span className="legend-item">
            <span className="swatch tight" /> tight, under 1h
          </span>
          {over_s > 0 && (
            <span className="legend-item">
              <span className="swatch over" /> over
            </span>
          )}
          <span className="legend-item">top of the chart: {formatMargin(top / 1.1)} to spare</span>
        </div>
        <figcaption className="visually-hidden">
          {cutoffs.map((cutoff) => `${cutoff.name}, ${reading(cutoff)}`).join(". ")}.
        </figcaption>
      </figure>
    </StorySection>
  );
}

export default memo(style(StoryMargin));
