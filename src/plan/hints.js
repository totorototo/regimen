// What to do about a file gpxz refused, by its error name. Zigar reports the name as words
// ("Checkpoints too few"): match either form.

const GPX_HINTS = {
  CheckpointsTooFew:
    "The course needs a Start and at least one more checkpoint. Open it in Waymark, pin the checkpoints, and export it again.",
  TraceTooShort:
    "The file has no track, or too few points to make one. Is it a route with a <trk>?",
  ElevationMissing:
    "The track has no elevation, which the pace model needs. Export it again with elevation.",
  FileTooLarge: "The file is over 64 MB, more than any race route needs.",
};
const GPX_HINT_DEFAULT =
  "It does not look like a GPX file with a track. Try exporting it again from Waymark.";

const PLAN_HINTS = {
  SchemaVersionUnsupported:
    "This plan was written by a newer version of Regimen or gpxz. Update Regimen and try again.",
  PlanInvalid:
    "The plan's numbers don't add up (a departure that isn't arrival plus stop, a distance past the course). Was it edited by hand?",
  PlanTooLarge: "The file is over 4 MB, more than any plan needs.",
};
const PLAN_HINT_DEFAULT = "It does not look like a plan.json file.";

const squash = (text) => String(text).replace(/\s+/g, "").toLowerCase();

const lookup = (hints, fallback) => (error) => {
  const known = Object.keys(hints).find((name) => squash(name) === squash(error));
  return known ? hints[known] : fallback;
};

export const gpxHint = lookup(GPX_HINTS, GPX_HINT_DEFAULT);
export const planHint = lookup(PLAN_HINTS, PLAN_HINT_DEFAULT);
