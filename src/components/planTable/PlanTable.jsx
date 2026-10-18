import { supplyDefault } from "../../plan/settings.js";
import { checkpointMeta, cutoffMargin, marginTier, TIER_WORDS } from "../../plan/summary.js";
import useStore from "../../store/store.js";
import { formatCarry, formatDuration, formatMargin } from "../../utils/format.js";
import style from "./PlanTable.style.js";

const SUPPLY_WORDS = { none: "None", water: "Water", full: "Full" };

function Badge({ tier, children }) {
  return <span className={`badge ${tier}`}>{children ?? TIER_WORDS[tier]}</span>;
}

// One checkpoint's refill as Trail Suite's segmented switch. A choice other than the
// course's default is outlined and named.
function Refill({ entry, index, supply }) {
  const setSupply = useStore((state) => state.setSupply);
  const fallback = supplyDefault(entry);
  const changed = supply !== fallback;
  return (
    <div className="refill">
      <span className="label">Refill</span>
      <div
        className={changed ? "switch changed" : "switch"}
        role="group"
        aria-label={`Refill at ${entry.name}`}
      >
        {Object.entries(SUPPLY_WORDS).map(([value, word]) => (
          <button
            key={value}
            type="button"
            aria-pressed={supply === value}
            onClick={() => setSupply(index, value)}
          >
            {word}
          </button>
        ))}
      </div>
      {changed && <span className="note">Changed from {fallback}.</span>}
    </div>
  );
}

function Checkpoint({ entry, index, fueling, carry, last }) {
  const margin_s = cutoffMargin(entry, index);
  const tier = marginTier(margin_s);
  return (
    <li className="checkpoint">
      <div className="top">
        <div>
          <h4 className="name">{entry.name}</h4>
          <p className="meta">{checkpointMeta(entry)}</p>
        </div>
        <div className="eta">
          {tier && <Badge tier={tier} />}
          <span className="time">{formatDuration(entry.duration_s_arrival)}</span>
        </div>
      </div>
      <div className="under">
        <dl className="grid">
          <div>
            <dt>Stop</dt>
            <dd>{entry.stop_s > 0 ? formatDuration(entry.stop_s) : "–"}</dd>
          </div>
          <div>
            <dt>Margin</dt>
            <dd className={tier === "over" ? "over" : undefined}>{formatMargin(margin_s)}</dd>
          </div>
        </dl>
        {fueling && !last && (
          <div className="fuel">
            <Refill entry={entry} index={index} supply={fueling.supplies[index]} />
            <div className="carry">
              <span className="label">Leave with</span>
              <span className="value">{formatCarry(carry)}</span>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

// The plan gpxz computed, one row per checkpoint (Trail Suite's checkpoint row): what
// plan.json holds, as the runner reads it. The verdict above it is its own component.
function PlanTable({ className }) {
  const plan = useStore((state) => state.plan);
  const planStatus = useStore((state) => state.planStatus);
  const planError = useStore((state) => state.planError);

  if (planStatus === "error") {
    return (
      <section className={className} role="alert">
        <p className="error">The plan could not be computed: {planError}</p>
      </section>
    );
  }
  if (!plan) return null;
  const fueling = plan.model.fueling;
  const last = plan.entries.length - 1;

  return (
    <section className={className} aria-label="Plan" aria-busy={planStatus === "computing"}>
      <div className="checkpoints">
        <div className="checkpoints-head">
          <h3>Against the cutoffs</h3>
          <p className="note">Times from the start. Margin: time to spare after the stop.</p>
        </div>
        <ol>
          {plan.entries.map((entry, index) => (
            <Checkpoint
              key={`${entry.index}-${entry.name}`}
              entry={entry}
              index={index}
              fueling={fueling}
              carry={plan.carry[index]}
              last={index === last}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

export default style(PlanTable);
