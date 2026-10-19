import { FileText } from "@styled-icons/feather/FileText";
import { Moon } from "@styled-icons/feather/Moon";
import { RotateCcw } from "@styled-icons/feather/RotateCcw";
import { Sun } from "@styled-icons/feather/Sun";
import { memo, useState } from "react";

import { planFileName } from "../../../plan/settings.js";
import useStore from "../../../store/store.js";
import ExportPlan from "../../exportPlan/ExportPlan.jsx";
import OpenCourse from "../../openFile/OpenCourse.jsx";
import OpenFile from "../../openFile/OpenFile.jsx";
import StorySection from "../StorySection.jsx";
import style from "./StoryEnd.style.js";

// The end of the story, as Terminus's StoryEnd: the file the plan becomes, then every
// command in one column. Reset asks first, as Terminus's Leave trail does.
function StoryEnd({ className }) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileName = useStore((state) => state.fileName);
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const openPlanFile = useStore((state) => state.openPlanFile);
  const resetSettings = useStore((state) => state.resetSettings);

  return (
    <StorySection className={className} eyebrow="Before you go" title="Take it to the start line">
      <p className="lede">
        {planFileName(fileName)} carries this model to Terminus for race day and to Retrace for the
        debrief. It stays on your device.
      </p>
      <div className="actions">
        <ExportPlan className="action-btn primary" />
        <OpenFile
          className="action-btn"
          accept=".json,application/json"
          onFile={openPlanFile}
          testId="plan-input-end"
          icon={<FileText size={16} />}
        >
          Open another plan
        </OpenFile>
        <OpenCourse className="action-btn">Open another GPX</OpenCourse>
        <button type="button" className="action-btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        {confirmingReset ? (
          <div className="confirm-row">
            <span>Put the model back to gpxz&apos;s defaults?</span>
            <button
              type="button"
              className="confirm-btn danger"
              onClick={() => {
                resetSettings();
                setConfirmingReset(false);
              }}
            >
              Yes
            </button>
            <button type="button" className="confirm-btn" onClick={() => setConfirmingReset(false)}>
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="action-btn danger"
            onClick={() => setConfirmingReset(true)}
          >
            <RotateCcw size={16} />
            Reset the model
          </button>
        )}
      </div>
    </StorySection>
  );
}

export default memo(style(StoryEnd));
