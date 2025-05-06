import { useEffect, useState } from "hono/jsx/dom";

const sequence = [1, 2, 3];

export function useLoadingDots(trigger: boolean) {
  const [curIdx, setCurIdx] = useState(0);

  useEffect(() => {
    if (!trigger) {
      return;
    }

    const interval = setInterval(() => {
      setCurIdx((idx) => (idx + 1) % sequence.length);
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [trigger]);

  return ".".repeat(sequence[curIdx]);
}
