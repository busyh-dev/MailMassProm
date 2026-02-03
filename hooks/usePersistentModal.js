import { useEffect, useState } from "react";

/**
 * Hook per mantenere persistente lo stato di una modale o di un oggetto
 * in localStorage, anche tra refresh o chiusura del browser.
 */
export function usePersistentModal(key = "campaignModalState") {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return { open: false, mode: null };
    try {
      return JSON.parse(localStorage.getItem(key)) || { open: false, mode: null };
    } catch {
      return { open: false, mode: null };
    }
  });

  // Aggiorna localStorage quando lo stato cambia
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  // Sincronizza tra più tab del browser
  useEffect(() => {
    const syncState = (e) => {
      if (e.key === key && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", syncState);
    return () => window.removeEventListener("storage", syncState);
  }, [key]);

  return [state, setState];
}

