import { Download } from "@styled-icons/feather/Download";
import { useState } from "react";

import useStore from "../../store/store.js";
import { download } from "../../utils/download.js";

// Export plan.json as gpxz wrote it, with why it failed beside it. In the masthead and at
// the end of the story.
export default function ExportPlan({ className }) {
  const [error, setError] = useState(null);
  const planStatus = useStore((state) => state.planStatus);
  const formErrors = useStore((state) => state.formErrors);
  const exportPlan = useStore((state) => state.exportPlan);

  const onExport = async () => {
    try {
      setError(null);
      const { name, text } = await exportPlan();
      download(name, text);
    } catch (err) {
      setError(err.message);
    }
  };
  const canExport = planStatus !== "error" && Object.keys(formErrors).length === 0;

  return (
    <>
      {/* The name is whole for every reader; a phone's masthead hides " plan.json". */}
      <button
        type="button"
        className={className}
        aria-label="Export plan.json"
        disabled={!canExport}
        onClick={onExport}
      >
        <Download size={16} /> Export<span className="export-file"> plan.json</span>
      </button>
      {error && (
        <p role="alert" className="export-error">
          {error}
        </p>
      )}
    </>
  );
}
