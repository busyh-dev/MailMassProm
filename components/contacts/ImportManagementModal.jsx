import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, ArrowLeft, Users, ShieldCheck, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

export default function ImportManagementModal({
  show,
  onClose,
  onOpenStandardImport,
  onContactsImported,
  existingContacts = [],
}) {
  const [activeTab, setActiveTab] = useState('hub'); // 'hub', 'attestati'
  
  // Stati per Importazione Attestati
  const [attestatiFile, setAttestatiFile] = useState(null);
  const [courseName, setCourseName] = useState('Corso Antincendio');
  const [parsedAttendees, setParsedAttendees] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  if (!show) return null;

  // 1. Scarica Modello Standard (CSV)
  const handleDownloadStandardTemplate = () => {
    const headers = "name,email,email_2,tags,tag_labels,contact_labels,settore,canale,ruolo,area,testata,tipologia_canale,periodicita_canale,copertura_canale";
    const exampleData = [
      "Mario Rossi,mario@email.com,mario2@email.com,Mailing TECH - Online,trade;tech,Mailing Lista Nazionale,Information technology,Online specializzati,Direttore Editoriale,Nord,La Repubblica,Online specializzati,Quotidiano,Nazionale",
      "Giulia Verdi,giulia@email.com,,Mailing CSR,,Edilizia/Costruzioni,Periodici specializzati,Capo Redattore,Sud,Il Corriere,Periodici specializzati,Settimanale,Regionale",
    ];
    const csvContent = [headers, ...exampleData].join("\n");
    const blob = new Blob(['\uFEFF' + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modello_contatti_standard.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("📥 Modello Standard CSV scaricato con successo");
  };

  // 2. Scarica Modello Attestati (Excel .xlsx / CSV con codicefiscale, nominativo, email)
  const handleDownloadAttestatiTemplate = (format = 'xlsx') => {
    const rows = [
      { codicefiscale: "RSSMRA80A01H501Z", nominativo: "Mario Rossi", email: "mario.rossi@example.com" },
      { codicefiscale: "VRDGPP75B12F205X", nominativo: "Giuseppe Verdi", email: "giuseppe.verdi@example.com" },
      { codicefiscale: "BNCANN90C45H501Y", nominativo: "Anna Bianchi", email: "anna.bianchi@example.com" },
    ];

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Discenti Attestati");
      XLSX.writeFile(workbook, "modello_attestati_discenti.xlsx");
      toast.success("📥 Modello Attestati Excel (.xlsx) scaricato!");
    } else {
      const csv = Papa.unparse(rows);
      const blob = new Blob(['\uFEFF' + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "modello_attestati_discenti.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("📥 Modello Attestati CSV scaricato!");
    }
  };

  // Parsing file Attestati (Excel o CSV)
  const handleAttestatiFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setAttestatiFile(selectedFile);
    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
          processAttestatiData(data);
        } catch (err) {
          console.error(err);
          toast.error("❌ Errore nella lettura del file Excel");
        }
      };
      reader.readAsBinaryString(selectedFile);
    } else {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processAttestatiData(results.data);
        },
        error: () => toast.error("❌ Errore nella lettura del file CSV"),
      });
    }
  };

  // Processa le righe estratte dal file attestati
  const processAttestatiData = (data = []) => {
    if (!data || data.length === 0) {
      toast.error("⚠️ Il file è vuoto o privo di righe valide");
      setParsedAttendees([]);
      return;
    }

    const processed = data.map((row, index) => {
      // Normalizzazione chiavi insensitive
      const keys = Object.keys(row);
      const getVal = (possibleKeys) => {
        for (const pk of possibleKeys) {
          const matchedKey = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === pk.toLowerCase().replace(/[^a-z]/g, ''));
          if (matchedKey && row[matchedKey]) return row[matchedKey].toString().trim();
        }
        return '';
      };

      const cf = getVal(['codicefiscale', 'codice_fiscale', 'cf', 'taxcode']).toUpperCase();
      const nominativo = getVal(['nominativo', 'nome_cognome', 'nomecognome', 'name']);
      const email = getVal(['email', 'mail', 'e-mail']).toLowerCase();

      // Splitting Nome / Cognome da Nominativo
      let firstName = '';
      let lastName = '';
      if (nominativo) {
        const parts = nominativo.split(' ').filter(Boolean);
        if (parts.length === 1) {
          firstName = parts[0];
        } else if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        }
      }

      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      return {
        id: `row-${index}`,
        codiceFiscale: cf,
        nominativo,
        firstName,
        lastName,
        email,
        isValidEmail,
        isValidCf: cf.length >= 6,
      };
    }).filter(r => r.nominativo || r.email || r.codiceFiscale);

    setParsedAttendees(processed);
    if (processed.length > 0) {
      toast.success(`✅ Caricate ${processed.length} righe per l'importazione attestati`);
    } else {
      toast.error("⚠️ Nessun dato valido trovato. Verifica le colonne: codicefiscale, nominativo, email");
    }
  };

  // Esegue l'importazione dei discenti nel DB / Supabase
  const handleExecuteAttestatiImport = async () => {
    if (parsedAttendees.length === 0) {
      toast.error("⚠️ Carica un file prima di procedere con l'importazione");
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      let successCount = 0;
      let errorCount = 0;
      const importedContacts = [];

      for (let i = 0; i < parsedAttendees.length; i++) {
        const row = parsedAttendees[i];
        if (!row.email) {
          errorCount++;
          continue;
        }

        const tagList = ["Attestati"];
        if (courseName && courseName.trim()) {
          tagList.push(courseName.trim());
        }

        const contactPayload = {
          id: crypto.randomUUID(),
          user_id: user.id,
          name: row.nominativo || `${row.firstName} ${row.lastName}`.trim(),
          email: row.email,
          status: 'active',
          source: 'import_attestati',
          tags: JSON.stringify(tagList),
          custom_fields: JSON.stringify({
            codiceFiscale: row.codiceFiscale,
            cf: row.codiceFiscale,
            corso: courseName,
          }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('contacts')
          .upsert(contactPayload, { onConflict: 'email,user_id' })
          .select();

        if (error) {
          console.error(`Errore riga ${i + 1}:`, error);
          errorCount++;
        } else {
          successCount++;
          if (data && data[0]) {
            importedContacts.push({
              ...data[0],
              firstName: row.firstName,
              lastName: row.lastName,
              codiceFiscale: row.codiceFiscale,
              customFields: { codiceFiscale: row.codiceFiscale },
            });
          }
        }

        setImportProgress(Math.round(((i + 1) / parsedAttendees.length) * 100));
      }

      toast.success(`🎉 Importazione completata! ${successCount} discenti importati/aggiornati.`);
      if (onContactsImported) onContactsImported(importedContacts);
      onClose();

    } catch (err) {
      console.error(err);
      toast.error(`❌ Errore durante l'importazione: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modale */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            {activeTab !== 'hub' && (
              <button
                onClick={() => setActiveTab('hub')}
                className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Gestione Importazioni Contatti
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seleziona la modalità di importazione desiderata o scarica i modelli pronti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENUTO SCHERMATA HUB (STEP 0) */}
        {activeTab === 'hub' && (
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">
                Scegli il tipo di importazione
              </span>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Come desideri importare i contatti?
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* SCHEDA 1: IMPORTAZIONE SEMPLICE (STANDARD) */}
              <div className="bg-white dark:bg-slate-800/90 border-2 border-gray-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      📄 Importazione Semplice (Standard)
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                      Modalità classica per l'importazione massiva di contatti completi con mappatura di Nome, Email, Tag, Ruolo, Settore, Canale ed Etichette.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold block mb-1">Campi inclusi nel modello:</span>
                    <code className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                      name, email, tags, settore, canale, ruolo, area...
                    </code>
                  </div>
                </div>

                <div className="pt-6 space-y-2.5">
                  <button
                    onClick={handleDownloadStandardTemplate}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-gray-200 dark:border-slate-600 shadow-xs"
                  >
                    <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    Scarica Modello Standard (CSV)
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenStandardImport) onOpenStandardImport();
                    }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Apri Form Importazione Semplice
                  </button>
                </div>
              </div>

              {/* SCHEDA 2: IMPORTAZIONE PER INVIO ATTESTATI (DISCENTI) */}
              <div className="bg-white dark:bg-slate-800/90 border-2 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      🎓 Importazione per Invio Attestati
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                      Importazione rapida ottimizzata per i discenti dei corsi. Richiede solo Codice Fiscale, Nominativo ed Email per lo smistamento automatico dei certificati.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-semibold block mb-1">Campi del modello dedicato:</span>
                    <code className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                      codicefiscale, nominativo, email
                    </code>
                  </div>
                </div>

                <div className="pt-6 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownloadAttestatiTemplate('xlsx')}
                      className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 dark:border-emerald-800 shadow-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Modello Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => handleDownloadAttestatiTemplate('csv')}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-gray-200 dark:border-slate-600 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Modello CSV
                    </button>
                  </div>
                  <button
                    onClick={() => setActiveTab('attestati')}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Apri Form Importazione Attestati
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* CONTENUTO FORM IMPORTAZIONE ATTESTATI (STEP 'attestati') */}
        {activeTab === 'attestati' && (
          <div className="p-6 overflow-y-auto space-y-5">
            
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  🎓 Importazione Discenti Corso per Attestati
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Assicurati che il file contenga le colonne: <code className="font-bold">codicefiscale</code>, <code className="font-bold">nominativo</code>, <code className="font-bold">email</code>.
                </p>
              </div>

              <button
                onClick={() => handleDownloadAttestatiTemplate('xlsx')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Scarica Modello Excel
              </button>
            </div>

            {/* Configurazione Corso / Tag */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome del Corso / Tag di Riferimento
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Es. Corso Antincendio 2026"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Seleziona File (.xlsx, .xls o .csv)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleAttestatiFileChange}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>

            {/* Tabella Anteprima Dati Caricati */}
            {parsedAttendees.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span>Anteprima Discenti da Importare ({parsedAttendees.length} trovati)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Pronto all'importazione
                  </span>
                </div>

                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-800/80 sticky top-0 border-b border-gray-200 dark:border-slate-800 text-gray-500 font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2">Codice Fiscale</th>
                        <th className="px-3 py-2">Nominativo (Nome / Cognome)</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2 text-center">Stato Validità</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {parsedAttendees.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-mono text-gray-800 dark:text-gray-200">
                            {row.codiceFiscale || <span className="text-amber-500 italic">Mancante</span>}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{row.nominativo}</span>
                            {(row.firstName || row.lastName) && (
                              <span className="text-[11px] text-gray-400 block">
                                ({row.firstName} / {row.lastName})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-mono">
                            {row.email}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {row.isValidEmail && row.isValidCf ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                <AlertCircle className="w-3.5 h-3.5" /> Da Verificare
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Barra di Progresso se in corso */}
            {isProcessing && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold text-emerald-600">
                  <span>Importazione discenti in corso...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-200"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer Form Attestati */}
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setActiveTab('hub')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Torna alle Opzioni
              </button>
              <button
                onClick={handleExecuteAttestatiImport}
                disabled={parsedAttendees.length === 0 || isProcessing}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all ${
                  parsedAttendees.length === 0 || isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                }`}
              >
                <Upload className="w-4 h-4" />
                Importa {parsedAttendees.length} Discenti
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
