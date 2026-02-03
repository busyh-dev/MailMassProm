// pages/campagne.js
import { useEffect, useState } from "react";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import { supabase } from "../lib/supabaseClient";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function CampagnePage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔢 PAGINAZIONE
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("sent_at", { ascending: false });

      if (!error) setCampaigns(data ?? []);
      setLoading(false);
    };

    loadCampaigns();
  }, []);

  // 🔢 Calcoli paginazione
  const totalPages = Math.ceil(campaigns.length / perPage);
  const startIndex = (page - 1) * perPage;
  const visibleCampaigns = campaigns.slice(startIndex, startIndex + perPage);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="text-center py-10 text-gray-500">Caricamento…</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Tutte le Campagne</h1>

        <div className="bg-white rounded-lg shadow-sm border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Destinatari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data Invio
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {visibleCampaigns.map((campaign) => {
                const date = campaign.sent_at || campaign.created_at;
                const formatted = date
                  ? new Date(date).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";

                return (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 text-sm font-medium">
                      {campaign.name}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {campaign.recipients || 0}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {campaign.status === "sent" ? "Inviata" : "Bozza"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* PAGINAZIONE */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                page === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-100"
              }`}
            >
              <ArrowLeft size={16} />
              Precedente
            </button>

            <p className="text-sm text-gray-700">
              Pagina {page} di {totalPages}
            </p>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                page === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-100"
              }`}
            >
              Successiva
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
