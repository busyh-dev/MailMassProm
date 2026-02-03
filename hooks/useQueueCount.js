// hooks/useQueueCount.js
import { useEffect, useState } from "react";
import { getQueue } from "./queuedRequests";

export default function useQueueCount() {
  const [count, setCount] = useState(getQueue().length);

  useEffect(() => {
    const update = () => setCount(getQueue().length);
    window.addEventListener("queue-updated", update);
    return () => window.removeEventListener("queue-updated", update);
  }, []);

  return count;
}
