import useStore from "../../store/store.js";
import style from "./ModelPanel.style.js";

const FIELDS = [
  {
    name: "pace",
    label: "Flat pace",
    unit: "min/km",
    help: "Your pace on flat ground, fresh. Slope and fatigue are added to it.",
    inputMode: "numeric",
  },
  {
    name: "fatigue",
    label: "Fatigue",
    unit: "per km",
    help: "How fast you slow down: 0.002 is about 22% slower after 100 km of effort.",
    inputMode: "decimal",
  },
  {
    name: "lifeBaseStopMin",
    label: "LifeBase stop",
    unit: "min",
    help: "The stop at each LifeBase whose checkpoint sets no duration of its own.",
    inputMode: "numeric",
  },
];

const FUELING_FIELDS = [
  {
    name: "carbs",
    label: "Carbs",
    unit: "g/h",
    help: "What you eat per hour: gels, bars, drink mix.",
    inputMode: "decimal",
  },
  {
    name: "fluid",
    label: "Fluid",
    unit: "ml/h",
    help: "What you drink per hour.",
    inputMode: "decimal",
  },
  {
    name: "sodium",
    label: "Sodium",
    unit: "mg/h",
    help: "Salt per hour, from food, drink or capsules.",
    inputMode: "decimal",
  },
  {
    name: "reserveMin",
    label: "Reserve",
    unit: "min",
    help: "Extra time added to every carry, for a bad patch between refills.",
    inputMode: "numeric",
  },
];

function Field({ field, form, formErrors, setField }) {
  const error = formErrors[field.name];
  const id = `model-${field.name}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {field.label} <span className="unit">{field.unit}</span>
      </label>
      <input
        id={id}
        type="text"
        inputMode={field.inputMode}
        autoComplete="off"
        value={form[field.name]}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={`${id}-help`}
        onChange={(event) => setField(field.name, event.target.value)}
      />
      <p id={`${id}-help`} className={error ? "help error" : "help"}>
        {error ?? field.help}
      </p>
    </div>
  );
}

// The pace model's three inputs, and fueling's when it is on (off: fueling is null). Every valid change recomputes the plan; a value that does
// not parse is marked on its field and the plan keeps the last valid model.
function ModelPanel({ className }) {
  const form = useStore((state) => state.form);
  const formErrors = useStore((state) => state.formErrors);
  const setField = useStore((state) => state.setField);
  const resetSettings = useStore((state) => state.resetSettings);

  return (
    <section className={className} aria-labelledby="model-title">
      <h2 id="model-title" className="eyebrow">
        Model
      </h2>
      {FIELDS.map((field) => (
        <Field key={field.name} {...{ field, form, formErrors, setField }} />
      ))}
      <fieldset className="group">
        <legend className="eyebrow">Fueling</legend>
        <label className="toggle">
          <input
            type="checkbox"
            checked={form.fueling}
            onChange={(event) => setField("fueling", event.target.checked)}
          />
          Plan what to eat and drink
        </label>
        {form.fueling &&
          FUELING_FIELDS.map((field) => (
            <Field key={field.name} {...{ field, form, formErrors, setField }} />
          ))}
      </fieldset>
      <button type="button" className="reset" onClick={resetSettings}>
        Reset to defaults
      </button>
    </section>
  );
}

export default style(ModelPanel);
