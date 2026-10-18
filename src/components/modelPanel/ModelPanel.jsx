import { fuelingTotals } from "../../plan/summary.js";
import useStore from "../../store/store.js";
import style from "./ModelPanel.style.js";

const PACE = {
  name: "pace",
  label: "Flat pace",
  unit: "min/km",
  help: "On flat ground, fresh. Slope and fatigue are added to it.",
  inputMode: "numeric",
};

const PACE_MORE = [
  {
    name: "fatigue",
    label: "Fatigue",
    unit: "/km",
    help: "How fast you slow down: 0.002 is about 22% slower after 100 km of effort.",
    inputMode: "decimal",
  },
  {
    name: "lifeBaseStopMin",
    label: "LifeBase stop",
    unit: "min",
    help: "At each LifeBase whose checkpoint sets no stop of its own.",
    inputMode: "numeric",
  },
];

const FUELING = [
  {
    name: "carbs",
    label: "Carbs",
    unit: "g/h",
    help: "Gels, bars, drink mix.",
    inputMode: "decimal",
  },
  { name: "fluid", label: "Fluid", unit: "ml/h", help: "What you drink.", inputMode: "decimal" },
  {
    name: "sodium",
    label: "Sodium",
    unit: "mg/h",
    help: "From food, drink or capsules.",
    inputMode: "decimal",
  },
  {
    name: "reserveMin",
    label: "Reserve",
    unit: "min",
    help: "Added to every carry, for a bad patch between refills.",
    inputMode: "numeric",
  },
];

// One input with its unit inside it. The help shows while the field has focus, and the error
// in its place whenever the value doesn't parse.
// why the help hides: seven always-on paragraphs were most of the panel's height, and they
// are read once.
function Field({ field }) {
  const value = useStore((state) => state.form[field.name]);
  const error = useStore((state) => state.formErrors[field.name]);
  const setField = useStore((state) => state.setField);
  const id = `model-${field.name}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {field.label} <span className="visually-hidden">{field.unit}</span>
      </label>
      <div className="input">
        <input
          id={id}
          type="text"
          inputMode={field.inputMode}
          autoComplete="off"
          value={value}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={`${id}-help`}
          onChange={(event) => setField(field.name, event.target.value)}
        />
        <span className="unit" aria-hidden="true">
          {field.unit}
        </span>
      </div>
      <p id={`${id}-help`} className={error ? "help error" : "help"}>
        {error ?? field.help}
      </p>
    </div>
  );
}

function FuelingSwitch() {
  const on = useStore((state) => state.form.fueling);
  const setField = useStore((state) => state.setField);
  return (
    <div className="switch" role="group" aria-label="Fueling">
      <button type="button" aria-pressed={!on} onClick={() => setField("fueling", false)}>
        Off
      </button>
      <button type="button" aria-pressed={on} onClick={() => setField("fueling", true)}>
        On
      </button>
    </div>
  );
}

function Totals() {
  // why not computed in the selector: a new object per call would re-render forever.
  const plan = useStore((state) => state.plan);
  const totals = fuelingTotals(plan);
  if (!totals) return null;
  return (
    <div className="totals">
      <h3 className="eyebrow">Whole race</h3>
      <dl>
        <div>
          <dt>Carbs</dt>
          <dd>{totals.carbs}</dd>
        </div>
        <div>
          <dt>Fluid</dt>
          <dd>{totals.fluid}</dd>
        </div>
        <div>
          <dt>Sodium</dt>
          <dd>{totals.sodium}</dd>
        </div>
      </dl>
    </div>
  );
}

// The model, as two cards: the pace model's three inputs, and fueling's when it is on (off:
// fueling is null). Every valid change recomputes the plan; a value that does not parse is
// marked on its field and the plan keeps the last valid model.
function ModelPanel({ className, id }) {
  const fueling = useStore((state) => state.form.fueling);
  const resetSettings = useStore((state) => state.resetSettings);

  return (
    <div className={className} id={id}>
      <section className="card" aria-labelledby="pace-title">
        <h2 id="pace-title" className="eyebrow">
          Pace
        </h2>
        <Field field={PACE} />
        <div className="pair">
          {PACE_MORE.map((field) => (
            <Field key={field.name} field={field} />
          ))}
        </div>
      </section>
      <section className="card" aria-labelledby="fueling-title">
        <div className="card-head">
          <h2 id="fueling-title" className="eyebrow">
            Fueling
          </h2>
          <FuelingSwitch />
        </div>
        {fueling ? (
          <>
            <div className="pair">
              {FUELING.map((field) => (
                <Field key={field.name} field={field} />
              ))}
            </div>
            <Totals />
          </>
        ) : (
          <p className="off">Turn it on to plan what you eat and drink, and where you refill.</p>
        )}
      </section>
      <button type="button" className="reset" onClick={resetSettings}>
        Reset to defaults
      </button>
    </div>
  );
}

export default style(ModelPanel);
