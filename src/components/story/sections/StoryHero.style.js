import styled from "styled-components";

import { badge } from "../../../theme/controls.js";

// Terminus's hero: the race's name as hero-name, then the stat row, the finish in the
// primary ink. Pulled up: the masthead is right above it.
const style = (Component) => styled(Component)`
  padding-top: clamp(2.5rem, 8vh, 4.5rem);

  /* Doubled: StorySection's own .title rule is just as specific. */
  && .title {
    max-width: 18ch;
    font-size: clamp(2.75rem, 9vw, 5.5rem);
    letter-spacing: -0.04em;
    line-height: 0.98;
    margin-bottom: 2.5rem;
  }

  [role="region"] {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    transition: opacity var(--transition-base);
  }

  [aria-busy="true"] {
    opacity: 0.6;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1.5rem clamp(1.5rem, 5vw, 3.5rem);
  }

  .stat {
    display: flex;
    flex-direction: column-reverse;
  }

  .stat dt {
    margin-top: 0.375rem;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .stat dd {
    font-family: var(--font-family-mono);
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  /* The number the page exists for, on its own line above the rest. */
  .stat.hero {
    flex-basis: 100%;
  }

  .stat.hero dd {
    font-size: clamp(3rem, 10vw, 5rem);
    letter-spacing: -0.04em;
    color: var(--color-primary-text);
  }

  .stat dd.over {
    color: var(--color-behind-text);
  }

  .badge {
    ${badge}
  }

  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem;
    max-width: 38rem;
    font-size: var(--font-size-medium);
  }
`;

export default style;
