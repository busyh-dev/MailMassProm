import React, { useState } from "react";

export default function CampaignHeader({ onSend, onCancel }) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges = selectedAccount || cc || bcc;

  const handleSend = () => {
    if (!selectedAccount) {
      alert("⚠️ Seleziona un account di invio prima di procedere.");
      return;
    }
    setShowConfirmSend(true);
  };

  const confirmSend = async () => {
    setShowConfirmSend(false);
    // Simula invio (puoi collegare qui la tua API SendGrid)
    await new Promise((r) => setTimeout(r, 1000));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    onSend?.();
  };

  const handleCancel = () => {
    if (hasChanges) setShowConfirmExit(true);
    else onCancel?.();
  };

  const confirmExit = () => {
    setShowConfirmExit(false);
    onCancel?.();
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Account di invio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account di invio
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="">Seleziona un account...</option>
            <option value="noreply@promotergroup.eu">noreply@promotergroup.eu</option>
            <option value="marketing@promotergroup.eu">marketing@promotergroup.eu</option>
            <option value="info@promotergroup.eu">info@promotergroup.eu</option>
          </select>
        </div>

        {/* Campo CC */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
          <input
            type="email"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="Inserisci email in copia"
            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        {/* Campo CCN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CCN</label>
          <input
            type="email"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            placeholder="Inserisci email nascosta"
            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>
      </div>

      {/* Pulsanti principali */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
        >
          Annulla
        </button>
        <button
          onClick={handleSend}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          Invia ora
        </button>
      </div>

      {/* 🔒 Modale conferma invio */}
      {showConfirmSend && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Sei sicuro di voler inviare questa campagna?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              L’email verrà inviata all’elenco dei destinatari selezionato.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirmSend(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={confirmSend}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Messaggio di successo */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-fadeIn">
          ✅ Email inviata correttamente
        </div>
      )}

      {/* ⚠️ Modale uscita */}
      {showConfirmExit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Sicuro di voler uscire dalla campagna?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Hai modifiche non salvate che andranno perse.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              >
                Rimani
              </button>
              <button
                onClick={confirmExit}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Esci comunque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
