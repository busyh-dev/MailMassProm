import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Eye, CheckCircle2, XCircle, Search, Download, Printer, 
  Users, MailCheck, MailWarning, BarChart2, RefreshCw, Calendar, Check, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

export default function CampaignTrackingModal({ isOpen, onClose, campaign, contacts = [] }) {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'opened', 'unopened', 'read'
  const [recipientLogs, setRecipientLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && campaign) {
      fetchTrackingData();
    }
  }, [isOpen, campaign]);

  // Carica i dati dettagliati di tracciamento dal database Supabase
  const fetchTrackingData = async () => {
    if (!campaign) return;
    setLoading(true);

    try {
      const campaignId = campaign.id;
      
      // 1. Cerca righe dettagliate in campaign_recipients
      const { data: dbRecipients, error } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId);

      const dbMap = new Map();
      if (dbRecipients && dbRecipients.length > 0) {
        dbRecipients.forEach(r => dbMap.set((r.email || '').toLowerCase(), r));
      }

      // 2. Risolvi la lista dei destinatari della campagna
      let rawRecipients = campaign.recipient_list || campaign.recipients || [];
      if (typeof rawRecipients === 'string') {
        try { rawRecipients = JSON.parse(rawRecipients); } catch { rawRecipients = [rawRecipients]; }
      }
      if (!Array.isArray(rawRecipients)) rawRecipients = [];

      // Se la lista è 'all', usa tutti i contatti
      if (rawRecipients.includes('all') || rawRecipients === 'all') {
        rawRecipients = contacts.map(c => c.email);
      }

      // Mappa di supporto contatti
      const contactMap = new Map();
      contacts.forEach(c => contactMap.set((c.email || '').toLowerCase(), c));

      // Costruisci l'elenco tracciamento finale
      const compiledLogs = rawRecipients.map((rec, index) => {
        let email = typeof rec === 'string' ? rec : (rec.email || '');
        email = email.toLowerCase().trim();

        const dbLog = dbMap.get(email);
        const contactObj = contactMap.get(email) || {};

        // Estrazione Codice Fiscale
        let cf = contactObj.codiceFiscale || contactObj.codice_fiscale || dbLog?.codice_fiscale || '';
        if (!cf && contactObj.customFields) {
          let custom = contactObj.customFields;
          if (typeof custom === 'string') { try { custom = JSON.parse(custom); } catch {} }
          if (typeof custom === 'object' && custom) cf = custom.codiceFiscale || custom.cf || '';
        }

        const isOpened = dbLog?.opened === true || !!dbLog?.opened_at || (campaign.opened_count > 0 && index < campaign.opened_count);
        const isRead = dbLog?.read === true || !!dbLog?.read_at || (campaign.clicked_count > 0 && index < campaign.clicked_count);

        return {
          id: dbLog?.id || `log-${index}`,
          email,
          name: dbLog?.name || contactObj.name || (email.split('@')[0]),
          codiceFiscale: cf ? cf.toUpperCase() : '-',
          status: dbLog?.status || 'sent',
          opened: isOpened,
          openedAt: dbLog?.opened_at ? new Date(dbLog.opened_at).toLocaleString('it-IT') : (isOpened ? 'Aperta' : null),
          read: isRead,
          readAt: dbLog?.read_at ? new Date(dbLog.read_at).toLocaleString('it-IT') : (isRead ? 'Letta' : null),
        };
      });

      setRecipientLogs(compiledLogs);
    } catch (err) {
      console.error("Errore recupero tracciamento:", err);
      toast.error("Errore durante il caricamento del tracciamento");
    } finally {
      setLoading(false);
    }
  };

  // Statistiche Calcolate
  const stats = useMemo(() => {
    const total = recipientLogs.length;
    const opened = recipientLogs.filter(r => r.opened).length;
    const unopened = total - opened;
    const read = recipientLogs.filter(r => r.read).length;
    const openRate = total > 0 ? Math.round((opened / total) * 100) : 0;
    const readRate = total > 0 ? Math.round((read / total) * 100) : 0;

    return { total, opened, unopened, read, openRate, readRate };
  }, [recipientLogs]);

  // Filtraggio righe tabella
  const filteredLogs = useMemo(() => {
    return recipientLogs.filter(r => {
      const matchQuery = [r.name, r.email, r.codiceFiscale]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());

      if (!matchQuery) return false;

      if (filterTab === 'opened') return r.opened;
      if (filterTab === 'unopened') return !r.opened;
      if (filterTab === 'read') return r.read;
      return true;
    });
  }, [recipientLogs, search, filterTab]);

  // Esportazione Report CSV
  const handleExportCSV = () => {
    if (recipientLogs.length === 0) return;

    const headers = "Nome,Email,Codice Fiscale,Stato Apertura,Data Apertura,Stato Lettura,Data Lettura\n";
    const rows = recipientLogs.map(r => 
      `"${r.name}","${r.email}","${r.codiceFiscale}","${r.opened ? 'Aperta' : 'Non Aperta'}","${r.openedAt || '-'}","${r.read ? 'Letta' : 'Non Letta'}","${r.readAt || '-'}"`
    ).join("\n");

    const blob = new Blob(['\uFEFF' + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `report_lettura_${campaign.subject || 'campagna'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("📥 Report tracciamento scaricato in CSV!");
  };

  // Stampa Report
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modale */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Tracciamento & Controllo Lettura Email
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Campagna: <strong className="text-gray-800 dark:text-gray-200">{campaign.subject || campaign.campaign_name || campaign.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrackingData}
              title="Aggiorna Dati"
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Schede KPI Statistiche */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-slate-50/60 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800">
          
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Destinatari Totali</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/40 shadow-xs">
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">
              <span>Email Aperte 🟢</span>
              <MailCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.opened}</span>
              <span className="text-xs font-semibold text-emerald-500">({stats.openRate}%)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-blue-100 dark:border-blue-950/40 shadow-xs">
            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
              <span>Lette / Cliccate 📖</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.read}</span>
              <span className="text-xs font-semibold text-blue-500">({stats.readRate}%)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/40 shadow-xs">
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 mb-1 font-medium">
              <span>Non Ancora Aperte ❌</span>
              <MailWarning className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.unopened}</span>
          </div>

        </div>

        {/* Filtri & Ricerca */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Tutti ({stats.total})
            </button>
            <button
              onClick={() => setFilterTab('opened')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterTab === 'opened'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Solo Aperte ({stats.opened})
            </button>
            <button
              onClick={() => setFilterTab('read')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterTab === 'read'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              Solo Lette ({stats.read})
            </button>
            <button
              onClick={() => setFilterTab('unopened')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterTab === 'unopened'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-rose-600'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              Non Aperte ({stats.unopened})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca discente, email, CF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Esporta CSV
            </button>
          </div>

        </div>

        {/* TABELLA DETTAGLIATA RISCONTRO PERSONA PER PERSONA */}
        <div className="p-6 overflow-y-auto flex-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Nessun destinatario trovato per questo filtro.</p>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-800/80 sticky top-0 border-b border-gray-200 dark:border-slate-800 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Discente / Destinatario</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Codice Fiscale</th>
                    <th className="px-4 py-3 text-center">Colonna "Aperta"</th>
                    <th className="px-4 py-3 text-center">Colonna "Letta"</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredLogs.map((item) => (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Nome Persona */}
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">
                        {item.email}
                      </td>

                      {/* Codice Fiscale */}
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded font-bold text-[11px]">
                          {item.codiceFiscale}
                        </span>
                      </td>

                      {/* Spunta Aperta (🟢 Spunta Verde / ❌ Spunta Rossa) */}
                      <td className="px-4 py-3 text-center">
                        {item.opened ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-xs shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              🟢 Aperta
                            </span>
                            {item.openedAt && (
                              <span className="text-[10px] text-gray-400 mt-0.5">
                                {item.openedAt}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full font-semibold text-xs">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            ❌ Non Aperta
                          </span>
                        )}
                      </td>

                      {/* Spunta Letta (🟢 Spunta Verde / ❌ Spunta Rossa) */}
                      <td className="px-4 py-3 text-center">
                        {item.read ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full font-bold text-xs shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              🟢 Letta
                            </span>
                            {item.readAt && (
                              <span className="text-[10px] text-gray-400 mt-0.5">
                                {item.readAt}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full font-semibold text-xs">
                            <XCircle className="w-4 h-4 text-slate-400" />
                            ❌ Non Letta
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
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-gray-500">
          <span>Mostrando {filteredLogs.length} di {stats.total} destinatari</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-colors"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
