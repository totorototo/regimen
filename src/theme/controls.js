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

// Terminus's section command (StoryEnd's .action-btn): a full-width outlined row, icon and
// words left, stacked in a column of commands. `.active` for a command that is on, `.danger`
// for one that destroys.
export const actionButton = css`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.625rem;
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 1.25rem;
  background: none;
  border: 1px solid var(--color-control-border);
  border-radius: var(--border-radius-base);
  color: var(--color-text);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  text-align: left;
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

  &.active {
    border-color: color-mix(in srgb, var(--color-primary) 60%, transparent);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary-text);
  }

  &.danger:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
    color: var(--color-accent-text);
  }

  svg {
    flex: none;
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

// Trail Suite's status badge: a mono pill naming the margin to a cutoff. Outlined, no fill:
// the word and its border share the tier's text colour.
export const badge = css`
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem 0.5rem;
  border: 1px solid currentColor;
  border-radius: var(--border-radius-lg);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-tiny);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;

  &.ok {
    color: var(--color-success-text);
  }

  &.tight {
    color: var(--color-primary-text);
  }

  &.over {
    color: var(--color-behind-text);
  }
`;
