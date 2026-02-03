import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import toast from "react-hot-toast";

const ImportContactsModal = ({ show, onClose, onImport, existingContacts }) => {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({ name: "", email: "", tags: "" });
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  // 🔢 dati riepilogo
  const [summary, setSummary] = useState(null);

  // ✅ Carica mappatura salvata
  useEffect(() => {
    const savedMapping = localStorage.getItem("csvMapping");
    if (savedMapping) setMapping(JSON.parse(savedMapping));
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  // ✅ Scarica modello CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      "name,email,tags\nMario Rossi,mario@email.com,cliente\nGiulia Verdi,giulia@email.com,premium";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modello_contatti.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("📥 Modello CSV scaricato con successo");
  };

  // 🧠 Validazione email
  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  // STEP 1 → Parsing intestazioni
  const handleParseHeaders = () => {
    if (!file) {
      toast.error("⚠️ Seleziona un file CSV per procedere");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = Object.keys(results.data[0] || {});
        if (headers.length === 0) {
          toast.error("❌ Il file CSV non contiene intestazioni valide");
          return;
        }
        setCsvHeaders(headers);
        setParsedData(results.data);
        setStep(2);
      },
      error: () => toast.error("Errore nella lettura del file CSV"),
    });
  };

  // STEP 2 → Conferma mappatura
  const handleConfirmMapping = () => {
    if (!mapping.name || !mapping.email) {
      toast.error("⚠️ Devi mappare almeno Nome ed Email");
      return;
    }

    localStorage.setItem("csvMapping", JSON.stringify(mapping));

    const existingEmails = existingContacts.map((c) =>
      c.email.toLowerCase().trim()
    );
    const validContacts = [];
    const duplicateEmails = [];
    const invalidEmails = [];

    parsedData.forEach((row, i) => {
      const name = row[mapping.name]?.trim();
      const email = row[mapping.email]?.toLowerCase().trim();
      const tags = mapping.tags
        ? row[mapping.tags]?.split(",").map((t) => t.trim())
        : [];

      if (!email || !isValidEmail(email)) {
        invalidEmails.push(email || "(vuoto)");
        return;
      }

      if (existingEmails.includes(email)) {
        duplicateEmails.push(email);
        return;
      }

      if (name && email) {
        validContacts.push({
          id: Date.now() + i,
          name,
          email,
          tags,
        });
      }
    });

    if (validContacts.length === 0) {
      toast.error("❌ Nessun contatto valido trovato");
      return;
    }

    // 🔹 Salva riepilogo preliminare per step finale
    setSummary({
      imported: validContacts.length,
      duplicates: duplicateEmails.length,
      invalid: invalidEmails.length,
    });

    if (invalidEmails.length > 0)
      toast(`🚫 ${invalidEmails.length} email non valide scartate`);
    if (duplicateEmails.length > 0)
      toast(`⚠️ ${duplicateEmails.length} duplicati ignorati`);

    setPreviewData(validContacts);
    setSelectedRows(validContacts.map((c) => c.id));
    setStep(3);
  };

  // STEP 3 → Anteprima
  const toggleSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleImport = () => {
    const selectedContacts = previewData.filter((c) =>
      selectedRows.includes(c.id)
    );

    if (selectedContacts.length === 0) {
      toast.error("⚠️ Nessun contatto selezionato per l'importazione");
      return;
    }

    onImport(selectedContacts);
    setSummary((prev) => ({
      ...prev,
      imported: selectedContacts.length,
    }));
    setStep(4); // Vai al riepilogo finale
  };

  const handleClose = () => {
    setFile(null);
    setStep(1);
    setCsvHeaders([]);
    setParsedData([]);
    setPreviewData([]);
    setSelectedRows([]);
    setSummary(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h3 className="text-xl font-bold mb-4">Importa Contatti da CSV</h3>
            <p className="text-gray-600 text-sm mb-4">
              Carica un file CSV con colonne <strong>name</strong>,{" "}
              <strong>email</strong> e <strong>tags</strong>.<br />
              Oppure scarica un modello già pronto.
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-sm border border-gray-300 rounded-lg p-2 mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
              >
                📥 Scarica modello CSV
              </button>
              <button
                onClick={handleParseHeaders}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Continua
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={handleClose}
                className="text-gray-500 text-sm hover:underline"
              >
                Annulla importazione
              </button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h3 className="text-xl font-bold mb-4">Mappa le Colonne</h3>
            <p className="text-gray-600 text-sm mb-4">
              Abbina le colonne del tuo CSV ai campi richiesti dal sistema.
            </p>

            <div className="space-y-4 mb-6">
              {["name", "email", "tags"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {field === "name"
                      ? "Colonna Nome"
                      : field === "email"
                      ? "Colonna Email"
                      : "Colonna Tag (opzionale)"}
                  </label>
                  <select
                    value={mapping[field]}
                    onChange={(e) =>
                      setMapping({ ...mapping, [field]: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="">-- Seleziona colonna --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
              >
                Indietro
              </button>
              <button
                onClick={handleConfirmMapping}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Continua
              </button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <h3 className="text-xl font-bold mb-4">Anteprima Contatti</h3>
            <p className="text-gray-600 text-sm mb-4">
              Seleziona i contatti da importare ({selectedRows.length}/
              {previewData.length})
            </p>

            <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 w-10 text-center">✔</th>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((c) => (
                    <tr
                      key={c.id}
                      className={`${
                        selectedRows.includes(c.id)
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      } border-b`}
                    >
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                        />
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-800">{c.name}</td>
                      <td className="px-4 py-2 text-gray-600">{c.email}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {c.tags.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg"
              >
                Indietro
              </button>
              <button
                onClick={handleImport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Importa Selezionati
              </button>
            </div>
          </>
        )}

        {/* ✅ STEP 4: RIEPILOGO FINALE */}
        {step === 4 && summary && (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              ✅ Importazione completata
            </h3>

            <div className="space-y-3 mb-8">
              <p className="text-lg text-green-600 font-semibold">
                {summary.imported} contatti importati correttamente
              </p>
              <p className="text-yellow-600 text-sm">
                ⚠️ {summary.duplicates} duplicati ignorati
              </p>
              <p className="text-red-600 text-sm">
                🚫 {summary.invalid} email non valide scartate
              </p>
            </div>

            <button
              onClick={handleClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Chiudi riepilogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportContactsModal;







