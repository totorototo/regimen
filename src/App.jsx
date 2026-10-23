import { useState } from "react";

import { Layout } from "./App.style.js";
import Footer from "./components/footer/Footer.jsx";
import LoadingSpinner from "./components/loadingSpinner/LoadingSpinner.jsx";
import OpenCourse from "./components/openFile/OpenCourse.jsx";
import Story from "./components/story/Story.jsx";
import ThemeToggle from "./components/themeToggle/ThemeToggle.jsx";
import Toolbar from "./components/toolbar/Toolbar.jsx";
import { gpxHint } from "./plan/hints.js";
import useStore from "./store/store.js";

// A dropped file is a course when it ends in .gpx, a saved plan when it ends in .json.
// why by name: the page never reads a file itself (gpxz does), and a browser's file type for
// .gpx is often empty.
export function droppedKind(file) {
  if (/\.gpx$/i.test(file.name)) return "course";
  if (/\.json$/i.test(file.name)) return "plan";
  return null;
}

export default function App() {
  const [dragging, setDragging] = useState(false);
  const status = useStore((state) => state.status);
  const error = useStore((state) => state.error);
  const openCourse = useStore((state) => state.openCourse);
  const openPlanFile = useStore((state) => state.openPlanFile);

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const [file] = event.dataTransfer.files;
    if (!file) return;
    const kind = droppedKind(file);
    if (kind === "plan" && status === "ready") openPlanFile(file);
    else if (kind !== "plan") openCourse(file);
  };

  return (
    <Layout
      $dragging={dragging}
      $story={status === "ready"}
      $start={status !== "ready"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <ThemeToggle />
      <Toolbar />
      <main>
        {status === "idle" && (
          <div className="start">
            <span className="eyebrow">Race plan</span>
            <h2 className="title">A course, paced and timed</h2>
            <p className="lede">
              Open the course from Waymark, set your pace model, and see when you reach each
              checkpoint and how much room you have on its cutoff. Export the plan as plan.json for
              Terminus and Retrace.
            </p>
            <div className="ledger">
              <OpenCourse className="ledger-row" />
            </div>
            <p className="drop">or drop the file anywhere on the page</p>
            <p className="note">The file stays on this device: nothing is uploaded.</p>
          </div>
        )}
        {status === "loading" && <LoadingSpinner label="Reading the course…" />}
        {status === "error" && (
          <div className="start" role="alert">
            <span className="eyebrow">Open GPX</span>
            <h2 className="title">This course could not be read</h2>
            <p className="lede">{gpxHint(error)}</p>
            <div className="ledger">
              <OpenCourse className="ledger-row">Open another GPX</OpenCourse>
            </div>
            <p className="note detail">gpxz said: {error}</p>
          </div>
        )}
        {status === "ready" && <Story />}
      </main>
      <Footer />
    </Layout>
  );
}
