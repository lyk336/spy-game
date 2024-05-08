import { useRef } from 'react';

export const useTimeout = (): { timeoutClear: () => void; timeout: (cb: () => void, time: number) => void } => {
  const timeoutId = useRef<NodeJS.Timeout>();
  const timeoutClear = (): void => {
    clearTimeout(timeoutId.current);
  };
  const timeout = (cb: () => void, time: number): void => {
    timeoutClear();
    timeoutId.current = setTimeout(cb, time);
  };

  return { timeoutClear, timeout };
};
