import styled from "styled-components";

import { chip, chipPrimary } from "../../theme/controls.js";
import { wordmark } from "../../theme/type.js";

// Waymark's masthead: the mark and name, then the files, then the main action.
const style = (Component) => styled(Component)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  /* Clear of the theme toggle fixed in the top-right corner. */
  padding: 1rem calc(1.25rem + 44px + 1rem) 1rem 1rem;

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

  .file {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
  }

  .error {
    flex-basis: 100%;
    font-size: var(--font-size-tiny);
    color: var(--color-behind-text);
  }

  @media (max-width: 52em) {
    gap: 0.5rem;
    padding-right: calc(1rem + 44px + 0.5rem);

    .brand {
      flex-basis: 100%;
    }

    .file {
      order: 1;
      flex-basis: 100%;
    }
  }

  /* A phone: the two files side by side, the main action full width under them. */
  @media (max-width: 40em) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    /* Only the brand's row meets the fixed theme toggle: the chips take the full width. */
    padding-right: 1rem;

    .brand,
    .file,
    button.export,
    .error {
      grid-column: 1 / -1;
    }

    .brand {
      order: -2;
    }

    .file {
      order: -1;
      color: var(--color-text-muted);
    }

    button.export {
      order: 1;
      margin-left: 0;
    }

    .error {
      order: 2;
    }
  }
`;

export default style;
