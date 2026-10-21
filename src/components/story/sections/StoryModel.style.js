import styled from "styled-components";

import { actionButton } from "../../../theme/controls.js";

// Terminus's StoryEnd column: rows stacked full width, each in a command's outline: stepper
// rows for the numbers, a command for fueling.
const style = (Component) => styled(Component)`
  /* As wide as its longest row needs (a name, then − value +), not the whole measure: on a
     desktop a full-width row puts the name and its value too far apart to read as one. */
  .commands {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 28rem;
  }

  .group-label {
    margin-top: 0.75rem;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .group-label:first-child {
    margin-top: 0;
  }

  .action-btn {
    ${actionButton}
  }

  /* On the ground colour: the route behind the story must not run through a row. */
  .command,
  .stepper {
    background-color: var(--color-background);
  }

  .command {
    justify-content: space-between;
  }

  /* Fueling starts its own group, after the Pace hint. */
  .command.fueling {
    margin-top: 0.25rem;
  }

  /* Set: nothing to press, but the pace in use, not an unavailable command (the fueling
     command's on tint, at full strength). */
  .command.slowest:disabled {
    opacity: 1;
    cursor: default;
  }

  .command.active {
    background: color-mix(in srgb, var(--color-primary) 12%, var(--color-background));
  }

  .command-value {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
    transition: color var(--transition-base);
  }

  .command:hover .command-value,
  .command.active .command-value {
    color: inherit;
  }

  /* A stepper row: the command's outline, the name left, − value + right. */
  .stepper {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    align-items: center;
    min-height: 44px;
    padding: 0 0.25rem 0 1.25rem;
    border: 1px solid var(--color-control-border);
    border-radius: var(--border-radius-base);
  }

  .name {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
  }

  /* Bare icons on a 44px target: the row's outline is the only box. */
  .step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    background: none;
    border: 0;
    border-radius: var(--border-radius-full);
    color: var(--color-text-muted);
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    transition: color var(--transition-base);

    &:hover:not(:disabled) {
      color: var(--color-primary-text);
    }

    &:active:not(:disabled) {
      color: var(--color-text);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .value {
    min-width: 7.5rem;
    text-align: center;
    font-family: var(--font-family-mono);
    font-size: var(--font-size);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  /* A phone: a narrower value slot keeps "LifeBase stop" on one line. */
  @media (max-width: 40em) {
    .stepper {
      padding-left: 1rem;
    }

    .value {
      min-width: 6.25rem;
    }
  }

  .unit {
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
  }

  /* Two lines kept, the longest help's height at this width, so nothing below moves. */
  .hint {
    min-height: calc(2 * 1.5em);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .off {
    font-size: var(--font-size-small);
    color: var(--color-text-muted);
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
