import styled from "styled-components";

// Trail Suite's stat row, the summary size: values in color-text.
const style = (Component) => styled(Component)`
  .totals {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
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
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1;
  }
`;

export default style;
