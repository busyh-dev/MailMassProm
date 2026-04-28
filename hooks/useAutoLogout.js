import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAutoLogout = ({ onWarning, onLogout, timeoutMinutes = 30, enabled = true }) => {
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  const WARNING_MS = Math.min(5 * 60 * 1000, TIMEOUT_MS * 0.2);

  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  const resetTimer = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);

    warningRef.current = setTimeout(() => {
      onWarning?.();
    }, TIMEOUT_MS - WARNING_MS);

    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logout_reason', 'inactivity');
      }
      onLogout?.();
    }, TIMEOUT_MS);
  }, [onWarning, onLogout, TIMEOUT_MS, WARNING_MS]);

  useEffect(() => {
    if (!enabled) {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
    };
  }, [resetTimer, enabled]);
};