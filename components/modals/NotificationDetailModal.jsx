import React from 'react';
import { X, Calendar, User, MessageCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const NotificationDetailModal = ({ notification, onClose, onReplyClick, isAdmin }) => {
  if (!notification) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleMarkAsRead = async () => {
    if (!notification.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleMarkAsRead}
      />
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Dettagli Notifica
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(notification.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={handleMarkAsRead}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Oggetto
            </h4>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {notification.title}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Messaggio
            </h4>
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap border border-gray-100 dark:border-slate-700">
              {notification.message}
            </div>
          </div>

          {isAdmin && notification.user_id && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Utente Riferimento
              </h4>
              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <User className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                  ID Utente: {notification.user_id}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={handleMarkAsRead}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Chiudi
          </button>
          
          {isAdmin && notification.user_id && (
            <button
              onClick={() => {
                onClose();
                onReplyClick(notification.user_id);
              }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Rispondi in Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
