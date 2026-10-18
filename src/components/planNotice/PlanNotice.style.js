import styled from "styled-components";

import { textButton } from "../../theme/controls.js";

const style = (Component) => styled(Component)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 1rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-hairline);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-small);

  &.warn {
    border-color: var(--color-accent-text);
  }

  p {
    flex: 1 1 100%;
    padding-top: 0.25rem;
  }

  .detail {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  button {
    ${textButton}
  }
`;

export default style;
