import styled from "styled-components";

import { badge } from "../../theme/controls.js";
import { eyebrow } from "../../theme/type.js";

// Trail Suite's stat row: the finish as the hero number, then one line on the cutoffs.
const style = (Component) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: opacity var(--transition-base);

  &[aria-busy="true"] {
    opacity: 0.6;
  }

  .eyebrow {
    ${eyebrow}
  }

  .badge {
    ${badge}
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
    font-size: var(--font-size-tiny);
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

  .stat.hero dd {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    color: var(--color-primary-text);
  }

  .stat dd.over {
    color: var(--color-behind-text);
  }

  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem;
    max-width: 46rem;
  }
`;

export default style;
