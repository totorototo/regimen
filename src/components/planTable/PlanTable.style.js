import styled from "styled-components";

import { badge, segmented } from "../../theme/controls.js";

// Trail Suite's mono capital label, as in a checkpoint's stats grid.
const dataLabel = `
  font-family: var(--font-family-mono);
  font-size: var(--font-size-tiny);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-muted);
`;

// A quiet panel under a row: the text at 3% on the ground, as Terminus's stats grid.
const well = `
  padding: 0.75rem;
  border-radius: var(--border-radius-md);
  background: color-mix(in srgb, var(--color-text) 3%, transparent);
`;

const style = (Component) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  transition: opacity var(--transition-base);

  /* Recomputing: the old plan stays, dimmed, rather than flashing empty per keystroke. */
  &[aria-busy="true"] {
    opacity: 0.6;
  }

  .badge {
    ${badge}
  }

  dd.over {
    color: var(--color-behind-text);
  }

  .note {
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .checkpoints-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    margin-bottom: 0.25rem;
  }

  .checkpoints-head h3 {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-large);
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.02em;
  }

  ol {
    list-style: none;
  }

  /* Trail Suite's checkpoint row: name and distance left, time and badge right, then the
     figures underneath. */
  .checkpoint {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-hairline);
  }

  .checkpoint:last-child {
    border-bottom: 0;
  }

  .top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }

  .name {
    font-size: var(--font-size);
    font-weight: var(--font-weight-bold);
  }

  .meta {
    margin-top: 0.25rem;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    color: var(--color-text-muted);
  }

  .eta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    white-space: nowrap;
  }

  .time {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-medium);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .under {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .grid {
    ${well}
    flex: 1 1 15rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.625rem 1.5rem;
  }

  .grid div {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.125rem;
  }

  .grid dt,
  .label {
    ${dataLabel}
  }

  .grid dd,
  .carry .value {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .fuel {
    ${well}
    flex: 2 1 22rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem 1.25rem;
  }

  .refill {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.625rem;
  }

  .refill .note {
    flex-basis: 100%;
  }

  .switch {
    ${segmented}
  }

  /* A refill the runner chose over the course's default: Trail Suite's selected border. */
  .switch.changed {
    border-color: var(--color-primary);
  }

  .carry {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .error {
    color: var(--color-behind-text);
  }

  /* A phone: the time under the badge, the fueling under the figures. */
  @media (max-width: 40em) {
    .eta {
      flex-direction: column-reverse;
      align-items: flex-end;
      gap: 0.375rem;
    }

    .fuel {
      flex-direction: column;
      align-items: stretch;
    }

    .refill {
      justify-content: space-between;
    }
  }
`;

export default style;
