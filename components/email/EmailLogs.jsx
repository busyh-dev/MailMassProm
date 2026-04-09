import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import * as XLSX from 'xlsx';
import {
  Search, MailCheck, Clock, FileText, Download,
  Trash2, AlertTriangle, ChevronLeft, ChevronRight,
  Users, Send, Percent, CalendarClock, Eye, X,
} from "lucide-react";

const EmailLogs = ({ logsProp, logsLoadingProp }) => {
  const { user } = useAuth();

  const [logs, setLogs] = useState(logsProp || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(logsLoadingProp ?? true);
  const logsPerPage = 10;

  // ✅ Sincronizza dalle props
  useEffect(() => {
    if (logsProp) setLogs(logsProp);
  }, [logsProp]);

  useEffect(() => {
    if (logsLoadingProp !== undefined) setLoading(logsLoadingProp);
  }, [logsLoadingProp]);

  // ❌ RIMOSSO: il vecchio useEffect con loadLogs

  const stats = useMemo(() => {
    if (!logs.length) return { totalSent: 0, totalRecipients: 0, avgOpenRate: 0, lastSent: null };

    const totalRecipients = logs.reduce((sum, log) => sum + (log.total_recipients || 0), 0);
    const totalOpened = logs.reduce((sum, log) => sum + (log.opened_count || 0), 0);

    return {
      totalSent: logs.length,
      totalRecipients,
      avgOpenRate: totalRecipients > 0 ? Math.round((totalOpened / totalRecipients) * 100) : 0,
      lastSent: logs[0]?.sent_at || null,
    };
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const subject = log.campaigns?.subject || log.campaigns?.campaign_name || "";
    const matchSearch = subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filter === "all" || log.status === filter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const getBarColor = (rate) => {
    if (rate >= 50) return "bg-green-500";
    if (rate >= 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-semibold text-lg">Caricamento storico invii</p>
          <p className="text-gray-400 text-sm mt-1">Stiamo recuperando i tuoi log email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
  
      {/* 🔝 HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storico Invii</h2>
          <p className="text-sm text-gray-500 mt-1">Cronologia completa delle email inviate</p>
        </div>
        <div className="flex items-center gap-2">
        <button
  onClick={() => {
    const rows = filteredLogs.map((log, i) => ({
      '#': i + 1,
      'Campagna': log.campaigns?.campaign_name || '—',
      'Oggetto': log.campaigns?.subject || '—',
      'Destinatario': log.recipient_email || '—',
      'Stato': log.status === 'sent' ? 'Inviato' : 'Fallito',
      'Tipo': log.campaigns?.campaign_mode === 'builder' ? 'Builder' :
              log.campaigns?.campaign_mode === 'template' ? 'Template' : 'Standard',
      'Destinatari Totali': log.campaigns?.total_recipients || 0,
      'Aperture': log.campaigns?.opened_count || 0,
      'Tasso Apertura %': log.campaigns?.total_recipients > 0
        ? Math.round(((log.campaigns?.opened_count || 0) / log.campaigns.total_recipients) * 100)
        : 0,
      'Data Invio': log.sent_at ? new Date(log.sent_at).toLocaleString('it-IT') : '—',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // ✅ Larghezza colonne
    ws['!cols'] = [
      { wch: 5 },   // #
      { wch: 30 },  // Campagna
      { wch: 30 },  // Oggetto
      { wch: 35 },  // Destinatario
      { wch: 12 },  // Stato
      { wch: 12 },  // Tipo
      { wch: 18 },  // Destinatari Totali
      { wch: 12 },  // Aperture
      { wch: 18 },  // Tasso Apertura %
      { wch: 20 },  // Data Invio
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Storico Invii');
    XLSX.writeFile(wb, `storico_invii_${new Date().toISOString().split('T')[0]}.xlsx`);
  }}
  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
>
  <Download className="w-4 h-4" />
  Esporta XLSX
</button>
  
          {/* Esporta PDF/Stampa */}
          <button
            onClick={() => {
              const printWindow = window.open('', '_blank');
              const now = new Date().toLocaleString('it-IT');
              printWindow.document.write(`
                <html>
                <head>
                  <title>Storico Invii - ${now}</title>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; }
                    .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .header h1 { font-size: 24px; font-weight: 700; color: #1e3a8a; }
                    .header .meta { font-size: 12px; color: #6b7280; text-align: right; }
                    .stats { display: flex; gap: 16px; margin-bottom: 28px; }
                    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; flex: 1; text-align: center; }
                    .stat .value { font-size: 22px; font-weight: 700; color: #2563eb; }
                    .stat .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
                    table { width: 100%; border-collapse: collapse; }
                    thead tr { background: #1e3a8a; }
                    thead th { color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
                    tbody tr { border-bottom: 1px solid #f3f4f6; }
                    tbody tr:nth-child(even) { background: #f8fafc; }
                    tbody td { padding: 10px 12px; font-size: 12px; color: #374151; }
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
                    .badge-sent { background: #dcfce7; color: #166534; }
                    .badge-failed { background: #fee2e2; color: #991b1b; }
                    .badge-standard { background: #dbeafe; color: #1e40af; }
                    .badge-builder { background: #dcfce7; color: #166534; }
                    .badge-template { background: #f3e8ff; color: #6b21a8; }
                    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
                    @media print { body { padding: 20px; } }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <div>
                      <h1>📧 Storico Invii Email</h1>
                      <p style="margin-top:4px; font-size:13px; color:#6b7280;">Report generato automaticamente</p>
                    </div>
                    <div class="meta">
                      <div>Data: ${now}</div>
                      <div>Totale log: ${filteredLogs.length}</div>
                    </div>
                  </div>
                  <div class="stats">
                    <div class="stat"><div class="value">${stats.totalSent}</div><div class="label">Email Inviate</div></div>
                    <div class="stat"><div class="value">${stats.totalRecipients.toLocaleString('it-IT')}</div><div class="label">Destinatari</div></div>
                    <div class="stat"><div class="value">${stats.avgOpenRate}%</div><div class="label">Media Aperture</div></div>
                    <div class="stat"><div class="value">${stats.lastSent ? new Date(stats.lastSent).toLocaleDateString('it-IT') : '—'}</div><div class="label">Ultimo Invio</div></div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Campagna</th>
                        <th>Destinatario</th>
                        <th>Stato</th>
                        <th>Tipo</th>
                        <th>Data Invio</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredLogs.map((log, i) => `
                        <tr>
                          <td style="color:#9ca3af">${i + 1}</td>
                          <td><strong>${log.campaigns?.campaign_name || log.campaigns?.subject || '—'}</strong></td>
                          <td>${log.recipient_email || '—'}</td>
                          <td><span class="badge ${log.status === 'sent' ? 'badge-sent' : 'badge-failed'}">${log.status === 'sent' ? 'Inviato' : 'Fallito'}</span></td>
                          <td><span class="badge badge-${log.campaigns?.campaign_mode || 'standard'}">${
                            log.campaigns?.campaign_mode === 'builder' ? '🧩 Builder' :
                            log.campaigns?.campaign_mode === 'template' ? '📄 Template' : '✏️ Standard'
                          }</span></td>
                          <td style="color:#6b7280; font-size:11px">${log.sent_at ? new Date(log.sent_at).toLocaleString('it-IT') : '—'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <div class="footer">Generato da MailMassProm · ${now}</div>
                </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => printWindow.print(), 500);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <FileText className="w-4 h-4" />
            Stampa/PDF
          </button>
        </div>
      </div>
  
      {/* 📊 STATISTICHE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[
    { title: "Email Inviate", value: stats.totalSent, icon: <Send className="w-5 h-5" />, color: "bg-blue-100 text-blue-600" },
    { title: "Destinatari Totali", value: stats.totalRecipients.toLocaleString(), icon: <Users className="w-5 h-5" />, color: "bg-green-100 text-green-600" },
    { title: "Media Aperture", value: `${stats.avgOpenRate}%`, icon: <Percent className="w-5 h-5" />, color: "bg-purple-100 text-purple-600" },
    {
      title: "Ultimo Invio",
      value: stats.lastSent ? new Date(stats.lastSent).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—",
      icon: <CalendarClock className="w-5 h-5" />,
      color: "bg-orange-100 text-orange-600",
    },
  ].map((item) => (
    <div key={item.title} className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-full flex-shrink-0 ${item.color}`}>
          {item.icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{item.title}</p>
          <p className="text-lg font-bold text-gray-900 truncate">{item.value}</p>
        </div>
      </div>
    </div>
  ))}
</div>
  
      {/* 🔍 FILTRI E RICERCA */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per campagna o oggetto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tutti gli stati</option>
            <option value="sent">✅ Inviati</option>
            <option value="failed">❌ Falliti</option>
          </select>
          {(searchTerm || filter !== "all") && (
            <button
              onClick={() => { setSearchTerm(''); setFilter('all'); setCurrentPage(1); }}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm transition"
            >
              <X className="w-4 h-4" /> Reset
            </button>
          )}
          <span className="ml-auto text-sm text-gray-500 self-center">
            {filteredLogs.length} risultati
          </span>
        </div>
      </div>
  
      {/* 📄 LISTA LOG */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {currentLogs.length ? (
          currentLogs.map((log) => {
            const recipientsCount = log.campaigns?.total_recipients || 0;
            const openedCount = log.campaigns?.opened_count || 0;
            const openRate = recipientsCount > 0 ? Math.round((openedCount / recipientsCount) * 100) : 0;
  
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="p-5 flex justify-between items-center hover:bg-blue-50 cursor-pointer transition group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    log.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {log.status === 'sent' ? <Send className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {log.campaigns?.campaign_name || log.campaigns?.subject || '—'}
                      </h3>
                      {log.campaigns?.campaign_mode && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          log.campaigns.campaign_mode === 'builder' ? 'bg-green-100 text-green-700' :
                          log.campaigns.campaign_mode === 'template' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.campaigns.campaign_mode === 'builder' ? '🧩 Builder' :
                           log.campaigns.campaign_mode === 'template' ? '📄 Template' : '✏️ Standard'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      📧 {log.recipient_email} • {new Date(log.sent_at).toLocaleString("it-IT", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
  
                <div className="w-36 ml-4 flex-shrink-0">
                  <div className="text-xs flex justify-between mb-1">
                    <span className="text-gray-500">Aperture</span>
                    <span className="font-semibold text-gray-700">{openRate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-1.5 rounded-full ${getBarColor(openRate)}`} style={{ width: `${openRate}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{openedCount}/{recipientsCount} aperti</div>
                </div>
  
                <Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-500 ml-3 flex-shrink-0 transition" />
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">Nessun invio trovato</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || filter !== "all" ? "Prova a modificare i filtri" : "Inizia inviando la tua prima campagna"}
            </p>
          </div>
        )}
      </div>
  
      {/* 📄 PAGINAZIONE */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 text-sm">⏮️</button>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 px-2">Pagina <strong>{currentPage}</strong> di {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 text-sm">⏭️</button>
        </div>
      )}
  
      {/* 🔍 MODAL DETTAGLIO */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedLog.campaigns?.campaign_name || selectedLog.campaigns?.subject || '—'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{new Date(selectedLog.sent_at).toLocaleString("it-IT")}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/70 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Destinatari</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedLog.campaigns?.total_recipients || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Aperture</p>
                  <p className="text-2xl font-bold text-green-600">{selectedLog.campaigns?.opened_count || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Tasso Apertura</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedLog.campaigns?.total_recipients > 0
                      ? Math.round(((selectedLog.campaigns?.opened_count || 0) / selectedLog.campaigns.total_recipients) * 100)
                      : 0}%
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${selectedLog.status === 'sent' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-gray-500">Stato</p>
                  <p className={`text-2xl font-bold ${selectedLog.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedLog.status === 'sent' ? '✓ Inviato' : '✗ Fallito'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Destinatario</p>
                <p className="text-sm font-medium text-gray-900">{selectedLog.recipient_email}</p>
              </div>
              {selectedLog.campaigns?.subject && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Oggetto</p>
                  <p className="text-sm font-medium text-gray-900">{selectedLog.campaigns.subject}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;