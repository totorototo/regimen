// The browser's download of bytes it holds: a link to a Blob, clicked. As Waymark's, with
// the type passed in.
export function download(name, bytes, type = "application/json") {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next task: some browsers cancel a download whose URL is revoked at once.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
