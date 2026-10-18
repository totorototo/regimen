import styled from "styled-components";

import { field, segmented, textButton } from "../../theme/controls.js";
import { eyebrow } from "../../theme/type.js";

const style = (Component) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .eyebrow {
    ${eyebrow}
  }

  /* A card in dark is 1.1:1 from the ground: the hairline is what separates it. */
  .card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-hairline);
    border-radius: var(--border-radius-md);
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .switch {
    ${segmented}
  }

  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 0.75rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 0;
  }

  label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .input {
    position: relative;
  }

  input {
    ${field}
    width: 100%;
    padding-right: 3.75rem;
    font-family: var(--font-family-mono);
    font-variant-numeric: tabular-nums;
  }

  .unit {
    position: absolute;
    top: 50%;
    right: 0.625rem;
    transform: translateY(-50%);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .help {
    display: none;
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .field:focus-within .help,
  .help.error {
    display: block;
  }

  .help.error {
    color: var(--color-behind-text);
  }

  .off {
    font-size: var(--font-size-small);
    color: var(--color-text-muted);
  }

  .totals {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-hairline);
  }

  .totals dl {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
  }

  /* Trail Suite's small stat: the value over its label. */
  .totals dl div {
    display: flex;
    flex-direction: column-reverse;
  }

  .totals dt {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .totals dd {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-medium);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .reset {
    ${textButton}
    align-self: flex-start;
    font-size: var(--font-size-small);
  }
`;

export default style;
