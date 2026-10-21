import { Minus } from "@styled-icons/feather/Minus";
import { Plus } from "@styled-icons/feather/Plus";
import { memo, useState } from "react";

import { useHoldRepeat } from "../../../hooks/useHoldRepeat.js";
import { slowestStep, stepText } from "../../../plan/settings.js";
import { cutoffMargin } from "../../../plan/summary.js";
import useStore from "../../../store/store.js";
import { formatPace, parsePace } from "../../../utils/format.js";
import StorySection from "../StorySection.jsx";
import style from "./StoryModel.style.js";

const PACE = [
  {
    name: "pace",
    label: "Flat pace",
    unit: "min/km",
    help: "On flat ground, fresh. Slope and fatigue are added to it.",
  },
  {
    name: "fatigue",
    label: "Fatigue",
    unit: "/km",
    help: "How fast you slow down: 0.002 is about 22% slower after 100 km of effort.",
  },
  {
    name: "lifeBaseStopMin",
    label: "LifeBase stop",
    unit: "min",
    help: "At each LifeBase whose checkpoint sets no stop of its own.",
  },
];

const FUELING = [
  {
    name: "carbs",
    label: "Carbs",
    unit: "g/h",
    help: "Gels, bars, drink mix.",
  },
  { name: "fluid", label: "Fluid", unit: "ml/h", help: "What you drink." },
  {
    name: "sodium",
    label: "Sodium",
    unit: "mg/h",
    help: "From food, drink or capsules.",
  },
  {
    name: "reserveMin",
    label: "Reserve",
    unit: "min",
    help: "Added to every carry, for a bad patch between refills.",
  },
];

// One step button, repeating while held, disabled at the bound gpxz enforces.
function Step({ label, direction, field, value, setField }) {
  const next = stepText(field.name, value, direction);
  const hold = useHoldRepeat(() => {
    // Read the store, not the render's value: a held button steps from where the last
    // repeat left the field.
    const current = useStore.getState().form[field.name];
    const stepped = stepText(field.name, current, direction);
    if (stepped === null) return false;
    setField(field.name, stepped);
    return true;
  });
  return (
    <button
      type="button"
      className="step"
      aria-label={`${label} ${field.label}`}
      disabled={next === null}
      {...hold}
    >
      {direction > 0 ? <Plus size={18} /> : <Minus size={18} />}
    </button>
  );
}

// One input of the model as a stepper row: its name, then − value +. The value is read
// only: the steps keep it round and inside gpxz's bounds, so the form never holds a value
// that doesn't parse. Its help is the row's description, and shows in its group's hint
// line while the row has focus.
// why a stepper, not a slider: these are small exact numbers (pace by 5 s), which a slider
// over a usable range can't land on a phone, and a stepper keeps 44px targets.
function Stepper({ field, onFocusChange }) {
  const value = useStore((state) => state.form[field.name]);
  const setField = useStore((state) => state.setField);
  const id = `model-${field.name}`;

  return (
    <div
      className="stepper"
      role="group"
      aria-labelledby={id}
      aria-describedby={`${id}-help`}
      onFocus={() => onFocusChange(field.name)}
      onBlur={() => onFocusChange(null)}
    >
      <span className="name" id={id}>
        {field.label}
      </span>
      <Step label="Decrease" direction={-1} field={field} value={value} setField={setField} />
      {/* why no aria-live: a held button steps 12 times a second, and each would be read. */}
      <output className="value" data-testid={id}>
        {value} <span className="unit">{field.unit}</span>
      </output>
      <Step label="Increase" direction={1} field={field} value={value} setField={setField} />
      <span id={`${id}-help`} className="visually-hidden">
        {field.help}
      </span>
    </div>
  );
}

// The slowest pace that makes every cutoff, as a command that sets it: what the runner can
// afford, in place of stepping − until nothing is Over. Nothing without cutoffs.
function SlowestPace() {
  const slowest = useStore((state) => state.slowest_pace_s_per_km);
  const pace = useStore((state) => parsePace(state.form.pace));
  const hasCutoffs = useStore(
    (state) =>
      state.plan?.entries.some((entry, index) => cutoffMargin(entry, index) !== null) ?? false,
  );
  const setField = useStore((state) => state.setField);
  if (!hasCutoffs) return null;
  if (slowest === null) {
    return (
      <p className="off">No pace from 2:00/km makes every cutoff: the stops alone miss one.</p>
    );
  }
  const target = slowestStep(slowest);
  const yours = pace === target;
  return (
    <button
      type="button"
      className={yours ? "action-btn command slowest active" : "action-btn command slowest"}
      aria-label={`Set the flat pace to ${formatPace(target)} per km, the slowest that makes every cutoff`}
      disabled={yours}
      onClick={() => setField("pace", formatPace(target))}
    >
      <span className="command-name">Slowest on time</span>
      <span className="command-value">
        {formatPace(target)} <span className="unit">min/km</span>
      </span>
    </button>
  );
}

// Fueling as Terminus's Outdoor mode: one command that is on or off.
function FuelingCommand() {
  const on = useStore((state) => state.form.fueling);
  const setField = useStore((state) => state.setField);
  return (
    <button
      type="button"
      className={on ? "action-btn command fueling active" : "action-btn command fueling"}
      aria-pressed={on}
      onClick={() => setField("fueling", !on)}
    >
      <span className="command-name">Fueling</span>
      <span className="command-value">{on ? "On" : "Off"}</span>
    </button>
  );
}

// The model the plan is computed from, as a column of stepper rows and one command, right under the
// verdict it produces: change one and the finish above moves.
const HINT = "Hold − or + to step faster.";

// One line under a group of rows, its height kept whether it holds a help or the hint.
// why reserved: a help that appeared and vanished with focus moved every row below it, so
// a click that began on one row could end on another.
function Hint({ fields, focused }) {
  const field = fields.find((candidate) => candidate.name === focused);
  return (
    <p className="hint" aria-hidden="true">
      {field ? field.help : HINT}
    </p>
  );
}

function StoryModel({ className }) {
  const fueling = useStore((state) => state.form.fueling);
  const [focused, setFocused] = useState(null);
  const command = (field) => <Stepper key={field.name} field={field} onFocusChange={setFocused} />;

  return (
    <StorySection className={className} eyebrow="The model" title="Your model">
      <p className="lede">What the plan is computed from. Change one and the finish moves.</p>
      <div className="commands">
        <h3 className="group-label">Pace</h3>
        {PACE.map(command)}
        <SlowestPace />
        <Hint fields={PACE} focused={focused} />
        <FuelingCommand />
        {fueling ? (
          <>
            {FUELING.map(command)}
            <Hint fields={FUELING} focused={focused} />
          </>
        ) : (
          <p className="off">Turn it on to plan what you eat and drink, and where you refill.</p>
        )}
      </div>
    </StorySection>
  );
}

export default memo(style(StoryModel));
