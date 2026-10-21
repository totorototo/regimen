import styled from "styled-components";

import { badge } from "../../../theme/controls.js";

// Terminus's StoryCheckpoints rows: hairline-ruled, name left and time right, the figures
// under them in mono.
const style = (Component) => styled(Component)`
  /* Terminus's CollapseToggle: a dashed row, solid on hover. */
  .collapse {
    display: block;
    width: 100%;
    min-height: 44px;
    margin-top: 1.5rem;
    background: var(--color-background);
    border: 1px dashed var(--color-control-border);
    border-radius: var(--border-radius-base);
    color: var(--color-text-muted);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all var(--transition-base);

    &:hover {
      border-style: solid;
      color: var(--color-text);
    }
  }

  .error {
    color: var(--color-behind-text);
  }

  ol {
    list-style: none;
    border-top: 1px solid var(--color-hairline);
    transition: opacity var(--transition-base);
  }

  /* Recomputing: the old plan stays, dimmed, rather than flashing empty per keystroke. */
  ol[aria-busy="true"] {
    opacity: 0.6;
  }

  /* On the ground colour: the route behind the story must not run through the rows. */
  .checkpoint {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--color-hairline);
    background: var(--color-background);
  }

  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .name {
    font-size: var(--font-size-medium);
    font-weight: var(--font-weight-bold);
    line-height: 1.3;
  }

  .km {
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
    font-size: var(--font-size-large);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .elapsed {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .closes {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
  }

  .badge {
    ${badge}
  }

  .margin {
    font-family: var(--font-family-mono);
    font-size: var(--font-size);
    font-weight: var(--font-weight-bold);
  }

  .tight .margin {
    color: var(--color-primary-text);
  }

  .margin.over {
    color: var(--color-behind-text);
  }

  .margin.none {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
  }

  .leg {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    color: var(--color-text-muted);
  }

  /* A swatch, as the suite's chart legends draw one: the leg's effort step. */
  .effort {
    flex: none;
    width: 4px;
    height: 1rem;
    border-radius: var(--border-radius-xs);
  }

  .effort-1 {
    background: var(--color-effort-1);
  }
  .effort-2 {
    background: var(--color-effort-2);
  }
  .effort-3 {
    background: var(--color-effort-3);
  }
  .effort-4 {
    background: var(--color-effort-4);
  }
  .effort-5 {
    background: var(--color-effort-5);
  }

  .refill {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 1rem;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
  }

  .refill-label {
    font-size: var(--font-size-tiny);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .supplies {
    display: flex;
    gap: 0.25rem;
  }

  /* Bare words on a 44px target; the chosen one in full ink, underlined. */
  .supply {
    min-height: 44px;
    padding: 0 0.5rem;
    background: none;
    border: 0;
    color: var(--color-text-muted);
    font: inherit;
    text-decoration: none;
    text-underline-offset: 0.35em;
    text-decoration-thickness: 2px;
    cursor: pointer;
    transition: color var(--transition-base);

    &:hover {
      color: var(--color-primary-text);
    }

    &[aria-pressed="true"] {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
      text-decoration-line: underline;
    }
  }

  .was {
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .carry {
    font-weight: var(--font-weight-bold);
  }
`;

export default style;
