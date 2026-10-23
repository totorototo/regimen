import styled from "styled-components";

import { badge } from "../../../theme/controls.js";

// Retrace's chart frame (chart.style.js): a readout line, an SVG stretched to the frame, HTML
// labels and dots over it. Spare time is neutral, the tight band and a missed cutoff take the
// badge tiers' colours.
const style = (Component) => styled(Component)`
  .empty {
    font-size: var(--font-size-small);
    color: var(--color-text-muted);
  }

  .lede strong {
    color: var(--color-text);
  }

  .readout {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-4);
    min-height: 2rem;
    margin-bottom: var(--space-4);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    color: var(--color-text-muted);

    b {
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }
  }

  .readout .tone.tight b {
    color: var(--color-primary-text);
  }

  .readout .tone.over b {
    color: var(--color-behind-text);
  }

  .badge {
    ${badge}
  }

  .hint {
    font-size: var(--font-size-tiny);
  }

  .plot {
    position: relative;
    touch-action: pan-y;
    cursor: crosshair;

    /* A set height, not the viewBox's ratio: on a phone the ratio left a 120px chart. */
    svg {
      display: block;
      width: 100%;
      height: clamp(11rem, 40vw, 18.75rem);
      overflow: visible;
    }

    &:focus-visible {
      outline-offset: 6px;
    }
  }

  .tight-band {
    fill: color-mix(in srgb, var(--color-primary) 14%, transparent);
  }

  .checkpoint-line {
    stroke: var(--color-hairline);
    stroke-width: 1;
    stroke-dasharray: 2 3;
    vector-effect: non-scaling-stroke;
  }

  .margin-area.spare {
    fill: color-mix(in srgb, var(--color-text) 10%, transparent);
  }

  .margin-area.over {
    fill: color-mix(in srgb, var(--color-behind) 70%, transparent);
  }

  .margin-edge {
    fill: none;
    stroke-width: 1.75;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .margin-edge.spare {
    stroke: var(--color-text);
  }

  .margin-edge.over {
    stroke: var(--color-behind);
  }

  .zero-line {
    stroke: var(--color-control-border);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .cursor-line {
    stroke: var(--color-text);
    stroke-width: 1;
    stroke-dasharray: 3 2;
    vector-effect: non-scaling-stroke;
    opacity: 0.6;
  }

  /* A cutoff: a dot on the ground's halo; tight and over in their tier, the read one larger. */
  .dot {
    position: absolute;
    width: 7px;
    height: 7px;
    margin: calc(-1 * var(--space-1)) 0 0 calc(-1 * var(--space-1));
    border-radius: var(--border-radius-full);
    background: var(--color-text);
    box-shadow: 0 0 0 2px var(--color-background);
    pointer-events: none;
    transition: transform var(--transition-fast);
  }

  .dot.tight {
    background: var(--color-primary-text);
  }

  .dot.over {
    background: var(--color-behind);
  }

  .dot.shown {
    transform: scale(1.6);
  }

  .plot-label {
    position: absolute;
    left: var(--space-1);
    transform: translateY(-120%);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  /* The cutoff's name sits under its line, clear of the tight band above it. */
  .plot-label.under {
    transform: translateY(25%);
  }

  /* A phone: the axis ticks need the room the cutoff label takes. */
  @media (max-width: 40em) {
    .plot-label.under {
      display: none;
    }
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin-top: var(--space-4);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: var(--border-radius-xs);
  }

  /* The band's own tint, edged so a 10px square of it still shows. */
  .swatch.tight {
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-primary-text);
  }

  .swatch.over {
    background: var(--color-behind);
  }

  .axis {
    position: relative;
    height: 1.25rem;
    margin-top: var(--space-2);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);

    span {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      white-space: nowrap;
    }

    span:first-child {
      transform: none;
    }
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

export default style;
