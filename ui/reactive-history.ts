import { useCallback, useEffect, useState } from "hono/jsx/dom";

export const PUSHSTATE_EVENT = "__pushstate";

const originalPushState = history.pushState;

history.pushState = function (state, title, url) {
  const result = originalPushState.apply(history, [state, title, url]);

  dispatchEvent(
    new CustomEvent(PUSHSTATE_EVENT, { detail: { state, title, url } }),
  );

  return result;
};

export function useHistoryState<T>() {
  const [currentState, setCurrentState] = useState(() => history.state);

  const handleStateChange = useCallback(() => {
    setCurrentState(history.state);
  }, []);

  useEffect(() => {
    addEventListener(PUSHSTATE_EVENT, handleStateChange);
    addEventListener("popstate", handleStateChange);

    return () => {
      removeEventListener(PUSHSTATE_EVENT, handleStateChange);
      removeEventListener("popstate", handleStateChange);
    };
  }, [handleStateChange]);

  return currentState as T;
}
