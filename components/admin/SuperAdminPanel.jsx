// components/admin/SuperAdminPanel.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  Users, Mail, BarChart3, Send, ChevronDown, RefreshCw,
  Building2, Search, Crown, TrendingUp, Inbox, UserCheck,
  Eye, Clock, Filter, AlertCircle, Globe, Download, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from '../email/Dashboard';

// Utility: formatta una data in italiano
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Utility: badge stato campagna
const StatusBadge = ({ status }) => {
  const map = {
    sent: { label: 'Inviata', cls: 'bg-green-100 text-green-800' },
    sending: { label: 'In corso', cls: 'bg-blue-100 text-blue-800' },
    draft: { label: 'Bozza', cls: 'bg-yellow-100 text-yellow-800' },
    failed: { label: 'Errore', cls: 'bg-red-100 text-red-800' },
  };
  const s = map[status] || { label: status || '—', cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

// Componente KPI card
const KpiCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex items-start gap-4`}>
    <div className={`rounded-xl p-3 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value?.toLocaleString('it-IT') ?? '—'}
      </p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);


// Componente Paginazione
const PaginationControls = ({ currentPage, totalPages, setCurrentPage, totalItems }) => (
  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-600">
    <div className="text-sm text-gray-500">Totale: {totalItems}</div>
    <div className="flex items-center gap-4">
      <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        Precedente
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
        Pagina {currentPage} di {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        Successiva
      </button>
    </div>
  </div>
);

// ─── TABELLA CONTATTI ───────────────────────────────────────────
const ContactsTable = ({ data, loading }) => {
  const [filters, setFilters] = useState({ name: '', email: '', company: '' });
  const filtered = (data || []).filter(c => {
    const matchName = !filters.name || (c.name?.toLowerCase() || '').includes(filters.name.toLowerCase()) || (c.full_name?.toLowerCase() || '').includes(filters.name.toLowerCase());
    const matchEmail = !filters.email || (c.email?.toLowerCase() || '').includes(filters.email.toLowerCase());
    const matchCompany = !filters.company || (c.company?.toLowerCase() || '').includes(filters.company.toLowerCase());
    return matchName && matchEmail && matchCompany;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  useEffect(() => { setCurrentPage(1); }, [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(c => ({
      'Nome': c.name || c.full_name || '',
      'Email': c.email,
      'Azienda': c.company || '',
      'Account': c.account?.full_name || c.account?.email || c.user_id,
      'Stato': c.status || 'active',
      'Data Creazione': formatDate(c.created_at)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contatti');
    XLSX.writeFile(wb, 'Export_Contatti.xlsx');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtri di Ricerca</h4>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Esporta Excel
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Cerca per Nome..." value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            {filters.name && <button onClick={() => setFilters(f => ({ ...f, name: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>}
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Cerca per Email..." value={filters.email} onChange={e => setFilters(f => ({ ...f, email: e.target.value }))} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            {filters.email && <button onClick={() => setFilters(f => ({ ...f, email: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>}
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Cerca per Azienda..." value={filters.company} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            {filters.company && <button onClick={() => setFilters(f => ({ ...f, company: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Caricamento...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/60 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Contatto</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Azienda</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Account</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Creato il</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Nessun contatto trovato
                    </td>
                  </tr>
                ) : (
                  paginated.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{c.name || c.full_name || '—'}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-300">
                        {c.company || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-xs font-bold">
                            {(c.account?.full_name || c.account?.email || '?').charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[140px]">
                            {c.account?.full_name || c.account?.name || c.account?.email || c.user_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {formatDate(c.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} totalItems={filtered.length} />
        </div>
      )}
    </div>
  );
};

// ─── TABELLA CAMPAGNE ───────────────────────────────────────────
const CampaignsTable = ({ data, loading }) => {
  const [filters, setFilters] = useState({ name: '', sender: '' });
  const filtered = (data || []).filter(c => {
    const matchName = !filters.name || (c.name?.toLowerCase() || '').includes(filters.name.toLowerCase()) || (c.subject?.toLowerCase() || '').includes(filters.name.toLowerCase());
    const matchSender = !filters.sender || (c.sender_email?.toLowerCase() || '').includes(filters.sender.toLowerCase());
    return matchName && matchSender;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  useEffect(() => { setCurrentPage(1); }, [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(c => ({
      'Campagna': c.name || c.subject || '',
      'Mittente': c.sender_email,
      'Oggetto': c.subject,
      'Account': c.account?.full_name || c.account?.email || c.user_id,
      'Destinatari': c.total_recipients || 0,
      'Aperture': c.opened_count || 0,
      'Click': c.clicked_count || 0,
      'Data Invio': formatDate(c.sent_at || c.created_at)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Campagne');
    XLSX.writeFile(wb, 'Export_Campagne.xlsx');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtri di Ricerca</h4>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Esporta Excel
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Cerca Nome o Oggetto..." value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            {filters.name && <button onClick={() => setFilters(f => ({ ...f, name: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>}
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Cerca Mittente..." value={filters.sender} onChange={e => setFilters(f => ({ ...f, sender: e.target.value }))} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            {filters.sender && <button onClick={() => setFilters(f => ({ ...f, sender: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Caricamento...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/60 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Campagna</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Stato</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Destinatari</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Account</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Data Invio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Nessuna campagna trovata
                    </td>
                  </tr>
                ) : (
                  paginated.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                          {c.campaign_name || c.name || '—'}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{c.subject}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>{c.total_recipients ?? c.recipients?.length ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-xs font-bold">
                            {(c.account?.full_name || c.account?.email || '?').charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[130px]">
                            {c.account?.full_name || c.account?.name || c.account?.email || c.user_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {formatDate(c.sent_at || c.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} totalItems={filtered.length} />
        </div>
      )}
    </div>
  );
};

// ─── TABELLA STORICO INVII ───────────────────────────────────────
const LogsTable = ({ data, loading }) => {
  const [filters, setFilters] = useState({ email: '', event: '' });
  const filtered = (data || []).filter(l => {
    const matchEmail = !filters.email || (l.email?.toLowerCase() || '').includes(filters.email.toLowerCase());
    const matchEvent = !filters.event || (l.event?.toLowerCase() || '').includes(filters.event.toLowerCase());
    return matchEmail && matchEvent;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  useEffect(() => { setCurrentPage(1); }, [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(l => ({
      'Email': l.email,
      'Campagna': l.campaign?.name || l.campaign?.subject || l.campaign_id,
      'Evento': l.event,
      'Dettagli': l.details || '',
      'IP': l.ip_address || '',
      'Data': formatDate(l.created_at)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Storico_Invii');
    XLSX.writeFile(wb, 'Export_Storico.xlsx');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtri di Ricerca</h4>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Esporta Excel
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Cerca per Email..." value={filters.email} onChange={e => setFilters(f => ({ ...f, email: e.target.value }))} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            {filters.email && <button onClick={() => setFilters(f => ({ ...f, email: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>}
          </div>
          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <select value={filters.event} onChange={e => setFilters(f => ({ ...f, event: e.target.value }))} className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
              <option value="">Tutti gli Eventi</option>
              <option value="sent">Inviato (Sent)</option>
              <option value="delivered">Consegnato (Delivered)</option>
              <option value="opened">Aperto (Opened)</option>
              <option value="clicked">Cliccato (Clicked)</option>
              <option value="bounced">Rimbalzato (Bounced)</option>
              <option value="spam">Spam (Complained)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Caricamento...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/60 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Campagna / Oggetto</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Inviate</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Aperte</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Account</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Data Invio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Nessun invio trovato
                    </td>
                  </tr>
                ) : (
                  paginated.map(l => {
                    const openRate = l.total_recipients > 0
                      ? Math.round(((l.opened_count || 0) / l.total_recipients) * 100)
                      : 0;
                    return (
                      <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                            {l.campaign_name || l.subject || '—'}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{l.sender_email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <Send className="w-3 h-3 text-blue-400" />
                            <span>{l.total_recipients || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3 text-green-400" />
                            <span className="text-gray-600 dark:text-gray-300">{l.opened_count || 0}</span>
                            <span className={`text-xs font-medium ${openRate >= 30 ? 'text-green-600' : openRate >= 15 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {openRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-xs font-bold">
                              {(l.account?.full_name || l.account?.email || '?').charAt(0).toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[130px]">
                              {l.account?.full_name || l.account?.name || l.account?.email || l.user_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                          {formatDate(l.sent_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} totalItems={filtered.length} />
        </div>
      )}
    </div>
  );
};

// ─── PANNELLO PRINCIPALE ────────────────────────────────────────
export default function SuperAdminPanel() {
  const { user } = useAuth();

  // Dati
  const [stats, setStats] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [logs, setLogs] = useState([]);

  // Loading
  const [statsLoading, setStatsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // UI state
  const [innerTab, setInnerTab] = useState('dashboard'); // contacts | campaigns | logs
  const [accounts, setAccounts] = useState([]); // lista account per il filtro
  const [selectedAccount, setSelectedAccount] = useState(''); // '' = tutti
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica lista account (per dropdown filtro)
  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return;
    setAccountsLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts-list?user_id=${user.id}`);
      const json = await res.json();
      if (json.success) setAccounts(json.data || []);
    } catch (e) {
      console.error('Errore fetch accounts:', e);
    } finally {
      setAccountsLoading(false);
    }
  }, [user?.id]);

  // Carica stats globali
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/stats-all?user_id=${user.id}`);
      const json = await res.json();
      if (json.success) setStats(json.data);
      else setError(json.details ? `${json.message} - Dettaglio: ${json.details}` : json.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  // Carica contatti
  const fetchContacts = useCallback(async (filterUserId = '') => {
    if (!user?.id) return;
    setContactsLoading(true);
    try {
      const url = `/api/admin/contacts-all?user_id=${user.id}${filterUserId ? `&filter_user_id=${filterUserId}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setContacts(json.data);
    } catch (e) {
      console.error('Errore contacts:', e);
    } finally {
      setContactsLoading(false);
    }
  }, [user?.id]);

  // Carica campagne
  const fetchCampaigns = useCallback(async (filterUserId = '') => {
    if (!user?.id) return;
    setCampaignsLoading(true);
    try {
      const url = `/api/admin/campaigns-all?user_id=${user.id}${filterUserId ? `&filter_user_id=${filterUserId}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setCampaigns(json.data);
    } catch (e) {
      console.error('Errore campaigns:', e);
    } finally {
      setCampaignsLoading(false);
    }
  }, [user?.id]);

  // Carica logs
  const fetchLogs = useCallback(async (filterUserId = '') => {
    if (!user?.id) return;
    setLogsLoading(true);
    try {
      const url = `/api/admin/logs-all?user_id=${user.id}${filterUserId ? `&filter_user_id=${filterUserId}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (e) {
      console.error('Errore logs:', e);
    } finally {
      setLogsLoading(false);
    }
  }, [user?.id]);

  // Inizializzazione
  useEffect(() => {
    fetchStats();
    fetchAccounts();
    fetchContacts();
    fetchCampaigns();
    fetchLogs();
  }, [fetchStats, fetchAccounts, fetchContacts, fetchCampaigns, fetchLogs]);

  // Quando cambia filtro account
  const handleAccountChange = (accountId) => {
    setSelectedAccount(accountId);
    fetchContacts(accountId);
    fetchCampaigns(accountId);
    fetchLogs(accountId);
  };

  // Refresh completo
  const handleRefresh = () => {
    fetchStats();
    fetchContacts(selectedAccount);
    fetchCampaigns(selectedAccount);
    fetchLogs(selectedAccount);
  };

  const selectedAccountInfo = accounts.find(a => a.id === selectedAccount);

  const innerTabs = [
    { id: 'dashboard', label: 'Dashboard Globale', icon: Globe, count: null },
    { id: 'contacts', label: 'Contatti', icon: Users, count: contacts.length },
    { id: 'campaigns', label: 'Campagne', icon: Mail, count: campaigns.length },
    { id: 'logs', label: 'Storico Invii', icon: BarChart3, count: logs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-3 shadow-lg shadow-amber-500/25">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Pannello SuperAdmin
              <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                Accesso Totale
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Visibilità completa su tutti gli account e i dati della piattaforma
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Aggiorna dati
        </button>
      </div>

      {/* Errore */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Building2}
          title="Account Totali"
          value={statsLoading ? null : stats?.accountsCount}
          subtitle={statsLoading ? '...' : `${stats?.activeAccountsCount || 0} account attivi (che inviano)`}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
        <KpiCard
          icon={Users}
          title="Contatti Totali"
          value={statsLoading ? null : stats?.contactsCount}
          subtitle="In tutti gli account"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <KpiCard
          icon={Mail}
          title="Campagne Totali"
          value={statsLoading ? null : stats?.campaignsCount}
          subtitle={`${stats?.sentCampaignsCount ?? '—'} inviate`}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <KpiCard
          icon={Send}
          title="Email Inviate"
          value={statsLoading ? null : stats?.totalEmailsSent}
          subtitle="Totale destinatari raggiunti"
          color="bg-gradient-to-br from-emerald-500 to-green-600"
        />
      </div>

      {/* Filtro Account */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium">Filtra per account:</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedAccount}
              onChange={e => handleAccountChange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              disabled={accountsLoading}
            >
              <option value="">🌐 Tutti gli account ({accounts.length})</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.full_name || a.name || a.email}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {selectedAccount && selectedAccountInfo && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-1.5">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                {selectedAccountInfo.full_name || selectedAccountInfo.name || selectedAccountInfo.email}
              </span>
              <button
                onClick={() => handleAccountChange('')}
                className="text-indigo-400 hover:text-indigo-600 ml-1"
                title="Rimuovi filtro"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Statistiche per account selezionato */}
        {selectedAccount && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /><strong className="text-gray-700 dark:text-gray-300">{contacts.length}</strong> contatti</span>
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /><strong className="text-gray-700 dark:text-gray-300">{campaigns.length}</strong> campagne</span>
            <span className="flex items-center gap-1"><Send className="w-3 h-3" /><strong className="text-gray-700 dark:text-gray-300">{logs.length}</strong> invii</span>
          </div>
        )}
      </div>

      {/* Tab interni */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Tab header */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          {innerTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setInnerTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                innerTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/40'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== null && (<span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                innerTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-6">
          {innerTab === 'dashboard' && (<Dashboard campaigns={campaigns} contacts={contacts} />)}
          {innerTab === 'contacts' && (
            <ContactsTable data={contacts} loading={contactsLoading} />
          )}
          {innerTab === 'campaigns' && (
            <CampaignsTable data={campaigns} loading={campaignsLoading} />
          )}
          {innerTab === 'logs' && (
            <LogsTable data={logs} loading={logsLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
