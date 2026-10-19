import { useEffect, useRef } from "react";

const DELAY_MS = 400;
const REPEAT_MS = 80;

// Holding a stepper button repeats its step, as a native number input's spin buttons do.
// A tap or a key press is a plain click (one step); a hold starts repeating after 400 ms,
// and the click that ends it is swallowed so the hold doesn't add a step. The action returns
// false when it can't go further (a bound): the repeat stops, as a disabled button may never
// see the pointerup.
export function useHoldRepeat(action) {
  const timer = useRef(null);
  const repeated = useRef(false);
  const latest = useRef(action);
  useEffect(() => {
    latest.current = action;
  });

  const stop = () => {
    clearTimeout(timer.current);
    clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  return {
    onPointerDown: (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      repeated.current = false;
      stop();
      timer.current = setTimeout(() => {
        repeated.current = true;
        if (latest.current() === false) return;
        timer.current = setInterval(() => {
          if (latest.current() === false) stop();
        }, REPEAT_MS);
      }, DELAY_MS);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick: () => {
      if (repeated.current) {
        repeated.current = false;
        return;
      }
      latest.current();
    },
  };
}
