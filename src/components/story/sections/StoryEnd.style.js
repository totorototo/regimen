import styled from "styled-components";

import { actionButton } from "../../../theme/controls.js";

// Terminus's StoryEnd: a column of commands, the main one filled, a confirm row in place of
// a command that destroys.
const style = (Component) => styled(Component)`
  padding-bottom: clamp(5rem, 16vh, 8rem);

  /* The model's column width: the page's two command columns read as one component. */
  .actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    max-width: 28rem;
  }

  .action-btn {
    ${actionButton}
  }

  .action-btn.primary {
    background: var(--color-button-primary);
    border-color: var(--color-button-primary);
    color: var(--color-on-button-primary);

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--color-button-primary) 85%, var(--color-text));
      border-color: var(--color-button-primary);
      color: var(--color-on-button-primary);
    }
  }

  .export-error {
    font-size: var(--font-size-small);
    color: var(--color-behind-text);
  }

  .confirm-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
  }

  .confirm-row span {
    flex: 1 1 14rem;
  }

  .confirm-btn {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0.5rem 0.875rem;
    background: none;
    border: 1px solid var(--color-control-border);
    border-radius: var(--border-radius-base);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    cursor: pointer;
  }

  .confirm-btn.danger {
    border-color: var(--color-accent-text);
    color: var(--color-accent-text);
  }
`;

export default style;
