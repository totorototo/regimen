import styled from "styled-components";

import { eyebrow } from "./theme/type.js";

// Waymark's page: the start (an eyebrow, a mono title, one ledger row), then the story.
export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  outline: ${(props) => (props.$dragging ? "3px dashed var(--color-primary)" : "none")};
  outline-offset: -6px;
  /* The start page's column: the measure, centred, never closer to the edge than the gutter.
     The toolbar's masthead reads it too, so the mark sits over the eyebrow. */
  --start-inset: max(var(--gutter), (100% - var(--measure)) / 2);

  main {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 0 var(--gutter-tool);
  }

  .start {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: var(--measure);
    padding: clamp(3rem, 12vh, 6rem) 0 3rem;
  }

  .start .eyebrow {
    ${eyebrow}
    margin-bottom: 1rem;
  }

  .start .title {
    font-family: var(--font-family-mono);
    font-size: clamp(2.25rem, 6vw, 3.5rem);
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.04em;
    line-height: 1;
    max-width: 16ch;
    margin-bottom: 1rem;
  }

  .start .lede {
    max-width: 42ch;
    margin-bottom: 2.5rem;
    color: var(--color-text-muted);
  }

  .start .ledger {
    width: 100%;
    max-width: 28rem;
    border-top: 1px solid var(--color-hairline);
  }

  .start .ledger-row {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    width: 100%;
    min-height: 44px;
    padding: 1rem 0;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--color-hairline);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: color var(--transition-base);

    &:hover {
      color: var(--color-primary-text);
    }
  }

  .start .drop,
  .start .note {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .start .drop {
    margin-top: 1.25rem;
  }

  .start .note {
    max-width: 40ch;
    margin-top: 2rem;
  }

  /* The story runs edge to edge: its sections set their own gutters. */
  main {
    padding-inline: ${(props) =>
      props.$story ? "0" : props.$start ? "var(--start-inset)" : "var(--gutter-tool)"};
  }

  @media (max-width: 52em) {
    .start {
      padding-inline: 0;
    }
  }
`;
