import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Monitor, 
  Globe, 
  Clock, 
  LogOut, 
  ArrowRight, 
  ShieldAlert, 
  X,
  Loader2
} from 'lucide-react';

/**
 * SessionConflictModal Component
 * Mostrato quando l'utente tenta di accedere ma ha già una sessione attiva da un altro IP / PC.
 */
const SessionConflictModal = ({ 
  show, 
  activeSession, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}) => {
  if (!show) return null;

  // Formattazione data dell'ultima attività
  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Di recente';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch (e) {
      return 'Di recente';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-amber-200 dark:border-amber-900/50"
        >
          {/* Header con gradiente d'impatto */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white relative">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shrink-0">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 mb-1 text-[11px] font-black tracking-wider uppercase bg-white/20 rounded-full border border-white/30 text-white">
                  Connessione Multipla Rilevata
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Utente connesso da altro PC in rete
                </h3>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Rilevata una sessione di lavoro attiva su un altro computer o indirizzo IP con le stesse credenziali d'accesso.
            </p>

            {/* Scheda dettaglio sessione remota */}
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-2">
                <span className="text-xs font-bold text-amber-800 dark:amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Dettagli Connessione Attiva Remota
                </span>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-md">
                  In uso ora
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* IP Address */}
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Indirizzo IP:</div>
                    <div className="font-mono text-slate-900 dark:text-white font-bold">
                      {activeSession?.ipAddress || 'Sconosciuto'}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2.5">
                  <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Posizione / Network:</div>
                    <div className="text-slate-900 dark:text-white font-medium">
                      {activeSession?.location || 'Rete Locale'}
                    </div>
                  </div>
                </div>

                {/* Ultima Attività */}
                <div className="flex items-start gap-2.5 col-span-1 sm:col-span-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Ultima attività registrata:</div>
                    <div className="text-slate-900 dark:text-white font-medium">
                      {formatLastActivity(activeSession?.lastActivity)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Domanda di conferma principale */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
              <p className="text-sm font-semibold text-slate-900 dark:text-white text-center">
                Vuoi disconnettere il precedente e ricollegarti con questo collegamento?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                Confermando, la sessione aperta sul precedente PC verrà chiusa immediatamente.
              </p>
            </div>
          </div>

          {/* Footer Azioni */}
          <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-1/2 px-5 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              Annulla Accesso
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-1/2 px-5 py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transform active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disconnessione in corso...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sì, Disconnetti e Accedi
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SessionConflictModal;
