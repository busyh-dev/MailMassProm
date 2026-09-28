import React, { useState, useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, Search, UserCheck, Users, Filter } from 'lucide-react';
import { buildMatchingReport } from '../../lib/matchAttachments';

export default function MatchPreviewModal({ isOpen, onClose, contacts = [], attachments = [], matchMode = 'auto' }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'matched', 'unmatched'

  // Calcola il report di matching
  const matchingData = useMemo(() => {
    if (!isOpen) return { report: [], summary: { totalContacts: 0, matchedCount: 0, unmatchedCount: 0, matchPercentage: 0 } };
    return buildMatchingReport(contacts, attachments, { matchMode });
  }, [isOpen, contacts, attachments, matchMode]);

  const { report, summary } = matchingData;

  // Filtra la tabella
  const filteredReport = useMemo(() => {
    return report.filter((item) => {
      const matchSearch =
        [item.name, item.email, item.codiceFiscale, ...(item.matchedFilenames || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filter === 'matched') return item.hasMatch;
      if (filter === 'unmatched') return !item.hasMatch;
      return true;
    });
  }, [report, search, filter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Anteprima Smistamento Attestati Nominativi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Verifica l'abbinamento automatico tra i destinatari e i file PDF allegati
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Totale Destinatari</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.totalContacts}</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/40 shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">
              <span>Attestato Abbinato</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary.matchedCount}</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-amber-100 dark:border-amber-950/40 shadow-sm">
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1 font-medium">
              <span>Senza Attestato</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary.unmatchedCount}</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-blue-100 dark:border-blue-950/40 shadow-sm">
            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
              <span>Copertura Match</span>
              <UserCheck className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.matchPercentage}%</span>
          </div>
        </div>

        {/* Toolbar Filtri */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca discente, email o codice fiscale..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Tutti ({summary.totalContacts})
            </button>
            <button
              onClick={() => setFilter('matched')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'matched'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Abbinati ({summary.matchedCount})
            </button>
            <button
              onClick={() => setFilter('unmatched')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filter === 'unmatched'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Non Abbinati ({summary.unmatchedCount})
            </button>
          </div>
        </div>

        {/* Tabella Elenco Matching */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredReport.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Nessun destinatario corrisponde ai criteri di ricerca</p>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Discente / Destinatario</th>
                    <th className="px-4 py-3">Codice Fiscale</th>
                    <th className="px-4 py-3">Attestato PDF Abbinato</th>
                    <th className="px-4 py-3 text-center">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {filteredReport.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</div>
                        <div className="text-gray-400 font-mono text-[11px]">{row.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">
                        {row.codiceFiscale ? (
                          <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                            {row.codiceFiscale}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Non specificato</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.hasMatch ? (
                          <div className="space-y-1">
                            {row.matchedFilenames.map((fname, fidx) => (
                              <div
                                key={fidx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-medium"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="truncate max-w-[250px]">{fname}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic">
                            Nessun PDF corrispondente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.hasMatch ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                            <CheckCircle className="w-3 h-3" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> Senza Allegato
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Modalità di riscontro: <span className="font-semibold text-gray-700 dark:text-gray-300">{matchMode.toUpperCase()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Chiudi Anteprima
          </button>
        </div>

      </div>
    </div>
  );
}
