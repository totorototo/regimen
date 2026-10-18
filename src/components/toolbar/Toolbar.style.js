import styled from "styled-components";

import { chip, chipPrimary } from "../../theme/controls.js";
import { wordmark } from "../../theme/type.js";

// Waymark's masthead, without the mark: the name, then the files, then the main action.
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
    min-height: 44px;
    margin-right: 0.5rem;
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
`;

export default style;
