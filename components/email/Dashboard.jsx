import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Mail, Users, Send, BarChart3, Globe, Filter, ChevronDown, UserCheck } from "lucide-react";
import { usePermissions } from "../../src/contexts/PermissionsContext";
import { useAuth } from "../../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();

  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtro account per il superadmin
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(""); // "" = Tutti gli account
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Carica lista account (solo per SuperAdmin)
  const fetchAccounts = useCallback(async () => {
    if (!isSuperAdmin || !user?.id) return;
    setAccountsLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts-list?user_id=${user.id}`);
      const json = await res.json();
      if (json.success) setAccounts(json.data || []);
    } catch (e) {
      console.error("Errore fetch accounts:", e);
    } finally {
      setAccountsLoading(false);
    }
  }, [isSuperAdmin, user?.id]);

  // Carica i dati (Campagne + Contatti)
  const loadData = useCallback(async (accountIdToFilter = "") => {
    if (!user?.id) return;
    setLoading(true);

    try {
      if (isSuperAdmin) {
        // --- LOGICA SUPERADMIN ---
        // Se è SuperAdmin, usiamo le API dedicate che aggregano i dati
        const urlParams = `?user_id=${user.id}${accountIdToFilter ? `&filter_user_id=${accountIdToFilter}` : ""}`;
        
        const [campRes, contRes] = await Promise.all([
          fetch(`/api/admin/campaigns-all${urlParams}`).then(r => r.json()),
          fetch(`/api/admin/contacts-all${urlParams}`).then(r => r.json())
        ]);

        setCampaigns(campRes.success ? campRes.data : []);
        setContacts(contRes.success ? contRes.data : []);

      } else {
        // --- LOGICA USER NORMALE ---
        // Campagne
        const { data: campaignsData } = await supabase
          .from("campaigns")
          .select("*")
          .order("sent_at", { ascending: false });
    
        // Contatti (con paginazione locale per sicurezza sui grandi numeri)
        let allContacts = [];
        let page = 0;
        const pageSize = 1000;
    
        while (true) {
          const { data, error } = await supabase
            .from("contacts")
            .select("*")
            .range(page * pageSize, (page + 1) * pageSize - 1);
    
          if (error) { console.error("Errore caricamento contatti:", error); break; }
          if (!data || data.length === 0) break;
          allContacts = [...allContacts, ...data];
          if (data.length < pageSize) break;
          page++;
        }
    
        setCampaigns(campaignsData || []);
        setContacts(allContacts);
      }
    } catch (error) {
      console.error("Errore caricamento dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isSuperAdmin]);

  // Caricamento iniziale
  useEffect(() => {
    if (isSuperAdmin) {
      fetchAccounts();
    }
    loadData(selectedAccount);
  }, [fetchAccounts, loadData, isSuperAdmin]);

  // Quando il superadmin cambia account dal menu a tendina
  const handleAccountChange = (accountId) => {
    setSelectedAccount(accountId);
    loadData(accountId);
  };

  const selectedAccountInfo = accounts.find(a => a.id === selectedAccount);

  if (loading && campaigns.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Caricamento dashboard…
      </div>
    );
  }

  // --- Calcolo metriche aggregate ---
  const totalCampaigns = campaigns.length;
  const activeContacts = contacts.filter((c) => c.status === "active" || c.status === null).length;
  
  // Per totalEmailsSent e Tasso di Apertura
  let totalRecipients = 0;
  let totalOpened = 0;
  let totalSent = 0;

  campaigns.forEach(c => {
    // Se isSuperAdmin, c.total_recipients potrebbe essere stato unito, ma in campaigns non c'è sempre.
    // Usiamo c.sent_count, c.recipients, c.total_recipients a seconda di cosa è disponibile
    const recipientsCount = c.total_recipients ?? c.recipients ?? 0;
    const sentCount = c.sent_count ?? recipientsCount ?? 0;
    const openedCount = c.opened ?? c.opened_count ?? 0;

    totalSent += sentCount;
    totalRecipients += recipientsCount;
    totalOpened += openedCount;
  });

  const avgOpenRate = totalRecipients > 0 ? (totalOpened / totalRecipients) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>

        {/* 👑 Filtro Account per SuperAdmin */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm p-1.5 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 px-2 text-indigo-700 dark:text-indigo-400">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Vista Globale:</span>
            </div>
            
            <div className="relative min-w-[220px]">
              <select
                value={selectedAccount}
                onChange={e => handleAccountChange(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm font-medium border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                disabled={accountsLoading}
              >
                <option value="">🌐 Tutti gli account (Sommario)</option>
                <option value={user?.id}>👑 Il mio account (Admin)</option>
                <optgroup label="Account Clienti">
                  {accounts.filter(a => a.id !== user?.id).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.full_name || a.name || a.email}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {selectedAccount && selectedAccountInfo && selectedAccount !== user?.id && (
              <button
                onClick={() => handleAccountChange('')}
                className="text-gray-400 hover:text-red-500 px-2 flex items-center transition-colors"
                title="Rimuovi filtro e torna a Tutti"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Se c'è un filtro attivo, mostra il banner */}
      {isSuperAdmin && selectedAccount && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm text-indigo-800 dark:text-indigo-300">
            Stai visualizzando i dati filtrati per: <strong className="font-semibold">{selectedAccount === user?.id ? "Il tuo account (SuperAdmin)" : (selectedAccountInfo?.full_name || selectedAccountInfo?.email)}</strong>
          </p>
        </div>
      )}

      {/* Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
        
        {/* Overlay loading sfocato quando si cambia filtro */}
        {loading && campaigns.length > 0 && (
          <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Campagne */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Mail className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Campagne Totali</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCampaigns}</p>
            </div>
          </div>
        </div>

        {/* Contatti */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Contatti</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeContacts}</p>
            </div>
          </div>
        </div>

        {/* Email Inviate */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400">
              <Send className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Email Inviate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSent}</p>
            </div>
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Tasso Apertura</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgOpenRate ? avgOpenRate.toFixed(1) + "%" : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campagne Recenti */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden relative">
        
        {loading && campaigns.length > 0 && (
          <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px]"></div>
        )}

        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Campagne Recenti {isSuperAdmin && !selectedAccount && "(Tutti gli account)"}
          </h3>
          <a href="/campagne" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Vedi tutte →
          </a>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Campagna
              </th>
              {isSuperAdmin && !selectedAccount && (
                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Account
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Destinatari
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Aperture
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin && !selectedAccount ? 6 : 5} className="px-6 py-10 text-center text-gray-500">
                  Nessuna campagna trovata.
                </td>
              </tr>
            ) : campaigns
              .sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at))
              .slice(0, 5)
              .map((c) => {
                const date = c.sent_at || c.created_at;
                const formattedDate = date
                  ? new Date(date).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";

                const recipients = c.total_recipients ?? c.recipients ?? 0;
                const opened = c.opened ?? c.opened_count ?? 0;

                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{c.name || c.campaign_name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">{c.subject}</div>
                    </td>

                    {isSuperAdmin && !selectedAccount && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {(c.account?.full_name || c.account?.email || '?').charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                            {c.account?.full_name || c.account?.name || c.account?.email || "Sconosciuto"}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          c.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {c.status === "sent" ? "Inviata" : "Bozza"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">{recipients}</td>

                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {recipients > 0
                        ? `${Math.round((opened / recipients) * 100)}%`
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">{formattedDate}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
}
