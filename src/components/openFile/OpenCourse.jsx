import { FolderPlus } from "@styled-icons/feather/FolderPlus";

import useStore from "../../store/store.js";
import OpenFile from "./OpenFile.jsx";

export default function OpenCourse({ className, children = "Open GPX" }) {
  const openCourse = useStore((state) => state.openCourse);
  return (
    <OpenFile
      className={className}
      accept=".gpx,application/gpx+xml,text/xml"
      onFile={openCourse}
      testId="course-input"
      icon={<FolderPlus size={16} />}
    >
      {children}
    </OpenFile>
  );
}
