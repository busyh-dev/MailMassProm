// components/OnlineStatusToaster.jsx
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { flushQueue } from "../hooks/queuedRequests";
import { useEmailAccounts } from "../hooks/useEmailAccounts";

export default function OnlineStatusToaster() {
  const { isOnline } = useOnlineStatus();
  const firstRender = useRef(true);

  // Stato per il progresso della sincronizzazione
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncCurrent, setSyncCurrent] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false); // Per sapere se stiamo sincronizzando
  const [errorCount, setErrorCount] = useState(0); // Per contare gli errori
  const [failedActions, setFailedActions] = useState([]); // Operazioni fallite

  const { addAccount, updateAccount, deleteAccount, setAsDefault } =
    useEmailAccounts();

    useEffect(() => {
      // 🧠 stato persistente: l’ultimo stato conosciuto della connessione
      const prevOnline = window.__wasOnline;
    
      // Al primo render, memorizziamo lo stato attuale ma NON mostriamo nulla
      if (firstRender.current) {
        firstRender.current = false;
        window.__wasOnline = isOnline;
        return;
      }
    
      // Se lo stato NON è cambiato, non fare nulla
      if (prevOnline === isOnline) return;
    
      // Aggiorniamo lo stato globale
      window.__wasOnline = isOnline;
    
      // 🔴 Se si è disconnesso
      if (!isOnline) {
        toast.error("Sei offline ❌");
        return;
      }
    
      // ✅ Se è tornato online (cioè prima era offline)
      toast.success("Connessione ripristinata ✅");
    
      // --- Se vuoi, qui puoi richiamare flushQueue ---
      const queue = JSON.parse(localStorage.getItem("emailActionQueue") || "[]");
      if (!queue.length) return;
    
      setSyncProgress(0);
      setSyncCurrent(0);
      setSyncTotal(queue.length);
      setErrorCount(0);
      setFailedActions([]);
      setIsSyncing(true);
    
      toast.loading("Sincronizzazione operazioni salvate...", { id: "sync-queue" });
    
      let processed = 0;
    
      const updateProgress = () => {
        setSyncProgress(Math.round((processed / queue.length) * 100));
      };
    
      flushQueue(async (action) => {
        processed++;
        updateProgress();
        try {
          switch (action.type) {
            case "addAccount":
              await addAccount(action.payload);
              break;
            case "updateAccount":
              await updateAccount(action.payload.id, action.payload.updates);
              break;
            case "deleteAccount":
              await deleteAccount(action.payload);
              break;
            case "setAsDefault":
              await setAsDefault(action.payload);
              break;
            default:
              break;
          }
        } catch (error) {
          setErrorCount((p) => p + 1);
          setFailedActions((p) => [...p, { action, error: error.message }]);
        }
      }).finally(() => {
        setIsSyncing(false);
        toast.dismiss("sync-queue");
        if (processed > 0) toast.success(`✅ Sincronizzazione completata (${processed} operazioni)`);
        if (errorCount > 0) toast.error(`❌ ${errorCount} operazioni fallite`);
      });
    }, [isOnline]);

  // Funzione per ritentare le operazioni fallite al ritorno online
  useEffect(() => {
    if (isOnline && failedActions.length > 0) {
      // Attiviamo il retry quando la connessione torna online
      retryFailedActions();
    }
  }, [isOnline, failedActions]);

  // Funzione di retry per le operazioni fallite
  const retryFailedActions = () => {
    let retryCount = 0;
    let failed = [...failedActions]; // Copia della lista di falliti

    failed.forEach(async ({ action, attempts }) => {
      if (attempts < 3) {
        try {
          // Tentiamo l'operazione
          switch (action.type) {
            case "addAccount":
              await addAccount(action.payload);
              toast.success("✅ Retry Account aggiunto");
              retryCount++;
              break;
            case "updateAccount":
              await updateAccount(action.payload.id, action.payload.updates);
              toast.success("✏️ Retry Account aggiornato");
              retryCount++;
              break;
            case "deleteAccount":
              await deleteAccount(action.payload);
              toast.success("🗑️ Retry Account eliminato");
              retryCount++;
              break;
            case "setAsDefault":
              await setAsDefault(action.payload);
              toast.success("⭐ Retry Impostato come predefinito");
              retryCount++;
              break;
            default:
              break;
          }
          // Aumenta il tentativo
          action.attempts += 1;
        } catch (error) {
          // Incrementa solo se fallisce
          action.attempts += 1;
          toast.error(`❌ Retry fallito per ${action.type}: ${error.message}`);
        }
      }
    });

    // Se tutti i tentativi sono stati completati
    if (retryCount === failedActions.length) {
      setFailedActions([]); // Reset della lista
    }
  };

  return (
    <>
      {/* Barra di avanzamento sincronizzazione */}
      {isSyncing && syncTotal > 0 && (
        <div className="fixed bottom-16 left-4 right-4 bg-blue-600 text-white p-2 rounded-md shadow-md">
          <div className="flex justify-between items-center">
            <span>Sincronizzazione: {syncProgress}%</span>
            <div className="w-full bg-gray-300 rounded-full h-2 ml-2">
              <div
                className="bg-green-500 h-2 rounded-full progress-bar"
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
