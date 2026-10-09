import React, { useState, useEffect } from 'react';
import { 
  X, Upload, Download, FileSpreadsheet, FileText, CheckCircle2, 
  AlertCircle, ArrowLeft, Users, ShieldCheck, Sparkles, Trash2, 
  ListPlus, FolderPlus, CheckSquare, Square, Tag, Bookmark
} from 'lucide-react';
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
  const [courseName, setCourseName] = useState('Corso Formazione 2026');
  const [parsedAttendees, setParsedAttendees] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Stati per Etichetta Contatto (Obbligatoria)
  const [selectedLabelOption, setSelectedLabelOption] = useState('new'); // 'new' o label.id
  const [newLabelName, setNewLabelName] = useState('Corso Formazione 2026');
  const [existingLabels, setExistingLabels] = useState([]);

  // Stati per Tag Contatto (Obbligatorio)
  const [selectedTagOption, setSelectedTagOption] = useState('new'); // 'new' o tag.id
  const [newTagName, setNewTagName] = useState('Corso Formazione 2026');
  const [existingTags, setExistingTags] = useState([]);

  // Stati per Creazione / Assegnazione Lista Contatti
  const [createList, setCreateList] = useState(true);
  const [selectedListOption, setSelectedListOption] = useState('new'); // 'new' o list.id
  const [newListName, setNewListName] = useState('Corso Formazione 2026');
  const [newListDesc, setNewListDesc] = useState('Lista discenti creata da importazione attestati');
  const [existingLists, setExistingLists] = useState([]);

  // Carica le liste contatti, etichette e tag dal database Supabase
  useEffect(() => {
    if (show) {
      loadMetadata();
    }
  }, [show]);

  const loadMetadata = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [
        { data: listsData },
        { data: labelsData },
        { data: tagsData },
      ] = await Promise.all([
        supabase.from('contact_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('contact_labels').select('*').eq('user_id', user.id).order('nome'),
        supabase.from('tags').select('*').eq('user_id', user.id).order('label'),
      ]);
      if (listsData) setExistingLists(listsData);
      if (labelsData) setExistingLabels(labelsData);
      if (tagsData) setExistingTags(tagsData);
    } catch (err) {
      console.warn("Errore caricamento metadata:", err);
    }
  };

  // Sincronizza i nomi di default col nome del corso
  useEffect(() => {
    if (courseName) {
      const trimmed = courseName.trim();
      if (selectedListOption === 'new') setNewListName(trimmed);
      if (selectedLabelOption === 'new') setNewLabelName(trimmed);
      if (selectedTagOption === 'new') setNewTagName(trimmed);
    }
  }, [courseName, selectedListOption, selectedLabelOption, selectedTagOption]);

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
      const keys = Object.keys(row);
      const getVal = (possibleKeys) => {
        for (const pk of possibleKeys) {
          const matchedKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === pk.toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
            return row[matchedKey].toString().trim();
          }
        }
        return '';
      };

      let cf = getVal(['codicefiscale', 'codice_fiscale', 'cf', 'taxcode', 'codfisc', 'codice']).toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Fallback regex per Codice Fiscale italiano
      if (!cf || cf.length < 6) {
        const cfRegex = /\b([A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z])\b/i;
        for (const k of keys) {
          const val = String(row[k] || '');
          const m = val.match(cfRegex);
          if (m && m[1]) {
            cf = m[1].toUpperCase();
            break;
          }
        }
      }

      const firstNameVal = getVal(['nome', 'firstname', 'first_name']);
      const lastNameVal = getVal(['cognome', 'lastname', 'last_name']);
      let nominativo = getVal(['nominativo', 'nome_cognome', 'nomecognome', 'name', 'discente', 'partecipante', 'nominativo_discente']);
      if (!nominativo && (firstNameVal || lastNameVal)) {
        nominativo = `${firstNameVal} ${lastNameVal}`.trim();
      }
      const email = getVal(['email', 'mail', 'e_mail', 'e-mail', 'indirizzo_email', 'indirizzoemail']).toLowerCase();

      let firstName = firstNameVal || '';
      let lastName = lastNameVal || '';
      if (!firstName && !lastName && nominativo) {
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
        id: `att-${index}-${Date.now()}`,
        codiceFiscale: cf,
        nominativo: nominativo || (email ? email.split('@')[0] : 'Discente'),
        firstName,
        lastName,
        email,
        isValidEmail,
        isValidCf: cf.length >= 6,
        selected: true, // ✅ Selezionato di default
      };
    }).filter(r => r.nominativo || r.email || r.codiceFiscale);

    setParsedAttendees(processed);
    if (processed.length > 0) {
      toast.success(`✅ Caricate ${processed.length} righe per l'importazione attestati`);
    } else {
      toast.error("⚠️ Nessun dato valido trovato. Verifica le colonne: codicefiscale, nominativo, email");
    }
  };

  // Gestione Selezione / Deselezione / Eliminazione dall'anteprima
  const handleToggleRowSelect = (id) => {
    setParsedAttendees(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleToggleSelectAll = (checked) => {
    setParsedAttendees(prev => prev.map(r => ({ ...r, selected: checked })));
  };

  const handleDeleteAttendee = (id) => {
    setParsedAttendees(prev => prev.filter(r => r.id !== id));
    toast.success("Contatto rimosso dall'elenco di importazione");
  };

  const selectedAttendees = parsedAttendees.filter(r => r.selected);
  const allSelected = parsedAttendees.length > 0 && selectedAttendees.length === parsedAttendees.length;

  // Esegue l'importazione dei discenti nel DB / Supabase e aggiorna/crea la Lista Contatti
  const handleExecuteAttestatiImport = async () => {
    if (selectedAttendees.length === 0) {
      toast.error("⚠️ Seleziona almeno un contatto da importare");
      return;
    }

    // 🔒 Validazione Etichetta Obbligatoria
    const finalLabelName = selectedLabelOption === 'new' ? newLabelName.trim() : '';
    if (selectedLabelOption === 'new' && !finalLabelName) {
      toast.error("⚠️ Il campo Etichetta Contatto è obbligatorio");
      return;
    }
    if (selectedLabelOption !== 'new' && !selectedLabelOption) {
      toast.error("⚠️ Il campo Etichetta Contatto è obbligatorio");
      return;
    }

    // 🔒 Validazione Tag Obbligatorio
    const finalTagName = selectedTagOption === 'new' ? newTagName.trim() : '';
    if (selectedTagOption === 'new' && !finalTagName) {
      toast.error("⚠️ Il campo Tag è obbligatorio");
      return;
    }
    if (selectedTagOption !== 'new' && !selectedTagOption) {
      toast.error("⚠️ Il campo Tag è obbligatorio");
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      // 1. Risolvi / Crea Etichetta nel Database
      let finalLabelId = selectedLabelOption !== 'new' ? selectedLabelOption : null;
      if (!finalLabelId && finalLabelName) {
        const existingLbl = existingLabels.find(l => (l.nome || '').toLowerCase().trim() === finalLabelName.toLowerCase());
        if (existingLbl) {
          finalLabelId = existingLbl.id;
        } else {
          const newLblId = crypto.randomUUID();
          const { data: createdLbl, error: lblErr } = await supabase
            .from('contact_labels')
            .insert({
              id: newLblId,
              user_id: user.id,
              nome: finalLabelName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id, nome')
            .single();
          if (!lblErr && createdLbl) {
            finalLabelId = createdLbl.id;
          } else {
            finalLabelId = newLblId;
          }
        }
      }

      // 2. Risolvi / Crea Tag nel Database
      let finalTagId = selectedTagOption !== 'new' ? selectedTagOption : null;
      if (!finalTagId && finalTagName) {
        const tagVal = finalTagName.toLowerCase().replace(/\s+/g, '-');
        const existingTg = existingTags.find(t => (t.label || '').toLowerCase().trim() === finalTagName.toLowerCase() || t.value === tagVal);
        if (existingTg) {
          finalTagId = existingTg.id;
        } else {
          const newTgId = crypto.randomUUID();
          const { data: createdTg, error: tgErr } = await supabase
            .from('tags')
            .insert({
              id: newTgId,
              user_id: user.id,
              label: finalTagName,
              value: tagVal,
              color: '#10b981',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id, label, value')
            .single();
          if (!tgErr && createdTg) {
            finalTagId = createdTg.id;
          } else {
            finalTagId = newTgId;
          }
        }
      }

      // 3. Carica tutti i contatti esistenti dell'utente per evitare conflitti e recuperare gli ID
      const { data: existingFromDB } = await supabase
        .from('contacts')
        .select('id, email, name, contact_label_id, note, custom_fields')
        .eq('user_id', user.id);

      const existingEmailMap = new Map();
      (existingFromDB || []).forEach(c => {
        if (c.email) existingEmailMap.set(c.email.toLowerCase().trim(), c);
      });

      let successCount = 0;
      let errorCount = 0;
      const importedContacts = [];
      const importedContactIds = [];

      for (let i = 0; i < selectedAttendees.length; i++) {
        const row = selectedAttendees[i];
        const rawEmail = (row.email || '').toLowerCase().trim();
        if (!rawEmail) {
          errorCount++;
          continue;
        }

        const fullName = (row.nominativo || `${row.firstName || ''} ${row.lastName || ''}`).trim() || rawEmail;
        const cfValue = (row.codiceFiscale || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Prepara metadati anagrafica
        const metaObj = {};
        if (cfValue) {
          metaObj.codiceFiscale = cfValue;
          metaObj.cf = cfValue;
        }
        if (row.dataNascita) metaObj.dataNascita = row.dataNascita;
        if (row.luogoNascita) metaObj.luogoNascita = row.luogoNascita;
        if (row.provinciaNascita) metaObj.provinciaNascita = row.provinciaNascita;
        if (row.sesso) metaObj.sesso = row.sesso;
        if (row.cap) metaObj.cap = row.cap;

        const anagraficaTag = Object.keys(metaObj).length > 0 ? `<!--ANAGRAFICA:${JSON.stringify(metaObj)}-->` : null;
        const customFieldsObj = cfValue ? { codiceFiscale: cfValue, cf: cfValue } : {};

        if (existingEmailMap.has(rawEmail)) {
          // Contatto già presente nel DB: usiamo l'ID esistente e aggiorniamo l'etichetta/anagrafica
          const existing = existingEmailMap.get(rawEmail);
          const updatePayload = { 
            updated_at: new Date().toISOString() 
          };
          if (finalLabelId) {
            updatePayload.contact_label_id = finalLabelId;
          }
          if (anagraficaTag) {
            let prevNote = typeof existing.note === 'string' ? existing.note : '';
            const cleanPrevNote = prevNote.replace(/<!--ANAGRAFICA:[\s\S]*?-->/g, '').trim();
            updatePayload.note = cleanPrevNote ? `${cleanPrevNote}\n${anagraficaTag}` : anagraficaTag;
            
            let existingCustom = existing.custom_fields || {};
            if (typeof existingCustom === 'string') {
              try { existingCustom = JSON.parse(existingCustom); } catch (_) { existingCustom = {}; }
            }
            updatePayload.custom_fields = { ...existingCustom, ...customFieldsObj };
          }

          await supabase.from('contacts').update(updatePayload).eq('id', existing.id);

          if (finalTagId) {
            try {
              await supabase.from('contact_tags').insert({
                id: crypto.randomUUID(),
                contact_id: existing.id,
                tag_id: finalTagId,
                created_at: new Date().toISOString(),
              });
            } catch (e) {}
          }
          importedContactIds.push(String(existing.id));
          importedContacts.push({
            ...existing,
            contact_label_id: finalLabelId || existing.contact_label_id,
            firstName: row.firstName,
            lastName: row.lastName,
            codiceFiscale: cfValue || existing.codiceFiscale,
            customFields: { ...(existing.custom_fields || {}), ...customFieldsObj },
          });
          successCount++;
        } else {
          // Nuovo contatto: inserimento pulito nel database con etichetta, note anagrafiche e custom_fields
          const newContactId = crypto.randomUUID();
          const newContact = {
            id: newContactId,
            user_id: user.id,
            name: fullName,
            email: rawEmail,
            status: 'active',
            contact_label_id: finalLabelId || null,
            note: anagraficaTag || null,
            custom_fields: customFieldsObj,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: insertErr } = await supabase
            .from('contacts')
            .insert(newContact);

          if (insertErr) {
            console.error(`❌ Errore inserimento riga ${i + 1} (${rawEmail}):`, insertErr);
            errorCount++;
          } else {
            if (finalTagId) {
              try {
                await supabase.from('contact_tags').insert({
                  id: crypto.randomUUID(),
                  contact_id: newContactId,
                  tag_id: finalTagId,
                  created_at: new Date().toISOString(),
                });
              } catch (e) {}
            }
            existingEmailMap.set(rawEmail, newContact);
            importedContactIds.push(String(newContactId));
            importedContacts.push({
              ...newContact,
              firstName: row.firstName,
              lastName: row.lastName,
              codiceFiscale: cfValue,
              customFields: customFieldsObj,
            });
            successCount++;
          }
        }

        setImportProgress(Math.round(((i + 1) / selectedAttendees.length) * 100));
      }

      // 4. CREAZIONE / AGGIORNAMENTO LISTA CONTATTI SE SELEZIONATO
      if (createList && importedContactIds.length > 0) {
        if (selectedListOption === 'new') {
          const finalListName = (newListName && newListName.trim()) || (courseName && courseName.trim()) || `Lista Discenti (${new Date().toLocaleDateString('it-IT')})`;
          const newListId = crypto.randomUUID();
          const newListPayload = {
            id: newListId,
            user_id: user.id,
            name: finalListName,
            description: newListDesc || `Creata da importazione attestati (${importedContactIds.length} discenti)`,
            contact_count: importedContactIds.length,
            contact_ids: importedContactIds,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: listErr } = await supabase
            .from('contact_lists')
            .insert(newListPayload);

          if (!listErr) {
            toast.success(`📁 Creata nuova lista "${finalListName}" con ${importedContactIds.length} contatti!`);
            try {
              const junctionRows = importedContactIds.map(cId => ({
                id: crypto.randomUUID(),
                listId: newListId,
                contactId: cId,
                addedAt: new Date().toISOString()
              }));
              await supabase.from('list_contacts').insert(junctionRows);
            } catch (junctionErr) {
              console.warn("Info list_contacts junction:", junctionErr);
            }
          } else {
            console.error("Errore creazione lista:", listErr);
            toast.error(`⚠️ Errore salvataggio lista: ${listErr.message}`);
          }
        } else {
          // Aggiunta a lista esistente
          const targetList = existingLists.find(l => String(l.id) === String(selectedListOption));
          if (targetList) {
            const existingIds = Array.isArray(targetList.contact_ids) ? targetList.contact_ids.map(String) : [];
            const mergedIds = Array.from(new Set([...existingIds, ...importedContactIds]));

            const { error: updateListErr } = await supabase
              .from('contact_lists')
              .update({
                contact_ids: mergedIds,
                contact_count: mergedIds.length,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetList.id);

            if (!updateListErr) {
              toast.success(`📁 Aggiunti ${importedContactIds.length} contatti alla lista "${targetList.name}"!`);
              try {
                const junctionRows = importedContactIds
                  .filter(cId => !existingIds.includes(cId))
                  .map(cId => ({
                    id: crypto.randomUUID(),
                    listId: targetList.id,
                    contactId: cId,
                    addedAt: new Date().toISOString()
                  }));
                if (junctionRows.length > 0) {
                  await supabase.from('list_contacts').insert(junctionRows);
                }
              } catch (junctionErr) {
                console.warn("Info list_contacts junction:", junctionErr);
              }
            }
          }
        }
      }

      toast.success(`🎉 Importazione completata! ${successCount} discenti importati/collegati con Etichetta e Tag.`);
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
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Il file deve contenere le colonne: <code className="font-bold bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">codicefiscale</code>, <code className="font-bold bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">nominativo</code>, <code className="font-bold bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">email</code>.
                </p>
                <div className="mt-2 text-xs bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200">
                  📌 <strong>Formato Allegati PDF:</strong> Gli attestati PDF da caricare nella campagna dovranno essere denominati nella forma <code className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">Codicefiscale.pdf</code> (es. <code className="font-mono">RSSMRA80A01H501Z.pdf</code>) per consentire lo smistamento automatico univoco.
                </div>
              </div>

              <button
                onClick={() => handleDownloadAttestatiTemplate('xlsx')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Scarica Modello Excel
              </button>
            </div>

            {/* 1. File e Corso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome del Corso / Riferimento Attestati
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Es. Corso Formazione Lavoratori 2026"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Seleziona File (.xlsx, .xls o .csv) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleAttestatiFileChange}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. 🏷️ ETICHETTA CONTATTO & 🔖 TAG CONTATTO (ENTRAMBI OBBLIGATORI) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* ETICHETTA CONTATTO (OBBLIGATORIA) */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Etichetta Contatto <span className="text-red-500 font-extrabold">* Obbligatoria</span>
                  </label>
                </div>
                
                <div className="space-y-2">
                  <select
                    value={selectedLabelOption}
                    onChange={(e) => setSelectedLabelOption(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="new">➕ Crea Nuova Etichetta Contatto</option>
                    {existingLabels.map(lbl => (
                      <option key={lbl.id} value={lbl.id}>
                        🏷️ {lbl.nome}
                      </option>
                    ))}
                  </select>

                  {selectedLabelOption === 'new' && (
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Nome della nuova etichetta (es. Corsisti 2026)"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* TAG CONTATTO (OBBLIGATORIO) */}
              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Tag Contatto <span className="text-red-500 font-extrabold">* Obbligatorio</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <select
                    value={selectedTagOption}
                    onChange={(e) => setSelectedTagOption(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="new">➕ Crea Nuovo Tag</option>
                    {existingTags.map(tg => (
                      <option key={tg.id} value={tg.id}>
                        🔖 {tg.label || tg.value}
                      </option>
                    ))}
                  </select>

                  {selectedTagOption === 'new' && (
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nome del nuovo tag (es. Attestati Formazione)"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

            </div>

            {/* 📁 SEZIONE CREAZIONE / ASSEGNAZIONE A LISTA CONTATTI */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createList}
                  onChange={(e) => setCreateList(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-emerald-600" />
                  Crea o Assegna a una Lista Contatti
                </span>
              </label>

              {createList && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Destinazione Lista
                    </label>
                    <select
                      value={selectedListOption}
                      onChange={(e) => setSelectedListOption(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="new">➕ Crea Nuova Lista Contatti</option>
                      {existingLists.map(l => (
                        <option key={l.id} value={l.id}>
                          📁 {l.name} ({l.contact_count || l.contact_ids?.length || 0} contatti)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedListOption === 'new' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Nome Nuova Lista
                      </label>
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Nome della lista contatti"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabella Anteprima Dati Caricati con Checkbox e Pulsante Elimina */}
            {parsedAttendees.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-3">
                    <span>Totale righe: <strong>{parsedAttendees.length}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Selezionati per l'importazione: {selectedAttendees.length} su {parsedAttendees.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                      Seleziona Tutti
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(false)}
                      className="text-[11px] text-gray-500 hover:text-gray-700 font-semibold underline"
                    >
                      Deseleziona Tutti
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-800/80 sticky top-0 border-b border-gray-200 dark:border-slate-800 text-gray-500 font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-2">Codice Fiscale</th>
                        <th className="px-3 py-2">Nominativo (Nome / Cognome)</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2 text-center">Stato Validità</th>
                        <th className="px-3 py-2 text-center w-16">Azione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {parsedAttendees.map((row) => (
                        <tr 
                          key={row.id} 
                          className={`transition-colors ${
                            row.selected 
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20' 
                              : 'opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => handleToggleRowSelect(row.id)}
                              className="w-4 h-4 text-emerald-600 rounded border-gray-300 cursor-pointer"
                            />
                          </td>
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
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteAttendee(row.id)}
                              title="Elimina contatto dall'importazione"
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                  <span>Importazione e creazione lista in corso...</span>
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
                disabled={selectedAttendees.length === 0 || isProcessing}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all ${
                  selectedAttendees.length === 0 || isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                }`}
              >
                <Upload className="w-4 h-4" />
                Importa {selectedAttendees.length} Discenti Selezionati
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
