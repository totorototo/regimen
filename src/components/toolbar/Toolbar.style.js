import styled from "styled-components";

import { chip, chipPrimary } from "../../theme/controls.js";
import { wordmark } from "../../theme/type.js";

// Waymark's masthead: the mark and name, then the files, then the main action.
const style = (Component) => styled(Component)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: calc(90rem + 2 * var(--gutter));
  margin: 0 auto;
  /* Clear of the theme toggle fixed in the top-right corner. */
  padding: 1rem calc(1.25rem + 44px + 1rem) 1rem var(--gutter);
  border-bottom: 1px solid var(--color-hairline);

  button {
    ${chip}
  }

  button.export {
    ${chipPrimary}
    margin-left: auto;
  }

  .brand {
    ${wordmark}
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-height: 44px;
    margin-right: 0.5rem;
  }

  /* The sachet starts 14 of the mark's 64 in: pulled back to line up with the text below. */
  .mark {
    flex: none;
    width: 44px;
    height: 44px;
    margin-left: calc(-44px * 14 / 64);
  }

  /* One ink, as the favicon's: dark's primary is its gold, light's its blue. */
  .mark path {
    fill: var(--color-primary);
  }

  .brand-dim {
    color: var(--color-text-muted);
  }

  /* The open course, named once, beside the two files it can be swapped for. */
  .file {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 18rem;
    margin-left: 0.5rem;
    padding-left: 1.25rem;
    border-left: 1px solid var(--color-hairline);
    font-family: var(--font-family-mono);
  }

  .file-label {
    font-size: var(--font-size-tiny);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
  }

  .export-error {
    flex-basis: 100%;
    font-size: var(--font-size-tiny);
    color: var(--color-behind-text);
  }

  @media (max-width: 52em) {
    gap: 0.5rem;
    padding-right: calc(var(--gutter) + 44px + 0.5rem);

    .brand {
      flex-basis: 100%;
    }

    .file {
      order: -1;
      flex-basis: 100%;
      max-width: none;
      margin-left: 0;
      padding-left: 0;
      border-left: 0;
    }
  }

  /* A phone: one row, the brand and Export. The course's name is the story's title right
     under it, and Open GPX / Open plan wait in the story's last section.
     why: three rows of masthead pushed the finish time past the middle of the first screen. */
  @media (max-width: 40em) {
    min-height: 76px;

    .brand {
      flex-basis: auto;
      margin-right: 0;
    }

    .file,
    button:not(.export) {
      display: none;
    }

    button.export {
      margin-left: auto;
      padding-inline: 0.875rem;
    }

    /* "Export" alone fits beside the brand and the theme toggle. */
    .export-file {
      display: none;
    }
  }
`;

export default style;
