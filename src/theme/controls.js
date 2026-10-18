import { css } from "styled-components";

// The suite's controls, as style fragments, copied from Waymark: each panel's *.style.js
// applies them to its own class names.
// why fragments, not a <Button>: the markup stays plain buttons and inputs, so the tests'
// roles and the e2e selectors don't move, and one rule still sets every button.

// Terminus's outlined button: mono, bold, 44px tall, rounded, the primary colour on hover.
export const chip = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 44px;
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid var(--color-control-border);
  border-radius: var(--border-radius-base);
  color: var(--color-text);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-base);

  &:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
    color: var(--color-primary-text);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// The one main action on screen (Export, or Open on the empty page): filled.
export const chipPrimary = css`
  ${chip}
  background: var(--color-button-primary);
  border-color: var(--color-button-primary);
  color: var(--color-on-button-primary);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-button-primary) 85%, var(--color-text));
    border-color: var(--color-button-primary);
    color: var(--color-on-button-primary);
  }
`;

// A quiet action inside text (Dismiss, Use its model): underlined, but still a 44px target.
export const textButton = css`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  background: none;
  border: 0;
  color: var(--color-primary-text);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
`;

// Inputs: lighter than the cards, 44px tall. Terminus's corner.
export const field = css`
  min-height: 44px;
  padding: 0.375rem 0.625rem;
  background: var(--color-field);
  border: 1px solid var(--color-field-border);
  border-radius: var(--border-radius-sm);
  color: var(--color-text);
  font-family: var(--font-family-sansSerif);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  line-height: inherit;
  letter-spacing: normal;
  text-transform: none;

  &[aria-invalid="true"] {
    border-color: var(--color-behind-text);
  }
`;
