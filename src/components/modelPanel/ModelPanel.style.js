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

  input {
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
