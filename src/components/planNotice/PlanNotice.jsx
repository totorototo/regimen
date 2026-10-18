import useStore from "../../store/store.js";
import { formatKm } from "../../utils/format.js";
import style from "./PlanNotice.style.js";

// What came of opening a saved plan.json: its model applied, a plan for another course to
// take or leave, or a file gpxz refused.
function PlanNotice({ className }) {
  const notice = useStore((state) => state.notice);
  const applyNoticeModel = useStore((state) => state.applyNoticeModel);
  const dismissNotice = useStore((state) => state.dismissNotice);
  if (!notice) return null;

  const dismiss = (
    <button type="button" onClick={dismissNotice}>
      Dismiss
    </button>
  );

  if (notice.kind === "applied") {
    return (
      <div className={className} role="status">
        <p>
          Opened {notice.fileName}: its model is in the form.
          {notice.suppliesReset &&
            " Its refills were for other checkpoints, so this course's defaults are used."}
        </p>
        {dismiss}
      </div>
    );
  }
  if (notice.kind === "mismatch") {
    const course = notice.course.name ?? "an unnamed course";
    return (
      <div className={`${className} warn`} role="alert">
        <p>
          {notice.fileName} was made for {course} ({formatKm(notice.course.distance_m)}), not for
          this file, or for this file before it was edited. Its checkpoints may not be these.
        </p>
        <button type="button" onClick={applyNoticeModel}>
          Use its model anyway
        </button>
        {dismiss}
      </div>
    );
  }
  return (
    <div className={`${className} warn`} role="alert">
      <p>
        {notice.fileName} could not be read. {notice.message}
      </p>
      <p className="detail">gpxz said: {notice.detail}</p>
      {dismiss}
    </div>
  );
}

export default style(PlanNotice);
