import useStore from "../../store/store.js";
import { formatPace } from "../../utils/format.js";
import style from "./ModelSummary.style.js";

// The model in two lines, for a phone: the cards are most of a screen, and the verdict and
// the checkpoints come first there. Edit opens the cards in place; Done folds them.
function ModelSummary({ className, editing, onToggle, controls }) {
  const settings = useStore((state) => state.settings);
  const { fueling } = settings;
  return (
    <section className={className} aria-labelledby="model-summary-title">
      <div className="head">
        <h2 id="model-summary-title" className="eyebrow">
          Your model
        </h2>
        <button type="button" aria-expanded={editing} aria-controls={controls} onClick={onToggle}>
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      {!editing && (
        <>
          <p className="line">
            {formatPace(settings.pace_base_s_per_km)} /km · fatigue {settings.fatigue_coefficient} ·
            LifeBase {Math.round(settings.life_base_stop_s / 60)} min
          </p>
          <p className="line">
            {fueling
              ? `${fueling.carbs_g_per_h} g · ${fueling.fluid_ml_per_h} ml · ` +
                `${fueling.sodium_mg_per_h} mg per hour · reserve ${Math.round(fueling.reserve_s / 60)} min`
              : "Fueling off"}
          </p>
        </>
      )}
    </section>
  );
}

export default style(ModelSummary);
