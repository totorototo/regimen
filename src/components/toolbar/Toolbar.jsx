import { FileText } from "@styled-icons/feather/FileText";

import useStore from "../../store/store.js";
import { MARK_PATH } from "../../theme/mark.js";
import ExportPlan from "../exportPlan/ExportPlan.jsx";
import OpenCourse from "../openFile/OpenCourse.jsx";
import OpenFile from "../openFile/OpenFile.jsx";
import style from "./Toolbar.style.js";

// On the start page the name is the page's h1; once a course is open, the course's name is.
function Brand({ as: Tag = "span" }) {
  return (
    <Tag className="brand">
      <svg className="mark" viewBox="0 0 64 64" aria-hidden="true">
        <path d={MARK_PATH} fillRule="evenodd" />
      </svg>
      <span>
        <span className="brand-dim">regi</span>men
      </span>
    </Tag>
  );
}

function Toolbar({ className }) {
  const status = useStore((state) => state.status);
  const fileName = useStore((state) => state.fileName);
  const openPlanFile = useStore((state) => state.openPlanFile);

  // Before a course is open, and when one could not be read, the page itself offers to open
  // one: nothing to show here but the name.
  if (status !== "ready") {
    return (
      <header className={`${className} is-start`}>
        <Brand as="h1" />
      </header>
    );
  }

  return (
    <header className={className}>
      <Brand />
      <span className="file" title={fileName}>
        <span className="file-label">Course</span>
        <span className="file-name">{fileName}</span>
      </span>
      <OpenCourse />
      <OpenFile
        accept=".json,application/json"
        onFile={openPlanFile}
        testId="plan-input"
        icon={<FileText size={16} />}
      >
        Open plan
      </OpenFile>
      <ExportPlan className="export" />
    </header>
  );
}

export default style(Toolbar);
