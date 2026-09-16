import React, { useState, useEffect } from 'react';
import { Clock, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SessionTimeoutWarningModal = ({ show, onContinue, onLogoutImmediately, timeoutMinutes = 60 }) => {
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (!show) {
      setSecondsLeft(60);
      return;
    }

    setSecondsLeft(60);
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogoutImmediately();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, onLogoutImmediately]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[9999999] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 text-center p-6 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Animated Icon & Countdown Badge */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex flex-col items-center justify-center shadow-xl border-4 border-white dark:border-slate-800">
            <span className="text-2xl font-black">{secondsLeft}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">sec</span>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Sessione in Scadenza per Inattività
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Sei stato inattivo per <strong>{timeoutMinutes} minuti</strong>.
            La piattaforma disconnetterà automaticamente il tuo profilo tra <strong className="text-amber-600 dark:text-amber-400 text-sm">{secondsLeft} secondi</strong>.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-gray-200 dark:border-slate-700">
          <div 
            className="bg-gradient-to-r from-amber-500 to-orange-600 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(secondsLeft / 60) * 100}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onLogoutImmediately}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-gray-200 dark:border-slate-700"
          >
            <LogOut className="w-4 h-4" /> Esci Subito
          </button>
          
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transform hover:scale-102"
          >
            <RefreshCw className="w-4 h-4" /> Continua Sessione
          </button>
        </div>

      </div>
    </div>
  );
};

export default SessionTimeoutWarningModal;
