import styled from "styled-components";

// Retrace's Story style: the contour stretched behind the whole column, the sections above.
const style = (Component) => styled(Component)`
  position: relative;
  width: 100%;

  .story-contour {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* The brand book's route behind the story: color-secondary at 16%. */
  .contour-line {
    stroke: var(--color-secondary);
    stroke-width: 0.5vw;
    vector-effect: non-scaling-stroke;
    opacity: 0.16;
  }

  .story-content {
    position: relative;
    z-index: 1;
  }
`;

export default style;
