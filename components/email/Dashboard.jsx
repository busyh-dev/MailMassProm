// components/email/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Mail, Users, Send, BarChart3 } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
  } from "recharts";

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
// Costruisci dati invii per mese
const monthlyData = Object.values(
    campaigns.reduce((acc, c) => {
      const date = new Date(c.sent_at || c.created_at);
      const month = date.toLocaleString("it-IT", { month: "short" });
  
      if (!acc[month]) acc[month] = { month, invii: 0 };
      acc[month].invii += c.sent_count || 0;
  
      return acc;
    }, {})
  );
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Campagne
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("*")
        .order("sent_at", { ascending: false });

      // Contatti
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("*");

      setCampaigns(campaignsData || []);
      setContacts(contactsData || []);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Caricamento dashboard…
      </div>
    );
  }

  const totalCampaigns = campaigns.length;
  const activeContacts = contacts.filter((c) => c.status === "active").length;
  const totalEmailsSent = campaigns.reduce(
    (sum, c) => sum + (c.sent_count || 0),
    0
  );

  const avgOpenRate = campaigns.length
    ? (
        campaigns.reduce((acc, c) => acc + (c.opened || 0), 0) /
        campaigns.reduce((acc, c) => acc + (c.recipients || 0), 0)
      ) * 100
    : 0;

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Campagne */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Mail className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Campagne Totali</p>
              <p className="text-2xl font-bold">{totalCampaigns}</p>
            </div>
          </div>
        </div>

        {/* Contatti */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Contatti Attivi</p>
              <p className="text-2xl font-bold">{activeContacts}</p>
            </div>
          </div>
        </div>

        {/* Email Inviate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <Send className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Email Inviate</p>
              <p className="text-2xl font-bold">{totalEmailsSent}</p>
            </div>
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tasso Apertura</p>
              <p className="text-2xl font-bold">
                {avgOpenRate ? avgOpenRate.toFixed(1) + "%" : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campagne Recenti */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Campagne Recenti</h3>
          <a href="/campagne" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Vedi tutte →
          </a>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Campagna
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Destinatari
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Aperture
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Data
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns
              .sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at))
              .slice(0, 4)
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

                return (
                  <tr key={c.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.subject}</div>
                    </td>

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

                    <td className="px-6 py-4 text-sm text-gray-900">{c.recipients || 0}</td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {c.recipients > 0
                        ? `${Math.round((c.opened / c.recipients) * 100)}%`
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">{formattedDate}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
