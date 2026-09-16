import { useEffect, useRef, useCallback } from 'react';

export const useAutoLogout = ({ onWarning, onLogout, timeoutMinutes = 60, enabled = true }) => {
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;

  const timeoutRef = useRef(null);
  const isWarningActiveRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (isWarningActiveRef.current) return;

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      isWarningActiveRef.current = true;
      onWarning?.();
    }, TIMEOUT_MS);
  }, [onWarning, TIMEOUT_MS]);

  const forceReset = useCallback(() => {
    isWarningActiveRef.current = false;
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimeout(timeoutRef.current);
      isWarningActiveRef.current = false;
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      if (!isWarningActiveRef.current) {
        resetTimer();
      }
    };

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeout(timeoutRef.current);
    };
  }, [resetTimer, enabled]);

  return { forceReset };
};