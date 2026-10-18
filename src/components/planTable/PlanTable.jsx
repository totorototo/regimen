import { SUPPLIES, supplyDefault } from "../../plan/settings.js";
import useStore from "../../store/store.js";
import {
  formatCarry,
  formatDuration,
  formatKm,
  formatLitres,
  formatMargin,
} from "../../utils/format.js";
import style from "./PlanTable.style.js";

// A margin under this is a cutoff the runner reaches with little room for a bad patch.
// A first guess, not a measured threshold: tune it once real races have been debriefed.
export const MARGIN_TIGHT_S = 30 * 60;

// The first checkpoint's <time> is the start, not a cutoff (gpxz's PlanEntry), so its margin
// is always zero and says nothing.
export const cutoffMargin = (entry, index) => (index === 0 ? null : entry.margin_s);

function marginClass(margin_s) {
  if (margin_s === null) return "margin";
  if (margin_s < 0) return "margin over";
  if (margin_s < MARGIN_TIGHT_S) return "margin tight";
  return "margin";
}

// What the race takes at the hourly targets, start to finish (no reserve: that is carried, not
// eaten). Rounded up, as gpxz's carry.
function FuelingTotals({ fueling, duration_s }) {
  const hours = duration_s / 3600;
  return (
    <>
      <div>
        <dt>Carbs</dt>
        <dd>{Math.ceil(fueling.carbs_g_per_h * hours)} g</dd>
      </div>
      <div>
        <dt>Fluid</dt>
        <dd>{formatLitres(Math.ceil(fueling.fluid_ml_per_h * hours))}</dd>
      </div>
    </>
  );
}

function Summary({ plan }) {
  const { entries, course } = plan;
  const finish = entries[entries.length - 1];
  const missed = entries.filter((entry, index) => {
    const margin_s = cutoffMargin(entry, index);
    return margin_s !== null && margin_s < 0;
  }).length;
  return (
    <dl className="summary">
      <div>
        <dt>Course</dt>
        <dd>{course.name ?? "Unnamed course"}</dd>
      </div>
      <div>
        <dt>Distance</dt>
        <dd>{formatKm(course.distance_m)}</dd>
      </div>
      <div>
        <dt>D+</dt>
        <dd>{Math.round(finish.elevation_gain_m)} m</dd>
      </div>
      <div>
        <dt>Finish</dt>
        <dd>{formatDuration(finish.duration_s_arrival)}</dd>
      </div>
      <div>
        <dt>Cutoffs missed</dt>
        <dd className={missed > 0 ? "over" : undefined}>{missed}</dd>
      </div>
      {plan.model.fueling && (
        <FuelingTotals fueling={plan.model.fueling} duration_s={finish.duration_s_arrival} />
      )}
    </dl>
  );
}

// One checkpoint's refill. The last has none: nothing comes after it to carry for. A choice
// other than the course's default is marked.
function Refill({ entry, index, supply, last }) {
  const setSupply = useStore((state) => state.setSupply);
  if (last) return <td>–</td>;
  const fallback = supplyDefault(entry);
  const changed = supply !== fallback;
  return (
    <td className="refill">
      <select
        aria-label={`Refill at ${entry.name}`}
        className={changed ? "changed" : undefined}
        title={changed ? `Default: ${fallback}` : undefined}
        value={supply}
        onChange={(event) => setSupply(index, event.target.value)}
      >
        {SUPPLIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </td>
  );
}

// The plan gpxz computed, one row per checkpoint: what plan.json holds, as the runner reads
// it.
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
    <section
      className={className}
      aria-labelledby="plan-title"
      aria-busy={planStatus === "computing"}
    >
      <h2 id="plan-title" className="eyebrow">
        Plan
      </h2>
      <Summary plan={plan} />
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Checkpoint</th>
              <th scope="col">km</th>
              <th scope="col">D+</th>
              <th scope="col">Arrival</th>
              <th scope="col">Stop</th>
              <th scope="col" title="Time to spare on the cutoff, after the stop">
                Margin
              </th>
              {fueling && (
                <>
                  <th scope="col">Refill</th>
                  <th scope="col" title="What to leave with, until the next refill">
                    Leave with
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {plan.entries.map((entry, index) => (
              <tr key={`${entry.index}-${entry.name}`}>
                <th scope="row">
                  {entry.name}
                  {entry.type_name && <span className="type">{entry.type_name}</span>}
                </th>
                <td>{(entry.distance_m / 1000).toFixed(1)}</td>
                <td>{Math.round(entry.elevation_gain_m)}</td>
                <td>{formatDuration(entry.duration_s_arrival)}</td>
                <td>{entry.stop_s > 0 ? formatDuration(entry.stop_s) : "–"}</td>
                <td className={marginClass(cutoffMargin(entry, index))}>
                  {formatMargin(cutoffMargin(entry, index))}
                </td>
                {fueling && (
                  <>
                    <Refill
                      entry={entry}
                      index={index}
                      supply={fueling.supplies[index]}
                      last={index === last}
                    />
                    <td className="carry">{formatCarry(plan.carry[index])}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default style(PlanTable);
