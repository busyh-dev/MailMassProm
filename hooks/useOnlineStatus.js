// hooks/useOnlineStatus.js
import { useEffect, useRef, useState } from 'react';

export function useOnlineStatus({ onChange } = {}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // ✅ ci serve per sapere se è la prima volta
  const firstRender = useRef(true);

  useEffect(() => {
    const handleOnline = () => {
      if (!firstRender.current) {
        onChange?.(true);
      }
      setIsOnline(true);
    };

    const handleOffline = () => {
      if (!firstRender.current) {
        onChange?.(false);
      }
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
window.addEventListener("offline", handleOffline);

// ✅ sposta il flag alla fine della coda event loop
setTimeout(() => {
  firstRender.current = false;
}, 0);

    // ✅ Dopo il primo ciclo, non è più il mount iniziale
    firstRender.current = false;

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

