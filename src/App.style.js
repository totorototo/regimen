import styled from "styled-components";

import { eyebrow } from "./theme/type.js";

// Waymark's page: the start (an eyebrow, a mono title, one ledger row), then the workspace,
// here the model beside the plan.
export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  outline: ${(props) => (props.$dragging ? "3px dashed var(--color-primary)" : "none")};
  outline-offset: -6px;

  main {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 0 1rem;
  }

  .start {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 40rem;
    padding: clamp(3rem, 12vh, 6rem) 0 3rem;
  }

  .start .eyebrow {
    ${eyebrow}
    margin-bottom: 1rem;
  }

  .start .title {
    font-family: var(--font-family-mono);
    font-size: clamp(2.25rem, 6vw, 3.5rem);
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.04em;
    line-height: 1;
    max-width: 16ch;
    margin-bottom: 1rem;
  }

  .start .lede {
    max-width: 42ch;
    margin-bottom: 2.5rem;
    color: var(--color-text-muted);
  }

  .start .ledger {
    width: 100%;
    max-width: 28rem;
    border-top: 1px solid var(--color-hairline);
  }

  .start .ledger-row {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    width: 100%;
    min-height: 44px;
    padding: 1rem 0;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--color-hairline);
    color: var(--color-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: color var(--transition-base);

    &:hover {
      color: var(--color-primary-text);
    }
  }

  .start .drop,
  .start .note {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--color-text-muted);
  }

  .start .drop {
    margin-top: 1.25rem;
  }

  .start .note {
    max-width: 40ch;
    margin-top: 2rem;
  }

  /* The model beside the verdict and the checkpoints; on a phone, one column with the
     verdict first (see below). */
  .workspace {
    display: grid;
    grid-template-columns: 20rem minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "model lead"
      "model checkpoints";
    gap: 2.5rem;
    padding-top: 1rem;
  }

  .workspace > .lead {
    grid-area: lead;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
  }

  .workspace > .model {
    grid-area: model;
    align-self: start;
  }

  .workspace > .checkpoints {
    grid-area: checkpoints;
  }

  /* The folded model is for a phone only. */
  .model .summary {
    display: none;
  }

  /* A phone: the model, then the plan, in the page's own scroll. */
  @media (max-width: 52em) {
    main {
      padding: 0 0.5rem;
    }

    .start {
      padding-inline: 0.5rem;
    }

    .workspace {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto;
      grid-template-areas:
        "lead"
        "model"
        "checkpoints";
      gap: 2rem;
    }

    .model {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .model .summary {
      display: flex;
    }

    .model:not(.editing) .panel {
      display: none;
    }
  }
`;
