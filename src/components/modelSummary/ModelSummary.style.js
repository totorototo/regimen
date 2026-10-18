import styled from "styled-components";

import { chip } from "../../theme/controls.js";
import { eyebrow } from "../../theme/type.js";

const style = (Component) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  border-radius: var(--border-radius-md);

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .eyebrow {
    ${eyebrow}
  }

  button {
    ${chip}
    min-width: 5.5rem;
  }

  .line {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-variant-numeric: tabular-nums;
  }
`;

export default style;
