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

// The pace model's three inputs. Every valid change recomputes the plan; a value that does
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
      {FIELDS.map((field) => {
        const error = formErrors[field.name];
        const id = `model-${field.name}`;
        return (
          <div className="field" key={field.name}>
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
      })}
      <button type="button" className="reset" onClick={resetSettings}>
        Reset to defaults
      </button>
    </section>
  );
}

export default style(ModelPanel);
