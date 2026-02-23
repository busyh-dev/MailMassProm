import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { supabase } from '../../lib/supabaseClient';

const ImportContactsModal = ({ show, onClose, onImport, existingContacts }) => {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({ name: "", email: "", tags: "" });
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const [importProgress, setImportProgress] = useState({
    show: false,
    current: 0,
    total: 0,
    status: 'importing',
    errors: [], // ✅ Aggiungi array per gli errori
  });

  // 🔢 dati riepilogo
  const [summary, setSummary] = useState(null);

  // ✅ Carica mappatura salvata
  useEffect(() => {
    const savedMapping = localStorage.getItem("csvMapping");
    if (savedMapping) setMapping(JSON.parse(savedMapping));
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);
 const headers = ["name,email,tags,tipologia_canale,periodicita_canale,copertura_canale,ruolo,settore,canale"];
              const exampleData = [
                "Mario Rossi,mario@email.com,cliente,Periodici specializzati,Quotidiano,Nazionale,Direttore Editoriale,Edilizia/Costruzioni;Architettura/Casa/Arredamento/Design,Sport - Atletica",
                "Giulia Verdi,giulia@email.com,prospect,Online specializzati,Settimanale,Nazionale,Capo Redattore,Information technology;Tecnologia/Innovazione,Sport acquatici",
              ];
  // ✅ Scarica modello CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      "name,email,tags,tipologia_canale,periodicita_canale,copertura_canale,ruolo,settore,canale\nMario Rossi,mario@email.com,cliente,Periodici specializzati,Quotidiano,Nazionale,Direttore Editoriale,Edilizia/Costruzioni;Architettura/Casa/Arredamento/Design,Sport - Atletica";
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
    const invalidEmails = []; // ✅ Array per salvare email non valide
  
    parsedData.forEach((row, i) => {
      const name = row[mapping.name]?.trim();
      const email = row[mapping.email]?.toLowerCase().trim();
      const tags = mapping.tags
        ? row[mapping.tags]?.split(",").map((t) => t.trim())
        : [];
    
        if (!email || !isValidEmail(email)) {
          const invalidEntry = { 
            email: email || "(vuoto)",
            row: i + 2,
            name: name || "(senza nome)"
          };
          console.log("Email non valida:", invalidEntry); // ✅ Debug
          invalidEmails.push(invalidEntry);
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
  
    // 🔹 Salva riepilogo con dettagli email non valide
    setSummary({
      imported: validContacts.length,
      duplicates: duplicateEmails.length,
      invalid: invalidEmails.length,
      invalidEmailsList: invalidEmails, // ✅ Lista completa
      duplicateEmailsList: duplicateEmails // ✅ Lista duplicati
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

  const handleImport = async () => {
    const selectedContacts = previewData.filter((c) =>
      selectedRows.includes(c.id)
    );
  
    if (selectedContacts.length === 0) {
      toast.error("⚠️ Nessun contatto selezionato per l'importazione");
      return;
    }
  
    try {
      setImportProgress({
        show: true,
        current: 0,
        total: selectedContacts.length,
        status: 'importing',
        errors: []
      });
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Errore: utente non autenticato");
        setImportProgress(prev => ({ ...prev, show: false }));
        return;
      }
  
      // Ottieni email esistenti
      const { data: existingContactsFromDB } = await supabase
        .from('contacts')
        .select('email')
        .eq('user_id', user.id);
  
      const existingEmails = new Set(
        (existingContactsFromDB || []).map(c => c.email.toLowerCase().trim())
      );
  
      // ✅ FILTRA DUPLICATI NEL DATABASE
      let newContacts = selectedContacts.filter(contact => 
        !existingEmails.has(contact.email.toLowerCase().trim())
      );
  
      // ✅ FILTRA DUPLICATI ALL'INTERNO DEL CSV STESSO
      const seenEmails = new Set();
      const duplicatesInCSV = [];
      
      newContacts = newContacts.filter(contact => {
        const email = contact.email.toLowerCase().trim();
        if (seenEmails.has(email)) {
          duplicatesInCSV.push(email);
          return false; // Scarta duplicato
        }
        seenEmails.add(email);
        return true; // Mantieni il primo
      });
  
      console.log(`📧 ${duplicatesInCSV.length} duplicati trovati all'interno del CSV`);
  
      if (newContacts.length === 0) {
        toast.error("⚠️ Tutti i contatti sono già presenti o duplicati");
        setImportProgress(prev => ({ ...prev, show: false }));
        return;
      }
  
      const insertedContacts = [];
      const failedContacts = [];
  
      // ✅ Inserisci a batch di 100 contatti alla volta
      const BATCH_SIZE = 100;
      
      for (let batchStart = 0; batchStart < newContacts.length; batchStart += BATCH_SIZE) {
        const batch = newContacts.slice(batchStart, batchStart + BATCH_SIZE);
        
        const contactsToInsert = batch.map(contact => ({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: contact.name,
          email: contact.email.toLowerCase().trim(),
          tags: contact.tags || [], // ✅ Salva anche qui come array
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
  
        const { data: batchInserted, error: batchError } = await supabase
          .from('contacts')
          .insert(contactsToInsert)
          .select();
  
        if (batchError) {
          console.error("Errore batch:", batchError);
          batch.forEach(contact => {
            failedContacts.push({ contact, error: batchError });
            setImportProgress(prev => ({
              ...prev,
              errors: [...prev.errors, {
                email: contact.email,
                reason: batchError.code === '23505' ? 'Email duplicata' : batchError.message
              }]
            }));
          });
        } else {
          batch.forEach((contact, index) => {
            insertedContacts.push({ 
              contact, 
              data: batchInserted[index] 
            });
          });
  
          // Gestisci i tag per questo batch
          for (let i = 0; i < batch.length; i++) {
            const contact = batch[i];
            const insertedContact = batchInserted[i];
  
            if (contact.tags && contact.tags.length > 0) {
              const validTags = contact.tags.filter(tag => tag.trim() !== '');
              
              for (const tagLabel of validTags) {
                const tagValue = tagLabel.toLowerCase().replace(/\s+/g, '-');
  
                let { data: existingTag } = await supabase
                  .from('tags')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('value', tagValue)
                  .single();
  
                let tagId;
  
                if (!existingTag) {
                  const { data: newTag } = await supabase
                    .from('tags')
                    .insert({
                      id: crypto.randomUUID(),
                      user_id: user.id,
                      label: tagLabel.trim(),
                      value: tagValue,
                      color: '#3b82f6',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();
  
                  tagId = newTag?.id;
                } else {
                  tagId = existingTag.id;
                }
  
                if (tagId) {
                  await supabase
                    .from('contact_tags')
                    .insert({
                      id: crypto.randomUUID(),
                      contact_id: insertedContact.id,
                      tag_id: tagId,
                      created_at: new Date().toISOString(),
                    });
                }
              }
            }
          }
        }
  
        setImportProgress(prev => ({
          ...prev,
          current: Math.min(batchStart + BATCH_SIZE, newContacts.length)
        }));
  
        await new Promise(resolve => setTimeout(resolve, 100));
      }
  
      onImport(insertedContacts.map(ic => ic.contact));
  
      setImportProgress({
        show: true,
        current: newContacts.length,
        total: newContacts.length,
        status: 'completed',
        errors: importProgress.errors
      });
  
      const skipped = selectedContacts.length - insertedContacts.length;
      
      setSummary(prev => ({
        ...prev,
        imported: insertedContacts.length,
        duplicates: skipped + duplicatesInCSV.length, // ✅ Include duplicati CSV
        invalid: failedContacts.length,
      }));
  
      setTimeout(() => {
        setImportProgress(prev => ({ ...prev, show: false }));
        setStep(4);
      }, 2000);
  
    } catch (error) {
      console.error("❌ Errore importazione:", error);
      setImportProgress({
        show: true,
        current: 0,
        total: 0,
        status: 'error',
        errors: [{ email: 'Sistema', reason: error.message }]
      });
      
      setTimeout(() => {
        setImportProgress(prev => ({ ...prev, show: false }));
      }, 3000);
    }
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
    <>
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
  <div className="overflow-y-auto max-h-[80vh]">
    <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
      ✅ Importazione completata
    </h3>

    <div className="space-y-3 mb-6 text-center">
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

    {/* 🆕 LISTA EMAIL NON VALIDE */}
    {summary.invalidEmailsList && summary.invalidEmailsList.length > 0 && (
      <div className="mb-6">
        <details className="bg-red-50 border border-red-200 rounded-lg" open>
          <summary className="cursor-pointer p-4 font-semibold text-red-800 hover:bg-red-100 flex items-center justify-between">
            <span>📋 Email non valide ({summary.invalidEmailsList.length})</span>
            <span className="text-xs text-red-600">Clicca per espandere/comprimere</span>
          </summary>
          <div className="p-4 max-h-80 overflow-y-auto border-t border-red-200 bg-white">
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => {
                  const text = summary.invalidEmailsList.map(item => 
                    `Riga ${item.row}: ${item.name} - ${item.email}`
                  ).join('\n');
                  navigator.clipboard.writeText(text);
                  toast.success('📋 Lista copiata negli appunti!');
                }}
                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                📋 Copia tutto
              </button>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-red-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-red-900 border-b-2 border-red-300">Riga</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-red-900 border-b-2 border-red-300">Nome</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-red-900 border-b-2 border-red-300">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {summary.invalidEmailsList.map((item, i) => (
                  <tr key={i} className="hover:bg-red-50">
                    <td className="px-3 py-2 text-red-700 font-mono text-xs">#{item.row}</td>
                    <td className="px-3 py-2 text-gray-700">{item.name}</td>
                    <td className="px-3 py-2 text-red-600 font-mono text-xs break-all">{item.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    )}

    {/* 🆕 LISTA EMAIL DUPLICATE */}
    {summary.duplicateEmailsList && summary.duplicateEmailsList.length > 0 && (
      <div className="mb-6">
        <details className="bg-yellow-50 border border-yellow-200 rounded-lg">
          <summary className="cursor-pointer p-4 font-semibold text-yellow-800 hover:bg-yellow-100 flex items-center justify-between">
            <span>📋 Email duplicate ({summary.duplicateEmailsList.length})</span>
            <span className="text-xs text-yellow-600">Clicca per espandere/comprimere</span>
          </summary>
          <div className="p-4 max-h-80 overflow-y-auto border-t border-yellow-200 bg-white">
            <div className="mb-2">
              <button
                onClick={() => {
                  const text = summary.duplicateEmailsList.join('\n');
                  navigator.clipboard.writeText(text);
                  toast.success('📋 Lista copiata negli appunti!');
                }}
                className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
              >
                📋 Copia tutto
              </button>
            </div>
            <div className="space-y-1">
              {summary.duplicateEmailsList.map((email, i) => (
                <div key={i} className="text-sm text-yellow-700 font-mono bg-yellow-50 px-3 py-2 rounded border border-yellow-200 break-all">
                  {email}
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    )}

    <button
      onClick={handleClose}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
    >
      Chiudi riepilogo
    </button>
  </div>
)}
      </div>
    </div>
{/* 🎨 MODALE PROGRESS IMPORTAZIONE */}
{importProgress.show && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header con animazione */}
      <div className={`p-6 text-center flex-shrink-0 ${
        importProgress.status === 'importing' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
        importProgress.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600' :
        'bg-gradient-to-r from-red-500 to-red-600'
      }`}>
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          {importProgress.status === 'importing' && (
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          {importProgress.status === 'completed' && (
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {importProgress.status === 'error' && (
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white">
          {importProgress.status === 'importing' && 'Importazione in corso...'}
          {importProgress.status === 'completed' && 'Completato!'}
          {importProgress.status === 'error' && 'Errore'}
        </h3>
      </div>

      {/* Contenuto con scroll */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Contatti processati</span>
            <span className="font-bold">{importProgress.current} / {importProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                importProgress.status === 'completed' ? 'bg-green-600' : 
                importProgress.status === 'error' ? 'bg-red-600' : 
                'bg-blue-600'
              }`}
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Percentuale */}
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-gray-800">
            {Math.round((importProgress.current / importProgress.total) * 100)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {importProgress.status === 'importing' && 'Attendere prego...'}
            {importProgress.status === 'completed' && 'Importazione completata con successo!'}
            {importProgress.status === 'error' && 'Si è verificato un errore'}
          </p>
        </div>

        {/* 🆕 Lista errori in tempo reale */}
        {importProgress.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {importProgress.errors.length} errori rilevati:
            </p>
            <div className="space-y-1">
              {importProgress.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-700 bg-white rounded px-2 py-1 flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <div className="flex-1">
                    <span className="font-medium">{err.email}</span>
                    <span className="text-red-600"> - {err.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🆕 Bottone Annulla (solo durante importazione) */}
        {importProgress.status === 'importing' && (
          <div className="mt-6">
            <button
              onClick={() => {
                setImportProgress(prev => ({ ...prev, show: false, errors: [] }));
                setStep(3);
                toast.error('❌ Importazione annullata');
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Annulla importazione
            </button>
          </div>
        )}

        {/* Bottone Chiudi (solo quando completato o errore) */}
        {(importProgress.status === 'completed' || importProgress.status === 'error') && (
          <div className="mt-6">
            <button
              onClick={() => {
                setImportProgress({ show: false, current: 0, total: 0, status: 'importing', errors: [] });
                if (importProgress.status === 'completed') {
                  setStep(4);
                } else {
                  setStep(3);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Chiudi
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}
  </>
);  
    
};

export default ImportContactsModal;







