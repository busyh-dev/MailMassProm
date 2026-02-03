import { useState, useEffect } from "react";

/**
 * Gestisce un'animazione di uscita fluida per i modali.
 * @param {boolean} isMounted - Stato del modale (true = visibile)
 * @param {number} delay - Durata dell'animazione in millisecondi
 */
export default function useAnimatedUnmount(isMounted, delay = 250) {
  const [shouldRender, setShouldRender] = useState(isMounted);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    let timeoutId;

    if (isMounted) {
      setShouldRender(true);
      setAnimationClass("animate-fadeZoomIn");
    } else {
      setAnimationClass("animate-fadeZoomOut");
      timeoutId = setTimeout(() => setShouldRender(false), delay);
    }

    return () => clearTimeout(timeoutId);
  }, [isMounted, delay]);

  return { shouldRender, animationClass };
}
