import styled from "styled-components";

import { field } from "../../theme/controls.js";
import { eyebrow } from "../../theme/type.js";

const style = (Component) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  transition: opacity var(--transition-base);

  /* Recomputing: the old plan stays, dimmed, rather than flashing empty per keystroke. */
  &[aria-busy="true"] {
    opacity: 0.6;
  }

  .eyebrow {
    ${eyebrow}
  }

  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 2rem;
  }

  .summary dt {
    ${eyebrow}
  }

  .summary dd {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-large);
    font-weight: var(--font-weight-bold);
  }

  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-small);
    font-variant-numeric: tabular-nums;
  }

  th,
  td {
    padding: 0.625rem 0.75rem 0.625rem 0;
    border-bottom: 1px solid var(--color-hairline);
    text-align: right;
    white-space: nowrap;
  }

  thead th {
    ${eyebrow}
  }

  th:first-child {
    text-align: left;
    white-space: normal;
  }

  tbody th {
    font-weight: var(--font-weight-bold);
  }

  .type {
    display: block;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-regular);
    color: var(--color-text-muted);
  }

  .refill select {
    ${field}
    font-family: var(--font-family-mono);
  }

  /* A refill the runner chose over the course's default. */
  .refill select.changed {
    border-color: var(--color-primary);
    color: var(--color-primary-text);
    font-weight: var(--font-weight-bold);
  }

  .carry,
  .margin {
    font-family: var(--font-family-mono);
  }

  /* Behind and ahead of the plan, in the suite's semantic inks, never the raw tokens. */
  .tight {
    color: var(--color-secondary-text);
  }

  .over {
    color: var(--color-behind-text);
    font-weight: var(--font-weight-bold);
  }

  .error {
    color: var(--color-behind-text);
  }

  /* A phone: tighter cells, so the margin, the column that matters most, stays on screen. */
  @media (max-width: 52em) {
    th,
    td {
      padding-right: 0.5rem;
    }

    thead th {
      letter-spacing: 0.08em;
    }
  }
`;

export default style;
