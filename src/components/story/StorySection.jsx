import { memo } from "react";

import { useRevealOnScroll } from "../../hooks/useRevealOnScroll.js";
import style from "./StorySection.style.js";

// Retrace's, copied from Terminus. The reveal (fade + rise, once) is a CSS transition here
// instead of a react-spring spring: a one-shot tween needs no physics, nor the dependency.
// `instant` skips it: the hero is on screen at load, and a fade there only delays the
// finish time.
const StorySection = memo(function StorySection({
  className,
  eyebrow,
  title,
  titleAs,
  instant,
  children,
}) {
  const [ref, revealed] = useRevealOnScroll();

  return (
    <section ref={ref} className={className}>
      <div className={revealed || instant ? "section-inner revealed" : "section-inner"}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <TitleTag title={title} tag={titleAs} />}
        <div className="body">{children}</div>
      </div>
    </section>
  );
});

// The hero's title is the page's h1; every other section's is an h2.
// why `titleAs`, not `as`: styled-components takes `as` to swap the section's own element.
function TitleTag({ title, tag: Tag = "h2" }) {
  return <Tag className="title">{title}</Tag>;
}

export default style(StorySection);
