import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Mail, Users, Send, BarChart3, Globe, ChevronDown, UserCheck, TrendingUp, TrendingDown, Download, AlertCircle, FileSpreadsheet, FileText, CalendarClock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { usePermissions } from '../../src/contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';

// 📊 DASHBOARD AVANZATA
// =======================
export default function Dashboard({ setActiveTab, campaigns: campaignsProp, contacts: contactsProp }) {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  
  // Filtro account per il superadmin
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(''); // '' = Tutti gli account
  const [accountsLoading, setAccountsLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!isSuperAdmin || !user?.id) return;
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
  }, [isSuperAdmin, user?.id]);

  const loadData = useCallback(async (accountIdToFilter = '') => {
    if (!isSuperAdmin || !user?.id) return;
    setLoadingGlobal(true);
    try {
      const urlParams = `?user_id=${user.id}${accountIdToFilter ? `&filter_user_id=${accountIdToFilter}` : ''}`;
      const [campRes, contRes] = await Promise.all([
        fetch(`/api/admin/campaigns-all${urlParams}`).then(r => r.json()),
        fetch(`/api/admin/contacts-all${urlParams}`).then(r => r.json())
      ]);
      setCampaigns(campRes.success ? campRes.data : []);
      setContacts(contRes.success ? contRes.data : []);
    } catch (error) {
      console.error('Errore caricamento dashboard globale:', error);
    } finally {
      setLoadingGlobal(false);
    }
  }, [user?.id, isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAccounts();
      loadData(selectedAccount);
    }
  }, [isSuperAdmin, fetchAccounts, loadData, selectedAccount]);

  // Sync props if not superAdmin, else props are ignored because loadData overrides them
  useEffect(() => { if (campaignsProp && !isSuperAdmin) setCampaigns(campaignsProp); }, [campaignsProp, isSuperAdmin]);
  useEffect(() => { if (contactsProp && !isSuperAdmin) setContacts(contactsProp); }, [contactsProp, isSuperAdmin]);

  const handleAccountChange = (accountId) => {
    setSelectedAccount(accountId);
  };
  const selectedAccountInfo = accounts.find(a => a.id === selectedAccount);


  const [campaigns, setCampaigns] = useState(campaignsProp || []);
  const [contacts, setContacts] = useState(contactsProp || []);

  useEffect(() => { if (campaignsProp) setCampaigns(campaignsProp); }, [campaignsProp]);
  useEffect(() => { if (contactsProp) setContacts(contactsProp); }, [contactsProp]);

  const getSentCount = (c) => {
    if (typeof c.sent_count === 'number' && c.sent_count > 0) return c.sent_count;
    if (typeof c.total_recipients === 'number' && c.total_recipients > 0) return c.total_recipients;
    if (Array.isArray(c.recipients)) return c.recipients.length;
    if (Array.isArray(c.total_recipients)) return c.total_recipients.length;
    return c.sent_count || c.total_recipients || 0;
  };

  const totalCampaigns = campaigns.length;
  const activeContacts = contacts.filter(c => c.status?.trim().toLowerCase() === "active").length;
  const totalEmailsSent = campaigns.reduce((sum, c) => sum + getSentCount(c), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);
  const totalBounced = campaigns.reduce((sum, c) => sum + (c.bounced_count || 0), 0);
  const avgOpenRate = totalEmailsSent > 0 ? (totalOpened / totalEmailsSent) * 100 : 0;
  const avgClickRate = totalEmailsSent > 0 ? (totalClicked / totalEmailsSent) * 100 : 0;
  const bounceRate = totalEmailsSent > 0 ? (totalBounced / totalEmailsSent) * 100 : 0;

  const formatMonthLabel = (key) => {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
  };

  const monthlyData = useMemo(() => {
    const map = {};
    campaigns.forEach((c) => {
      const dateRaw = c.sent_at || c.created_at;
      if (!dateRaw) return;
      const d = new Date(dateRaw);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { key, sent: 0, opened: 0, clicked: 0, bounced: 0 };
      map[key].sent += getSentCount(c);
      map[key].opened += c.opened_count || 0;
      map[key].clicked += c.clicked_count || 0;
      map[key].bounced += c.bounced_count || 0;
    });
    return Object.values(map).sort((a, b) => a.key > b.key ? 1 : -1).map((m) => ({
      month: formatMonthLabel(m.key),
      invii: m.sent,
      aperture: m.opened,
      openRate: m.sent > 0 ? Number(((m.opened / m.sent) * 100).toFixed(1)) : 0,
      ctr: m.sent > 0 ? Number(((m.clicked / m.sent) * 100).toFixed(1)) : 0,
    }));
  }, [campaigns]);

  const weeklyData = useMemo(() => {
    const base = [
      { label: "Lun", sent: 0, opened: 0 },
      { label: "Mar", sent: 0, opened: 0 },
      { label: "Mer", sent: 0, opened: 0 },
      { label: "Gio", sent: 0, opened: 0 },
      { label: "Ven", sent: 0, opened: 0 },
      { label: "Sab", sent: 0, opened: 0 },
      { label: "Dom", sent: 0, opened: 0 },
    ];
    campaigns.forEach((c) => {
      const d = new Date(c.sent_at || c.created_at);
      if (isNaN(d.getTime())) return;
      const idx = (d.getDay() + 6) % 7;
      base[idx].sent += getSentCount(c);
      base[idx].opened += c.opened_count || 0;
    });
    return base.map((d) => ({
      day: d.label,
      invii: d.sent,
      openRate: d.sent > 0 ? Number(((d.opened / d.sent) * 100).toFixed(1)) : 0,
    }));
  }, [campaigns]);

  const campaignsWithRates = useMemo(() => campaigns.map((c) => {
    const sent = getSentCount(c);
    const opened = c.opened_count || 0;
    const clicked = c.clicked_count || 0;
    return {
      id: c.id,
      name: c.campaign_name || c.subject || "Senza nome",
      status: c.status,
      sent,
      opened,
      openRate: sent > 0 ? Number(((opened / sent) * 100).toFixed(1)) : 0,
      ctr: sent > 0 ? Number(((clicked / sent) * 100).toFixed(1)) : 0,
      date: c.sent_at || c.created_at,
    };
  }), [campaigns]);

  const topCampaigns = useMemo(() => [...campaignsWithRates].filter(c => c.sent > 0).sort((a, b) => b.openRate - a.openRate).slice(0, 5), [campaignsWithRates]);
  const worstCampaigns = useMemo(() => [...campaignsWithRates].filter(c => c.sent > 0).sort((a, b) => a.openRate - b.openRate).slice(0, 5), [campaignsWithRates]);

  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;

  // ✅ Funzione export Excel - aggiungi dentro Dashboard prima del return
const exportToExcel = () => {
  const wb = XLSX.utils.book_new();

  // ===== FOGLIO 1: RIEPILOGO =====
  const summaryData = [
    ['📊 REPORT CAMPAGNE EMAIL', '', '', ''],
    ['Generato il:', new Date().toLocaleString('it-IT'), '', ''],
    ['', '', '', ''],
    ['METRICHE PRINCIPALI', '', '', ''],
    ['Campagne Totali', totalCampaigns, '', ''],
    ['Campagne Inviate', sentCampaigns, '', ''],
    ['Bozze', draftCampaigns, '', ''],
    ['Contatti Attivi', activeContacts, '', ''],
    ['Email Inviate', totalEmailsSent, '', ''],
    ['Aperture Totali', totalOpened, '', ''],
    ['Click Totali', totalClicked, '', ''],
    ['Open Rate Medio', `${avgOpenRate.toFixed(1)}%`, '', ''],
    ['Click Rate Medio', `${avgClickRate.toFixed(1)}%`, '', ''],
    ['Bounce Rate', `${bounceRate.toFixed(1)}%`, '', ''],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, '📊 Riepilogo');

  // ===== FOGLIO 2: CAMPAGNE =====
  const campaignRows = [
    ['#', 'Nome Campagna', 'Oggetto', 'Stato', 'Destinatari', 'Inviati', 'Aperture', 'Open Rate %', 'Click', 'CTR %', 'Bounce', 'Data Invio'],
    ...campaigns.map((c, i) => {
      const sent = c.sent_count || c.total_recipients || 0;
      const opened = c.opened_count || 0;
      const clicked = c.clicked_count || 0;
      const bounced = c.bounced_count || 0;
      return [
        i + 1,
        c.campaign_name || '—',
        c.subject || '—',
        c.status === 'sent' ? 'Inviata' : c.status === 'draft' ? 'Bozza' : 'Programmata',
        c.total_recipients || 0,
        sent,
        opened,
        sent > 0 ? Number(((opened / sent) * 100).toFixed(1)) : 0,
        clicked,
        sent > 0 ? Number(((clicked / sent) * 100).toFixed(1)) : 0,
        bounced,
        c.sent_at ? new Date(c.sent_at).toLocaleString('it-IT') : '—',
      ];
    }),
  ];

  const wsCampaigns = XLSX.utils.aoa_to_sheet(campaignRows);
  wsCampaigns['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 30 }, { wch: 12 },
    { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCampaigns, '📧 Campagne');

  // ===== FOGLIO 3: ANDAMENTO MENSILE =====
  const monthlyRows = [
    ['Mese', 'Email Inviate', 'Aperture', 'Open Rate %', 'CTR %'],
    ...monthlyData.map(m => [m.month, m.invii, m.aperture, m.openRate, m.ctr]),
  ];

  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
  wsMonthly['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsMonthly, '📅 Andamento Mensile');

  // ===== FOGLIO 4: DISTRIBUZIONE SETTIMANALE =====
  const weeklyRows = [
    ['Giorno', 'Email Inviate', 'Open Rate %'],
    ...weeklyData.map(d => [d.day, d.invii, d.openRate]),
  ];

  const wsWeekly = XLSX.utils.aoa_to_sheet(weeklyRows);
  wsWeekly['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsWeekly, '📆 Distribuzione Settimanale');

  // ===== FOGLIO 5: TOP CAMPAGNE =====
  const topRows = [
    ['#', 'Campagna', 'Email Inviate', 'Aperture', 'Open Rate %', 'CTR %'],
    ...topCampaigns.map((c, i) => [i + 1, c.name, c.sent, c.opened, c.openRate, c.ctr]),
  ];
  const wsTop = XLSX.utils.aoa_to_sheet(topRows);
  wsTop['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsTop, '🏆 Top Campagne');

  // ===== FOGLIO 6: CAMPAGNE BASSE PERFORMANCE =====
  const worstRows = [
    ['#', 'Campagna', 'Email Inviate', 'Aperture', 'Open Rate %', 'CTR %'],
    ...worstCampaigns.map((c, i) => [i + 1, c.name, c.sent, c.opened, c.openRate, c.ctr]),
  ];
  const wsWorst = XLSX.utils.aoa_to_sheet(worstRows);
  wsWorst['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsWorst, '📉 Basse Performance');

  // ===== SALVA FILE =====
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `report_campagne_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ✅ Funzione stampa PDF
const printReport = () => {
  const printWindow = window.open('', '_blank');
  const now = new Date().toLocaleString('it-IT');

  printWindow.document.write(`
    <html>
    <head>
      <title>Report Campagne Email - ${now}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid #2563eb; }
        .header h1 { font-size: 22px; font-weight: 700; color: #1e3a8a; }
        .header .meta { font-size: 11px; color: #6b7280; text-align: right; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
        .kpi .value { font-size: 24px; font-weight: 700; color: #2563eb; }
        .kpi .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
        .kpi .sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .section { margin-bottom: 28px; }
        .section h2 { font-size: 14px; font-weight: 600; color: #1e3a8a; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead tr { background: #1e3a8a; }
        thead th { color: white; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        tbody tr { border-bottom: 1px solid #f3f4f6; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody td { padding: 8px 12px; font-size: 11px; color: #374151; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        .badge-sent { background: #dcfce7; color: #166534; }
        .badge-draft { background: #fef9c3; color: #854d0e; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .metric { background: #f8fafc; border-radius: 6px; padding: 12px; text-align: center; }
        .metric .mv { font-size: 18px; font-weight: 700; color: #374151; }
        .metric .ml { font-size: 10px; color: #9ca3af; }
        .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        @media print { body { padding: 20px; } @page { margin: 1.5cm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>📧 Report Campagne Email</h1>
          <p style="margin-top:4px; color:#6b7280;">Report completo delle performance email</p>
        </div>
        <div class="meta">
          <div><strong>Data:</strong> ${now}</div>
          <div><strong>Campagne:</strong> ${totalCampaigns}</div>
          <div><strong>Periodo:</strong> Tutti i dati disponibili</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="value">${totalCampaigns}</div>
          <div class="label">Campagne Totali</div>
          <div class="sub">${sentCampaigns} inviate · ${draftCampaigns} bozze</div>
        </div>
        <div class="kpi">
          <div class="value">${activeContacts.toLocaleString('it-IT')}</div>
          <div class="label">Contatti Attivi</div>
          <div class="sub">su ${contacts.length.toLocaleString('it-IT')} totali</div>
        </div>
        <div class="kpi">
          <div class="value">${totalEmailsSent.toLocaleString('it-IT')}</div>
          <div class="label">Email Inviate</div>
          <div class="sub">${totalOpened.toLocaleString('it-IT')} aperte</div>
        </div>
        <div class="kpi">
          <div class="value">${avgOpenRate.toFixed(1)}%</div>
          <div class="label">Open Rate Medio</div>
          <div class="sub">CTR: ${avgClickRate.toFixed(1)}%</div>
        </div>
      </div>

      <div class="section">
        <h2>📊 Engagement Overview</h2>
        <div class="metrics-grid">
          <div class="metric"><div class="mv">${avgOpenRate.toFixed(1)}%</div><div class="ml">Open Rate Medio</div></div>
          <div class="metric"><div class="mv">${avgClickRate.toFixed(1)}%</div><div class="ml">Click Rate Medio</div></div>
          <div class="metric"><div class="mv">${bounceRate.toFixed(1)}%</div><div class="ml">Bounce Rate</div></div>
          <div class="metric"><div class="mv">${totalOpened.toLocaleString('it-IT')}</div><div class="ml">Aperture Totali</div></div>
          <div class="metric"><div class="mv">${totalClicked.toLocaleString('it-IT')}</div><div class="ml">Click Totali</div></div>
          <div class="metric"><div class="mv">${totalBounced.toLocaleString('it-IT')}</div><div class="ml">Bounce Totali</div></div>
        </div>
      </div>

      <div class="section">
        <h2>📧 Elenco Campagne</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Nome Campagna</th><th>Stato</th>
              <th>Destinatari</th><th>Aperture</th><th>Open Rate</th><th>CTR</th><th>Data Invio</th>
            </tr>
          </thead>
          <tbody>
            ${campaigns.slice().sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at)).map((c, i) => {
              const sent = c.sent_count || c.total_recipients || 0;
              const opened = c.opened_count || 0;
              const clicked = c.clicked_count || 0;
              const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
              const ctr = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
              return `
                <tr>
                  <td style="color:#9ca3af">${i + 1}</td>
                  <td><strong>${c.campaign_name || '—'}</strong><br><span style="color:#6b7280;font-size:10px">${c.subject || ''}</span></td>
                  <td><span class="badge ${c.status === 'sent' ? 'badge-sent' : 'badge-draft'}">${c.status === 'sent' ? 'Inviata' : 'Bozza'}</span></td>
                  <td>${(c.total_recipients || 0).toLocaleString('it-IT')}</td>
                  <td>${opened.toLocaleString('it-IT')}</td>
                  <td><strong>${sent > 0 ? openRate + '%' : '—'}</strong></td>
                  <td>${sent > 0 ? ctr + '%' : '—'}</td>
                  <td style="color:#6b7280;font-size:10px">${c.sent_at ? new Date(c.sent_at).toLocaleString('it-IT') : '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>🏆 Top 5 Campagne per Open Rate</h2>
        <table>
          <thead><tr><th>#</th><th>Campagna</th><th>Inviati</th><th>Aperture</th><th>Open Rate</th><th>CTR</th></tr></thead>
          <tbody>
            ${topCampaigns.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.sent.toLocaleString('it-IT')}</td>
                <td>${c.opened.toLocaleString('it-IT')}</td>
                <td><strong style="color:#16a34a">${c.openRate.toFixed(1)}%</strong></td>
                <td>${c.ctr.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>📅 Andamento Mensile</h2>
        <table>
          <thead><tr><th>Mese</th><th>Email Inviate</th><th>Aperture</th><th>Open Rate %</th><th>CTR %</th></tr></thead>
          <tbody>
            ${monthlyData.map(m => `
              <tr>
                <td><strong>${m.month}</strong></td>
                <td>${m.invii.toLocaleString('it-IT')}</td>
                <td>${m.aperture.toLocaleString('it-IT')}</td>
                <td>${m.openRate}%</td>
                <td>${m.ctr}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        Report generato da MailMassProm · ${now} · Documento riservato ad uso interno
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
};

  return (
    <div className="space-y-6">
     {/* ===== HEADER ===== */}
<div className="flex items-center justify-between flex-wrap gap-3">
  <div>
    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
    <p className="text-sm text-gray-500 mt-1">
      Panoramica delle tue campagne email · {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    </p>
  </div>
  <div className="flex items-center gap-2.5 flex-wrap">
    {/* Export Excel */}
    <button
      onClick={exportToExcel}
      className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
    >
      <Download className="w-4 h-4" />
      Esporta Excel
    </button>

    {/* Stampa/PDF */}
    <button
      onClick={printReport}
      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
    >
      <FileText className="w-4 h-4" />
      Stampa/PDF
    </button>

    {/* Nuova Campagna */}
    <button
      onClick={() => setActiveTab('campaigns')}
      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
    >
      <Mail className="w-4 h-4" />
      Nuova Campagna
    </button>
  </div>
</div>
      {/* ===== KPI PRINCIPALI ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Campagne Totali",
            value: totalCampaigns,
            sub: `${sentCampaigns} inviate · ${draftCampaigns} bozze`,
            icon: <Mail className="w-5 h-5" />,
            color: "from-blue-500 to-blue-600",
            bg: "bg-blue-50",
            text: "text-blue-600",
          },
          {
            title: "Contatti Attivi",
            value: activeContacts.toLocaleString('it-IT'),
            sub: `su ${contacts.length.toLocaleString('it-IT')} totali`,
            icon: <Users className="w-5 h-5" />,
            color: "from-emerald-500 to-emerald-600",
            bg: "bg-emerald-50",
            text: "text-emerald-600",
          },
          {
            title: "Email Inviate",
            value: totalEmailsSent.toLocaleString('it-IT'),
            sub: `${totalOpened.toLocaleString('it-IT')} aperte`,
            icon: <Send className="w-5 h-5" />,
            color: "from-orange-500 to-orange-600",
            bg: "bg-orange-50",
            text: "text-orange-600",
          },
          {
            title: "Open Rate Medio",
            value: avgOpenRate > 0 ? `${avgOpenRate.toFixed(1)}%` : "—",
            sub: `CTR: ${avgClickRate.toFixed(1)}%`,
            icon: <BarChart3 className="w-5 h-5" />,
            color: "from-purple-500 to-purple-600",
            bg: "bg-purple-50",
            text: "text-purple-600",
          },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <span className={item.text}>{item.icon}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.bg} ${item.text}`}>
                {item.title}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* ===== ENGAGEMENT + GRAFICO MENSILE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Engagement Overview */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Panoramica di coinvolgimento
          </h3>
          <div className="space-y-4">
            {[
              { label: "Open Rate Medio", value: avgOpenRate, color: "bg-blue-500", max: 100 },
              { label: "Click Rate Medio", value: avgClickRate, color: "bg-emerald-500", max: 100 },
              { label: "Bounce Rate", value: bounceRate, color: "bg-red-400", max: 100 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{item.label}</span>
                  <span className="font-semibold text-gray-700">{item.value.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Tot. Aperture</p>
                <p className="text-lg font-bold text-gray-900">{totalOpened.toLocaleString('it-IT')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Tot. Click</p>
                <p className="text-lg font-bold text-gray-900">{totalClicked.toLocaleString('it-IT')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grafico Mensile */}
        <div className="bg-white rounded-xl border shadow-sm p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Invii & Open Rate per mese
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="invii" name="Invii" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="openRate" name="Open Rate %" stroke="#10b981" strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Nessun dato disponibile</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== GRAFICO SETTIMANALE ===== */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-blue-600" />
          Distribuzione invii per giorno della settimana
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="invii" name="Invii" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="openRate" name="Open Rate %" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== CAMPAGNE RECENTI ===== */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Campagne Recenti</h3>
          <button onClick={() => setActiveTab("campaigns")} className="text-sm text-blue-600 hover:text-blue-800 font-medium transition">
            Vedi tutte →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campagna</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Destinatari</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Nessuna campagna disponibile
                  </td>
                </tr>
              ) : (
                campaigns
                  .slice().sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at))
                  .slice(0, 5)
                  .map((c) => {
                    const sent = c.sent_count || c.total_recipients || 0;
                    const opened = c.opened_count || 0;
                    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
                    const date = c.sent_at || c.created_at;

                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {c.campaign_name || c.subject || "Senza nome"}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{c.subject}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                            c.status === "sent" ? "bg-green-100 text-green-700" :
                            c.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              c.status === "sent" ? "bg-green-500" :
                              c.status === "scheduled" ? "bg-blue-500" : "bg-yellow-500"
                            }`} />
                            {c.status === "sent" ? "Inviata" : c.status === "scheduled" ? "Programmata" : "Bozza"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{sent.toLocaleString('it-IT')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${openRate >= 50 ? 'bg-green-500' : openRate >= 20 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                style={{ width: `${openRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{sent > 0 ? `${openRate}%` : '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {date ? new Date(date).toLocaleString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TOP / WORST CAMPAGNE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: "🏆 Top 5 Campagne", data: topCampaigns, colorClass: "text-green-600 bg-green-50" },
          { title: "📉 Campagne con performance più basse", data: worstCampaigns, colorClass: "text-red-600 bg-red-50" },
        ].map(({ title, data, colorClass }) => (
          <div key={title} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {data.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">Nessun dato disponibile</div>
              ) : (
                data.map((c, i) => (
                  <div key={c.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorClass}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.sent.toLocaleString('it-IT')} inviati</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{c.openRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">CTR {c.ctr.toFixed(1)}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};