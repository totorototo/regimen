import { memo } from "react";

import { fuelingTotals } from "../../../plan/summary.js";
import useStore from "../../../store/store.js";
import StorySection from "../StorySection.jsx";
import style from "./StoryFueling.style.js";

const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// What the whole race takes at the hourly targets, and where it is picked up. The per
// checkpoint refills are set in the checkpoints above, where the runner reads the legs.
function StoryFueling({ className }) {
  const plan = useStore((state) => state.plan);
  const totals = fuelingTotals(plan);
  if (!totals) return null;
  const { fueling } = plan.model;
  const refills = fueling.supplies.slice(0, -1);
  const full = refills.filter((supply) => supply === "full").length;
  const water = refills.filter((supply) => supply === "water").length;

  return (
    <StorySection className={className} eyebrow="The fueling" title="What the race takes">
      <p className="lede">
        At {fueling.carbs_g_per_h} g of carbs, {fueling.fluid_ml_per_h} ml of fluid and{" "}
        {fueling.sodium_mg_per_h} mg of sodium an hour, start to finish.{" "}
        <strong>
          {count(full, "full refill")}, {count(water, "water stop")}.
        </strong>
      </p>
      <div className="totals">
        <h3 className="eyebrow">Whole race</h3>
        <dl className="stats">
          <div className="stat">
            <dt>Carbs</dt>
            <dd>{totals.carbs}</dd>
          </div>
          <div className="stat">
            <dt>Fluid</dt>
            <dd>{totals.fluid}</dd>
          </div>
          <div className="stat">
            <dt>Sodium</dt>
            <dd>{totals.sodium}</dd>
          </div>
        </dl>
      </div>
    </StorySection>
  );
}

export default memo(style(StoryFueling));
