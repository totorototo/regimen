import { cutoffMargin, marginTier, TIER_WORDS, verdict } from "../../plan/summary.js";
import useStore from "../../store/store.js";
import { formatDuration, formatKm } from "../../utils/format.js";
import style from "./Verdict.style.js";

// What the runner asks first: when they finish, and whether they make the cutoffs. Above
// the model on a phone, so the answer comes before the inputs.
function Verdict({ className }) {
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
    <section className={className} aria-label="Verdict" aria-busy={planStatus === "computing"}>
      <p className="eyebrow">
        {course.name ?? "Unnamed course"} · {formatKm(course.distance_m)} · D+{" "}
        {Math.round(finish.elevation_gain_m)} m
      </p>
      <dl className="stats">
        <div className="stat hero">
          <dt>Finish</dt>
          <dd>{formatDuration(finish.duration_s_arrival)}</dd>
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
    </section>
  );
}

export default style(Verdict);
