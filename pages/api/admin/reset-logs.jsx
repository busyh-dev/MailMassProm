import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Filter, Check, X, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

// ===================== CHART.JS =====================
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ArcElement
);

// ===================== UTILS =====================
const [showIpModal, setShowIpModal] = useState(false);
const [ipModalData, setIpModalData] = useState(null);

const openIpModal = async (ip) => {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await res.json();
  
      setIpModalData(data);
      setShowIpModal(true);
  
      // Salva geolocazione (solo se non già presente)
      await supabase.from("ip_geo_cache").upsert({
        ip: ip,
        country: data.country_name,
        country_code: data.country,
        city: data.city,
        region: data.region,
        lat: data.latitude,
        lon: data.longitude,
        is_proxy: data.proxy,
        is_tor: data.tor,
        is_datacenter: data.datacenter,
        isp: data.org,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Errore geolocalizzazione IP", err);
    }
  };
  

// Dark mode detection
const isDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

// Tooltip moderno "glass"
const modernTooltip = {
  enabled: false,
  external: function (context) {
    let tooltipEl = document.getElementById("chartjs-tooltip");

    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = "chartjs-tooltip";
      tooltipEl.className =
        "fixed z-50 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md transition-all duration-150 text-sm";
      tooltipEl.style.pointerEvents = "none";
      document.body.appendChild(tooltipEl);
    }

    const tooltip = context.tooltip;

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    tooltipEl.style.opacity = 1;
    tooltipEl.style.backgroundColor = isDark()
      ? "rgba(30,41,59,0.85)" // slate-800
      : "rgba(255,255,255,0.9)";
    tooltipEl.style.color = isDark() ? "#f1f5f9" : "#1e293b";

    if (tooltip.body) {
      const label = tooltip.dataPoints[0].label;
      const value = tooltip.dataPoints[0].formattedValue;

      tooltipEl.innerHTML = `
        <div class="font-semibold">${value} richieste</div>
        <div class="text-xs opacity-75">${label}</div>
      `;
    }

    const { offsetLeft, offsetTop } = context.chart.canvas;
    tooltipEl.style.left = offsetLeft + tooltip.caretX + 12 + "px";
    tooltipEl.style.top = offsetTop + tooltip.caretY - 20 + "px";
  },
};

// ===================== COMPONENTE =====================

export default function ResetLogsAdmin() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [emailFilter, setEmailFilter] = useState("");
  const [successFilter, setSuccessFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [companyFilter, setCompanyFilter] = useState("all");
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(false);

  // Stats
  const [mostRequests, setMostRequests] = useState([]);

  // ===================== CSV EXPORT =====================

  const exportCSV = () => {
    if (!logs.length) {
      toast.error("Nessun dato da esportare");
      return;
    }

    const headers = [
      "email",
      "success",
      "requested_at",
      "ip_address",
      "user_agent",
    ];

    const rows = logs.map((log) => [
      log.email,
      log.success ? "success" : "failed",
      log.requested_at,
      log.ip_address || "",
      log.user_agent || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `password_reset_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ===================== FETCH LOGS =====================

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/get-reset-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailFilter || null,
          success:
            successFilter === "all"
              ? undefined
              : successFilter === "success"
              ? true
              : false,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      const { logs } = await res.json();
      setLogs(logs);

      // aziende = dominio email
      const domainSet = new Set();
      logs.forEach((l) => {
        if (l.email && l.email.includes("@")) {
          const domain = l.email.split("@")[1].toLowerCase();
          domainSet.add(domain);
        }
      });
      setCompanies(Array.from(domainSet).sort());

      computeStats(logs);
    } catch (err) {
      toast.error("Errore nel caricamento dei log");
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (logs) => {
    const map = {};
    logs.forEach((l) => {
      if (!map[l.email]) map[l.email] = 0;
      map[l.email]++;
    });

    const sorted = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([email, count]) => ({ email, count }));

    setMostRequests(sorted);
  };

  // Applica filtro "azienda" (dominio) lato frontend
  const applyCompanyFilter = (logsData, company) => {
    if (company === "all") return logsData;
    return logsData.filter((l) => {
      if (!l.email || !l.email.includes("@")) return false;
      return l.email.split("@")[1].toLowerCase() === company;
    });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setFiltered(applyCompanyFilter(logs, companyFilter));
  }, [logs, companyFilter]);

  // ===================== CHART DATA =====================

  const getChartData = () => {
    const map = {};

    logs.forEach((log) => {
      const date = new Date(log.requested_at).toISOString().split("T")[0];
      map[date] = (map[date] || 0) + 1;
    });

    const labels = Object.keys(map).sort();
    const values = labels.map((d) => map[d]);
    const dark = isDark();

    return {
      labels,
      datasets: [
        {
          label: "Richieste reset password",
          data: values,
          borderColor: dark ? "#10b981" : "#2563eb",
          backgroundColor: dark
            ? "rgba(16,185,129,0.25)"
            : "rgba(37,99,235,0.25)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: dark ? "#10b981" : "#2563eb",
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: modernTooltip,
      legend: { display: false },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          color: isDark() ? "#cbd5e1" : "#475569",
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: isDark() ? "#cbd5e1" : "#475569",
        },
        grid: {
          color: isDark()
            ? "rgba(255,255,255,0.05)"
            : "rgba(0,0,0,0.06)",
        },
      },
    },
  };

  // Donut Successo vs Falliti
  const getDonutData = () => {
    const successCount = logs.filter((l) => l.success).length;
    const failCount = logs.filter((l) => !l.success).length;

    const dark = isDark();

    return {
      labels: ["Successo", "Fallito"],
      datasets: [
        {
          data: [successCount, failCount],
          backgroundColor: dark
            ? ["#10b981", "#ef4444"]
            : ["#22c55e", "#f97316"],
          borderWidth: 1,
        },
      ],
    };
  };

  const donutOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDark() ? "#e5e7eb" : "#374151",
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label;
            const value = ctx.parsed;
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
            const perc = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${perc}%)`;
          },
        },
      },
    },
  };

  // Heatmap: ultimi 42 giorni stile GitHub
  const getHeatmapData = () => {
    const perDate = {};
    logs.forEach((log) => {
      const key = new Date(log.requested_at).toISOString().split("T")[0];
      perDate[key] = (perDate[key] || 0) + 1;
    });

    const days = [];
    const range = 42; // 6 settimane
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({
        date: key,
        count: perDate[key] || 0,
      });
    }
    return days;
  };

  const heatmapDays = getHeatmapData();

  const getHeatClass = (count) => {
    if (count === 0) return "bg-slate-200 dark:bg-slate-800";
    if (count === 1) return "bg-emerald-100 dark:bg-emerald-900/40";
    if (count <= 3) return "bg-emerald-300 dark:bg-emerald-700";
    if (count <= 6) return "bg-emerald-500 dark:bg-emerald-500";
    return "bg-emerald-700 dark:bg-emerald-400";
  };

  // Ultime 24 ore
  const getLast24hCount = () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return logs.filter(
      (log) => new Date(log.requested_at).getTime() >= cutoff
    ).length;
  };

  const isRiskUser = (email, logs) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
    const countLastWeek = logs.filter(
      (l) => l.email === email && new Date(l.requested_at).getTime() >= weekAgo
    ).length;
  
    return countLastWeek >= 5;
  };

  // ===================== UI =====================

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
        <Breadcrumb
  items={[
    { label: "Dashboard", href: "/admin" },
    { label: "Reset Password Logs" },
  ]}
/>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        Password Reset Logs
      </h1>

      {/* FILTRI */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Email
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-700 dark:border-slate-600"
            placeholder="Cerca email…"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Stato
          </label>
          <select
            className="w-full px-4 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-700 dark:border-slate-600"
            value={successFilter}
            onChange={(e) => setSuccessFilter(e.target.value)}
          >
            <option value="all">Tutti</option>
            <option value="success">Successo</option>
            <option value="failed">Falliti</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Da data
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-700 dark:border-slate-600"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            A data
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-700 dark:border-slate-600"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Filtro azienda = dominio email */}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Azienda (dominio)
          </label>
          <select
            className="w-full px-4 py-2 rounded-xl border mt-1 bg-white dark:bg-slate-700 dark:border-slate-600"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="all">Tutte</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchLogs}
          className="col-span-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl mt-2 shadow-lg flex items-center justify-center gap-2"
        >
          <Filter className="w-5 h-5" /> Applica filtri
        </button>
      </div>

      {/* CSV + STATS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-5 rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          📥 Esporta CSV
        </button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
            <h3 className="text-xs font-semibold text-slate-500">
              Totale richieste
            </h3>
            <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
            <h3 className="text-xs font-semibold text-slate-500">Successo</h3>
            <p className="text-2xl font-bold text-green-600">
              {logs.filter((l) => l.success).length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
            <h3 className="text-xs font-semibold text-slate-500">
              Fallite
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {logs.filter((l) => !l.success).length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
            <h3 className="text-xs font-semibold text-slate-500">
              Ultime 24 ore
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {getLast24hCount()}
            </p>
          </div>
        </div>
      </div>

      {/* DONUT + LINE CHART */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
            Successo vs Falliti
          </h2>
          {logs.length > 0 ? (
            <Doughnut data={getDonutData()} options={donutOptions} />
          ) : (
            <p className="text-sm text-slate-500">Nessun dato</p>
          )}
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
            Andamento richieste nel tempo
          </h2>
          <div className="h-64">
            {logs.length > 0 ? (
              <Line data={getChartData()} options={chartOptions} />
            ) : (
              <p className="text-sm text-slate-500">Nessun dato</p>
            )}
          </div>
        </div>
      </div>

      {/* HEATMAP STILE GITHUB */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
          Distribuzione richieste (ultimi 42 giorni)
        </h2>
        <div className="grid grid-cols-7 gap-1 text-[10px]">
          {heatmapDays.map((d, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-[4px] ${getHeatClass(
                d.count
              )}`}
              title={`${d.date} • ${d.count} richieste`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-3 text-[10px] text-slate-500">
          <span>meno</span>
          <div className="flex gap-1">
            {[0, 1, 3, 6, 10].map((c, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-[4px] ${getHeatClass(c)}`}
              />
            ))}
          </div>
          <span>più</span>
        </div>
      </div>

      {/* TOP USERS */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl mb-10">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-4">
          <TrendingUp className="w-5 h-5" /> Utenti che richiedono più reset
        </h2>

        {mostRequests.map((u, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-200 dark:border-slate-700"
          >
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {u.email}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {u.count} richieste
            </span>
          </div>
        ))}

        {mostRequests.length === 0 && (
          <p className="text-sm text-slate-500">Nessun dato</p>
        )}
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <th className="py-3">Email</th>
              <th className="py-3">Esito</th>
              <th className="py-3">Data</th>
              <th className="py-3">IP</th>
              <th className="py-3">User Agent</th>
            </tr>
          </thead>
          <tbody className="text-sm">
  {filtered.map((log) => (
    <tr
      key={log.id}
      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
    >
      {/* EMAIL con BADGE RISCHIOSO */}
      <td className="py-3 font-medium flex items-center gap-2">
        <a
          href={`/admin/reset-logs/${log.email}`}
          className="text-blue-600 dark:text-emerald-400 hover:underline"
        >
          {log.email}
        </a>

        {isRiskUser(log.email, logs) && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-600 text-white font-semibold">
            Rischioso
          </span>
        )}
      </td>

      <td className="py-3">
        {log.success ? (
          <span className="text-green-600 flex items-center gap-1">
            <Check size={16} /> Successo
          </span>
        ) : (
          <span className="text-red-600 flex items-center gap-1">
            <X size={16} /> Fallito
          </span>
        )}
      </td>

      <td className="py-3">
        {new Date(log.requested_at).toLocaleString()}
      </td>

      <td className="py-3">
  {log.ip_address ? (
    <button
      onClick={() => openIpModal(log.ip_address)}
      className="text-blue-600 dark:text-blue-400 hover:underline"
    >
      {log.ip_address}
    </button>
  ) : (
    "-"
  )}
</td>
      <td className="py-3">{log.user_agent || "-"}</td>
    </tr>
  ))}

</tbody>

        </table>

        {loading && (
          <p className="text-center py-6 text-slate-500">Caricamento...</p>
        )}
      </div>
      {showIpModal && ipModalData && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-lg relative">

      {/* TITOLI */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
        🌍 Dettagli IP — {ipModalData.ip}
        <img
          src={`https://flagsapi.com/${ipModalData.country}/flat/32.png`}
          className="w-6 h-6 rounded shadow"
          alt={ipModalData.country_name}
        />
      </h2>

      {/* INFO PRINCIPALI */}
      <div className="space-y-2 text-sm">
        <p><strong>Paese:</strong> {ipModalData.country_name}</p>
        <p><strong>Regione:</strong> {ipModalData.region}</p>
        <p><strong>Città:</strong> {ipModalData.city}</p>
        <p><strong>ISP:</strong> {ipModalData.org}</p>
        <p><strong>Timezone:</strong> {ipModalData.timezone}</p>

        {/* VPN / TOR / PROXY BADGES */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {ipModalData.proxy && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">
              ⚠️ Proxy rilevato
            </span>
          )}
          {ipModalData.tor && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
              🕳 Nodo Tor
            </span>
          )}
          {ipModalData.datacenter && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
              🏢 Hosting / DC
            </span>
          )}
        </div>
      </div>

      {/* MAPPA */}
      {ipModalData.latitude && ipModalData.longitude && (
        <div className="mt-5 h-56 rounded-lg overflow-hidden shadow">
          <MapContainer
            center={[ipModalData.latitude, ipModalData.longitude]}
            zoom={10}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker
              position={[ipModalData.latitude, ipModalData.longitude]}
            />
          </MapContainer>
        </div>
      )}

      <button
        className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        onClick={() => setShowIpModal(false)}
      >
        Chiudi
      </button>

    </div>
  </div>
)}

    </div>
  );
}
