import { useRef } from "react";

// A button and its hidden file input, as Waymark's, for either file: the course (a GPX) or
// a saved plan (plan.json). The input's test id names which.
export default function OpenFile({ className, accept, onFile, testId, icon, children }) {
  const inputRef = useRef(null);

  return (
    <>
      <button type="button" className={className} onClick={() => inputRef.current?.click()}>
        {icon} {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        data-testid={testId}
        onChange={(event) => {
          const [file] = event.target.files;
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </>
  );
}
