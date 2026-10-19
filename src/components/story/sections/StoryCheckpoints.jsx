import { memo, useState } from "react";

import { SUPPLIES, supplyDefault } from "../../../plan/settings.js";
import {
  checkpointType,
  cutoffMargin,
  legs,
  marginTier,
  TIER_WORDS,
} from "../../../plan/summary.js";
import useStore from "../../../store/store.js";
import {
  formatCarry,
  formatDuration,
  formatElapsed,
  formatKm,
  formatMargin,
} from "../../../utils/format.js";
import StorySection from "../StorySection.jsx";
import style from "./StoryCheckpoints.style.js";

const SUPPLY_WORDS = { none: "None", water: "Water", full: "Full" };

// The stretch run to reach a checkpoint, in one quiet line, led by a tag in the suite's
// mauve effort tone (color-effort-1 runnable to -5 steep).
function Leg({ leg }) {
  return (
    <p className="leg">
      <span className={`effort effort-${leg.effort}`} aria-hidden="true" />
      {formatKm(leg.distance_m)} · D+ {Math.round(leg.gain_m)} m · {formatDuration(leg.duration_s)}{" "}
      on the move
    </p>
  );
}

// The margin in words, under the name; its badge (Tight or Over only) sits by the time.
function Margin({ margin_s }) {
  if (!Number.isFinite(margin_s)) return <p className="margin none">No cutoff</p>;
  return (
    <p className={margin_s < 0 ? "margin over" : "margin"}>
      {margin_s < 0 ? `Over by ${formatMargin(-margin_s)}` : `${formatMargin(margin_s)} to spare`}
    </p>
  );
}

// The refill as three bare words, the chosen one in full ink and underlined: the quiet
// language of the model's steppers, not a form field. A choice other than the course's
// default says what the default was.
function Refill({ entry, index, supply, carry }) {
  const setSupply = useStore((state) => state.setSupply);
  const fallback = supplyDefault(entry);
  return (
    <div className="refill">
      <span className="refill-label">Refill</span>
      <div className="supplies" role="group" aria-label={`Refill at ${entry.name}`}>
        {SUPPLIES.map((value) => (
          <button
            key={value}
            type="button"
            className="supply"
            aria-pressed={supply === value}
            onClick={() => setSupply(index, value)}
          >
            {SUPPLY_WORDS[value]}
          </button>
        ))}
      </div>
      {supply !== fallback && <span className="was">was {fallback}</span>}
      {carry && <span className="carry">Leave with {formatCarry(carry)}</span>}
    </div>
  );
}

// Terminus's checkpoint row: name and distance left, the time (and its badge) right, then
// the margin, the leg that leads here and, with fueling on, the refill.
function Checkpoint({ entry, index, leg, fueling, carry, last }) {
  const margin_s = cutoffMargin(entry, index);
  const tier = marginTier(margin_s);
  const type = checkpointType(entry);
  return (
    <li className={tier ? `checkpoint ${tier}` : "checkpoint"}>
      <div className="top">
        <div className="main">
          <h3 className="name">{entry.name}</h3>
          <span className="km">
            {formatKm(entry.distance_m)}
            {type && ` · ${type}`}
            {entry.stop_s > 0 && ` · stop ${formatDuration(entry.stop_s)}`}
          </span>
        </div>
        <div className="eta">
          {tier && tier !== "ok" && <span className={`badge ${tier}`}>{TIER_WORDS[tier]}</span>}
          <span className="time">{formatElapsed(entry.duration_s_arrival)}</span>
        </div>
      </div>
      {index > 0 && <Margin margin_s={margin_s} />}
      {leg && <Leg leg={leg} />}
      {fueling && !last && (
        <Refill entry={entry} index={index} supply={fueling.supplies[index]} carry={carry} />
      )}
    </li>
  );
}

// The plan gpxz computed, one row per checkpoint, in race order.
// Terminus's collapse: the first rows of a long race, then one row to show the rest. A list
// only a couple longer is shown whole: hiding two rows saves nothing.
const COLLAPSED = 6;
const COLLAPSE_FROM = COLLAPSED + 3;

// What the hidden rows hold that the runner must not miss: "2 tight, 1 over".
export function hiddenNews(entries, from) {
  const tiers = entries
    .slice(from)
    .map((entry, offset) => marginTier(cutoffMargin(entry, from + offset)));
  const count = (tier) => tiers.filter((t) => t === tier).length;
  return [count("tight") && `${count("tight")} tight`, count("over") && `${count("over")} over`]
    .filter(Boolean)
    .join(", ");
}

function StoryCheckpoints({ className }) {
  const [expanded, setExpanded] = useState(false);
  const plan = useStore((state) => state.plan);
  const planStatus = useStore((state) => state.planStatus);
  const planError = useStore((state) => state.planError);

  if (planStatus === "error") {
    return (
      <StorySection className={className} eyebrow="The checkpoints" title="Against the cutoffs">
        <p className="error" role="alert">
          The plan could not be computed: {planError}
        </p>
      </StorySection>
    );
  }
  if (!plan) return null;
  const fueling = plan.model.fueling;
  const legList = legs(plan.entries);
  const last = plan.entries.length - 1;
  const collapsed = !expanded && plan.entries.length >= COLLAPSE_FROM;
  const shown = collapsed ? plan.entries.slice(0, COLLAPSED) : plan.entries;
  const hidden = plan.entries.length - shown.length;
  const news = collapsed ? hiddenNews(plan.entries, COLLAPSED) : "";

  return (
    <StorySection className={className} eyebrow="The checkpoints" title="Against the cutoffs">
      <p className="lede">
        Times from the start. The tag before each leg is how hard it climbs, from runnable to steep.
      </p>
      <ol aria-label="Checkpoints" aria-busy={planStatus === "computing"}>
        {shown.map((entry, index) => (
          <Checkpoint
            key={`${entry.index}-${entry.name}`}
            entry={entry}
            index={index}
            leg={legList[index]}
            fueling={fueling}
            carry={plan.carry[index]}
            last={index === last}
          />
        ))}
      </ol>
      {collapsed && (
        <button type="button" className="collapse" onClick={() => setExpanded(true)}>
          Show {hidden} more checkpoints{news && ` · ${news}`}
        </button>
      )}
    </StorySection>
  );
}

export default memo(style(StoryCheckpoints));
