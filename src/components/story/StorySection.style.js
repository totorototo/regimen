import styled from "styled-components";

// Retrace's section shell: the measure, the block padding and the gutters of the brand book.
const style = (Component) => styled(Component)`
  display: block;
  width: 100%;
  padding: var(--section-block) var(--gutter);
  position: relative;

  .section-inner {
    max-width: var(--measure);
    margin: 0 auto;
    opacity: 0;
    transform: translateY(28px);
    transition:
      opacity 0.6s ease,
      transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);

    &.revealed {
      opacity: 1;
      transform: none;
    }
  }

  .eyebrow {
    display: block;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
  }

  .title {
    font-family: var(--font-family-mono);
    font-size: clamp(2.25rem, 6vw, 3.5rem);
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--color-text);
    margin: 0 0 var(--space-8);
  }

  .body {
    font-family: var(--font-family-sansSerif);
  }

  /* Shared by the sections' charts. */
  .lede {
    font-size: var(--font-size-medium);
    color: var(--color-text-muted);
    max-width: 38ch;
    margin: 0 0 var(--space-10);

    strong {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }
  }

  /* On the ground colour: the route behind the story must not run through a chart. */
  .chart-frame {
    background: var(--color-background);
    padding: var(--space-6);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--color-hairline);
  }

  /* Phones: less air around each section and inside the frames, so the charts keep the
     width. The padding-right below, not the gutter, keeps the frames clear of the dot nav. */
  @media (max-width: 40em) {
    padding-block: var(--space-12);
    /* Clear of the dot nav fixed on the right edge (18px wide): the frames stop short of it.
       why space-8, not the 36px rounded up: 40px wraps the hero's three stats to two lines. */
    padding-right: var(--space-8);

    .chart-frame {
      padding: var(--space-4);
      border-radius: var(--border-radius-md);
    }
  }
`;

export default style;
