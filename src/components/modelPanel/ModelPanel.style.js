import styled from "styled-components";

import { field, textButton } from "../../theme/controls.js";
import { eyebrow } from "../../theme/type.js";

const style = (Component) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .eyebrow {
    ${eyebrow}
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
    margin: 0;
    padding: 1.25rem 0 0;
    border: 0;
    border-top: 1px solid var(--color-hairline);
  }

  /* A legend ignores the fieldset's flex gap: the toggle below it takes the space instead. */
  .group legend {
    float: left;
    width: 100%;
    padding: 0;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-height: 44px;
    font-family: var(--font-family-sansSerif);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
  }

  .toggle input {
    width: 1.125rem;
    height: 1.125rem;
    margin: 0;
    accent-color: var(--color-primary);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
  }

  .unit {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-regular);
  }

  input[type="text"] {
    ${field}
    width: 100%;
    font-variant-numeric: tabular-nums;
  }

  .help {
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .help.error {
    color: var(--color-behind-text);
  }

  .reset {
    ${textButton}
    align-self: flex-start;
    font-size: var(--font-size-small);
  }
`;

export default style;
