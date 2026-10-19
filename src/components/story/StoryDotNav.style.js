import styled from "styled-components";

// Retrace's StoryDotNav style (Terminus's, on the CSS custom properties). Its why-comments explain the
// narrow, tall targets and touch-action: none.
const style = (Component) => styled(Component)`
  position: fixed;
  top: 50%;
  right: calc(env(safe-area-inset-right, 0px) + 2px);
  transform: translateY(-50%);
  z-index: var(--z-index-overlay);
  display: flex;
  flex-direction: column;
  align-items: center;
  touch-action: none;

  .callout {
    position: absolute;
    right: 100%;
    margin-right: 10px;
    transform: translateY(-50%);
    white-space: nowrap;
    padding: 0.4rem 0.7rem;
    border-radius: var(--border-radius-base);
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
    border: 1px solid var(--color-control-border);
    backdrop-filter: blur(8px);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    pointer-events: none;
  }

  &::before {
    content: "";
    position: absolute;
    top: 13px;
    bottom: 13px;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--color-secondary) 20%, transparent);
    z-index: -1;
  }

  .dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 26px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;

    &::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-text-faint);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-background) 65%, transparent);
      transition: all var(--transition-base);
    }

    &.active::before {
      width: 7px;
      height: 7px;
      background: var(--color-accent);
      box-shadow:
        0 0 0 3px color-mix(in srgb, var(--color-background) 65%, transparent),
        0 0 8px color-mix(in srgb, var(--color-accent) 70%, transparent);
    }

    &:hover::before {
      background: var(--color-text);
    }
  }
`;

export default style;
