// components/QueueDashboard.jsx
import { useEffect, useState } from "react";
import { getQueue, clearQueue, flushQueue } from "../hooks/queuedRequests";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useEmailAccounts } from "../hooks/useEmailAccounts";

import { RefreshCcw, X, Database } from "lucide-react"; // opzionale

export default function QueueDashboard() {
  const [queue, setQueue] = useState([]);
  const { isOnline } = useOnlineStatus();

  // ✅ otteniamo le funzioni del hook direttamente
  const {
    addAccount,
    updateAccount,
    deleteAccount,
    setAsDefault
  } = useEmailAccounts();

  useEffect(() => {
    const loadQueue = () => setQueue(getQueue());
    loadQueue();
    const i = setInterval(loadQueue, 500);
    return () => clearInterval(i);
  }, []);

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-xl rounded-xl border border-gray-200 p-4 w-[300px] z-[9999] animate-fade">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Database className="h-4 w-4" />
          Operazioni in attesa
        </h3>

        <button className="text-gray-400 hover:text-gray-600" onClick={() => clearQueue()}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="space-y-1 max-h-[150px] overflow-y-auto">
        {queue.map((q, index) => (
          <li key={index} className="text-xs bg-gray-50 border rounded px-2 py-1 flex justify-between">
            {q.type === "addAccount" && "➕ Aggiunta account"}
            {q.type === "updateAccount" && "✏️ Modifica account"}
            {q.type === "deleteAccount" && "🗑️ Eliminazione account"}
            {q.type === "setAsDefault" && "⭐ Predefinito"}
          </li>
        ))}
      </ul>

      <button
        className={`mt-3 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
          isOnline ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
        disabled={!isOnline}
        onClick={() => {
          flushQueue(async (action) => {
            if (action.type === "addAccount") await addAccount(action.payload);
            if (action.type === "deleteAccount") await deleteAccount(action.payload);
            if (action.type === "updateAccount") await updateAccount(action.payload.id, action.payload.updates);
            if (action.type === "setAsDefault") await setAsDefault(action.payload);
          });
        }}
      >
        <RefreshCcw className="h-4 w-4" />
        Sincronizza ora
      </button>
    </div>
  );
}

