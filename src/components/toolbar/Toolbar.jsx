import { Download } from "@styled-icons/feather/Download";
import { FileText } from "@styled-icons/feather/FileText";
import { useState } from "react";

import useStore from "../../store/store.js";
import { download } from "../../utils/download.js";
import OpenCourse from "../openFile/OpenCourse.jsx";
import OpenFile from "../openFile/OpenFile.jsx";
import style from "./Toolbar.style.js";

function Brand() {
  return (
    <span className="brand">
      <span>
        <span className="brand-dim">regi</span>men
      </span>
    </span>
  );
}

function Toolbar({ className }) {
  const [exportError, setExportError] = useState(null);
  const status = useStore((state) => state.status);
  const fileName = useStore((state) => state.fileName);
  const planStatus = useStore((state) => state.planStatus);
  const formErrors = useStore((state) => state.formErrors);
  const openPlanFile = useStore((state) => state.openPlanFile);
  const exportPlan = useStore((state) => state.exportPlan);

  // Before a course is open, and when one could not be read, the page itself offers to open
  // one: nothing to show here but the name.
  if (status !== "ready") {
    return (
      <header className={className}>
        <Brand />
      </header>
    );
  }

  const onExport = async () => {
    try {
      setExportError(null);
      const { name, text } = await exportPlan();
      download(name, text);
    } catch (err) {
      setExportError(err.message);
    }
  };
  const canExport = planStatus !== "error" && Object.keys(formErrors).length === 0;

  return (
    <header className={className}>
      <Brand />
      <OpenCourse />
      <span className="file" title={fileName}>
        {fileName}
      </span>
      <OpenFile
        accept=".json,application/json"
        onFile={openPlanFile}
        testId="plan-input"
        icon={<FileText size={16} />}
      >
        Open plan
      </OpenFile>
      <button type="button" className="export" disabled={!canExport} onClick={onExport}>
        <Download size={16} /> Export plan.json
      </button>
      {exportError && (
        <p role="alert" className="error">
          {exportError}
        </p>
      )}
    </header>
  );
}

export default style(Toolbar);
