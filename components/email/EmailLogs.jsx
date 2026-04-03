import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import {
  Search,
  MailCheck,
  Clock,
  FileText,
  Download,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users,
  Send,
  Percent,
  CalendarClock,
  Eye,
  X,
} from "lucide-react";

const EmailLogs = () => {
  const { user } = useAuth();

  const [logs, setLogs] = useState([]); // ✅ Usa SOLO questo stato
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const logsPerPage = 10;

  /* ============================
     📥 CARICAMENTO DA SUPABASE
  ============================ */
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadLogs = async () => {
      setLoading(true);
    
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
    
        const { data, error } = await supabase
          .from("campaign_logs")
          .select(`
            id,
            campaign_id,
            user_id,
            recipient_email,
            status,
            sent_at,
            campaigns (
              campaign_name,
              subject,
              total_recipients,
              opened_count,
              sent_count,
               campaign_mode
            )
          `)
          .eq("user_id", session.user.id)
          .not('campaigns', 'is', null) // ✅ Esclude log senza campagna
          .order("sent_at", { ascending: false });
    
        if (error) {
          console.error("❌ Errore caricamento campaign_logs:", error);
          return;
        }
    
        console.log("✅ Logs caricati:", data?.length, data);
        setLogs(data || []);
      } catch (err) {
        if (err.message?.includes('Auth session missing')) return;
        console.error("❌ Errore:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadLogs();
    }, [user]);

  /* ============================
     📊 STATISTICHE
  ============================ */
  const stats = useMemo(() => {
    if (!logs.length) {
      return {
        totalSent: 0,
        totalRecipients: 0,
        avgOpenRate: 0,
        lastSent: null,
      };
    }

    const totalRecipients = logs.reduce(
      (sum, log) => sum + (log.total_recipients || 0),
      0
    );

    const totalOpened = logs.reduce(
      (sum, log) => sum + (log.opened_count || 0),
      0
    );

    return {
      totalSent: logs.length,
      totalRecipients,
      avgOpenRate:
        totalRecipients > 0
          ? Math.round((totalOpened / totalRecipients) * 100)
          : 0,
      lastSent: logs[0]?.sent_at || null,
    };
  }, [logs]);

  /* ============================
     🔍 FILTRI
  ============================ */
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

  /* ============================
     🎨 BAR COLOR
  ============================ */
  const getBarColor = (rate) => {
    if (rate >= 50) return "bg-green-500";
    if (rate >= 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  /* ============================
     🧱 RENDER
  ============================ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Caricamento logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 STATISTICHE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Email Inviate",
            value: stats.totalSent,
            icon: <Send className="w-6 h-6" />,
          },
          {
            title: "Destinatari Totali",
            value: stats.totalRecipients.toLocaleString(),
            icon: <Users className="w-6 h-6" />,
          },
          {
            title: "Media Aperture",
            value: `${stats.avgOpenRate}%`,
            icon: <Percent className="w-6 h-6" />,
          },
          {
            title: "Ultimo Invio",
            value: stats.lastSent
              ? new Date(stats.lastSent).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "—",
            icon: <CalendarClock className="w-6 h-6" />,
            large: false, // ✅ Testo più piccolo
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white p-6 rounded-lg shadow-sm border flex items-center"
          >
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              {item.icon}
            </div>
            <div className="ml-4 min-w-0 flex-1"> {/* ✅ min-w-0 flex-1 per gestire overflow */}
              <p className="text-sm text-gray-600 whitespace-nowrap">{item.title}</p>
              <p className={`${item.large ? 'text-2xl' : 'text-lg'} font-bold whitespace-nowrap`}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔍 FILTRI E RICERCA */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per oggetto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tutti gli stati</option>
            <option value="sent">Inviati</option>
            <option value="draft">Bozze</option>
            <option value="failed">Falliti</option>
          </select>
        </div>
      </div>

      {/* 📄 LISTA LOG */}
      <div className="bg-white rounded-lg shadow-sm border divide-y">
        {currentLogs.length ? (
          currentLogs.map((log) => {
            const recipientsCount = log.total_recipients || 0;
            const openedCount = log.opened_count || 0;
            const openRate =
              recipientsCount > 0
                ? Math.round((openedCount / recipientsCount) * 100)
                : 0;

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="p-6 flex justify-between hover:bg-blue-50 cursor-pointer transition"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    {log.campaigns?.campaign_name || log.campaigns?.subject || '—'}

                    {/* ✅ Badge tipo campagna */}
                    {log.campaigns?.campaign_mode && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.campaigns.campaign_mode === 'builder'
                          ? 'bg-green-100 text-green-700'
                          : log.campaigns.campaign_mode === 'template'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                        {log.campaigns.campaign_mode === 'builder' ? '🧩 Builder' :
                          log.campaigns.campaign_mode === 'template' ? '📄 Template' :
                            '✏️ Standard'}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    📧 {log.recipient_email} •{" "}
                    {new Date(log.sent_at).toLocaleDateString("it-IT", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                    {" • "}
                    <span className={log.status === "sent" ? "text-green-600" : "text-red-600"}>
                      {log.status === "sent" ? "Inviato" : "Fallito"}
                    </span>
                  </p>
                </div>

                <div className="w-40">
                  <div className="text-xs flex justify-between mb-1">
                    <span className="text-gray-600">Aperture</span>
                    <span className="font-semibold">{openRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${getBarColor(
                        openRate
                      )}`}
                      style={{ width: `${openRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {openedCount} / {recipientsCount} aperti
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nessun invio trovato</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || filter !== "all"
                ? "Prova a modificare i filtri"
                : "Inizia inviando la tua prima campagna"}
            </p>
          </div>
        )}
      </div>

      {/* 📄 PAGINAZIONE */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-600">
            Pagina {currentPage} di {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

{selectedLog && (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={() => setSelectedLog(null)}
  >
    <div
      className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{selectedLog.subject}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(selectedLog.sent_at).toLocaleString("it-IT")}
          </p>
        </div>
        <button
          onClick={() => setSelectedLog(null)}
          className="p-2 hover:bg-white/50 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* 🔍 DEBUG: Mostra i dati grezzi */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-semibold mb-2">🐛 DEBUG:</p>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Destinatari</p>
            <p className="text-2xl font-bold text-blue-600">
              {selectedLog.total_recipients || 0}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Aperture</p>
            <p className="text-2xl font-bold text-green-600">
              {selectedLog.opened_count || 0}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Tasso</p>
            <p className="text-2xl font-bold text-purple-600">
              {selectedLog.total_recipients > 0
                ? Math.round(
                    ((selectedLog.opened_count || 0) / selectedLog.total_recipients) * 100
                  )
                : 0}
              %
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Stato</p>
            <p className={`text-2xl font-bold ${
              selectedLog.status === "sent" ? "text-green-600" : "text-red-600"
            }`}>
              {selectedLog.status === "sent" ? "✓" : "✗"}
            </p>
          </div>
        </div>

        {/* Lista Destinatari */}
        {selectedLog.recipients && Array.isArray(selectedLog.recipients) && selectedLog.recipients.length > 0 ? (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MailCheck className="w-5 h-5 text-green-600" />
              Destinatari ({selectedLog.recipients.length})
            </h4>
            <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              {selectedLog.recipients.map((email, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ️ Recipients: {selectedLog.recipients ? 
                (Array.isArray(selectedLog.recipients) ? 
                  `Array vuoto (${selectedLog.recipients.length})` : 
                  `Tipo: ${typeof selectedLog.recipients}`) 
                : 'null/undefined'}
            </p>
          </div>
        )}

        {/* Lista Falliti */}
        {selectedLog.failed_recipients && Array.isArray(selectedLog.failed_recipients) && selectedLog.failed_recipients.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Invii Falliti ({selectedLog.failed_recipients.length})
            </h4>
            <div className="bg-red-50 rounded-lg border border-red-200 max-h-64 overflow-y-auto">
              {selectedLog.failed_recipients.map((item, idx) => (
                <div key={idx} className="px-4 py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm">
                      {(item.email || item).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium block">
                        {item.email || item}
                      </span>
                      {item.error && (
                        <span className="text-xs text-red-600">{item.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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