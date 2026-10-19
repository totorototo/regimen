import { memo } from "react";

import { cutoffMargin, marginTier, TIER_WORDS, verdict } from "../../../plan/summary.js";
import useStore from "../../../store/store.js";
import { formatDuration, formatKm } from "../../../utils/format.js";
import PlanNotice from "../../planNotice/PlanNotice.jsx";
import StorySection from "../StorySection.jsx";
import style from "./StoryHero.style.js";

// What the runner asks first: when they finish, and whether they make the cutoffs. The
// course's name is the page's title, as the race's is in Terminus's hero.
function StoryHero({ className }) {
  const plan = useStore((state) => state.plan);
  const planStatus = useStore((state) => state.planStatus);
  if (!plan) return null;

  const { entries, course } = plan;
  const finish = entries[entries.length - 1];
  const missed = entries.filter(
    (entry, index) => marginTier(cutoffMargin(entry, index)) === "over",
  ).length;
  const { tier, text } = verdict(entries);
  return (
    <StorySection
      className={className}
      eyebrow="Your race, planned"
      title={course.name ?? "Unnamed course"}
      titleAs="h1"
      instant
    >
      <div aria-label="Verdict" role="region" aria-busy={planStatus === "computing"}>
        <PlanNotice />
        <dl className="stats">
          <div className="stat hero">
            <dt>Finish</dt>
            <dd>{formatDuration(finish.duration_s_arrival)}</dd>
          </div>
          <div className="stat">
            <dt>Distance</dt>
            <dd>{formatKm(course.distance_m)}</dd>
          </div>
          <div className="stat">
            <dt>Gain</dt>
            <dd>{Math.round(finish.elevation_gain_m)} m</dd>
          </div>
          <div className="stat">
            <dt>Cutoffs missed</dt>
            <dd className={missed > 0 ? "over" : undefined}>{missed}</dd>
          </div>
        </dl>
        <p className="line">
          {tier && <span className={`badge ${tier}`}>{TIER_WORDS[tier]}</span>}
          <span>{text}</span>
        </p>
      </div>
    </StorySection>
  );
}

export default memo(style(StoryHero));
