import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { supabase } from '../../lib/supabaseClient';

const ImportContactsModal = ({ show, onClose, onImport, existingContacts }) => {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({ 
    name: "", 
    email: "", 
    email_2: "",
    tags: "",
    tag_labels: "",  // ✅ AGGIUNGI
    settore: "",
    testata: "",
    canale: "",
    ruolo: "",
    area: "",
    tipologia_canale: "",
    periodicita_canale: "",
    copertura_canale: "",
  });
  const [parsedData, setParsedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const [importProgress, setImportProgress] = useState({
    show: false, current: 0, total: 0, status: 'importing', errors: [],
  });

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const savedMapping = localStorage.getItem("csvMapping");
    if (savedMapping) setMapping(JSON.parse(savedMapping));
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleDownloadTemplate = () => {
    const csvContent = "name,email,email_2,tags,tag_labels,contact_labels,settore,canale,ruolo,area,testata,tipologia_canale,periodicita_canale,copertura_canale\n" +
      "Mario Rossi,mario@email.com,mario2@email.com,Mailing TECH - Online,trade;tech,Mailing Lista Nazionale,Information technology,Online specializzati,Direttore Editoriale,Nord,La Repubblica,Online specializzati,Quotidiano,Nazionale\n" +
      "Giulia Verdi,giulia@email.com,,Mailing CSR,,Edilizia/Costruzioni,Periodici specializzati,Capo Redattore,Sud,Il Corriere,Periodici specializzati,Settimanale,Regionale";
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

  const isValidEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const handleParseHeaders = () => {
    if (!file) { toast.error("⚠️ Seleziona un file CSV per procedere"); return; }
    
    // ✅ Usa FileReader invece di passare il file direttamente a Papa
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      Papa.parse(text, {  // ✅ Parsa il testo, non il file
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
    reader.onerror = () => toast.error("Errore nella lettura del file");
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmMapping = () => {
    if (!mapping.name || !mapping.email) {
      toast.error("⚠️ Devi mappare almeno Nome ed Email"); return;
    }
    localStorage.setItem("csvMapping", JSON.stringify(mapping));
  
    const existingEmails = existingContacts.map(c => c.email.toLowerCase().trim());
    const validContacts = [];
    const duplicateEmails = [];
    const invalidEmails = [];
  
    parsedData.forEach((row, i) => {
      const name = row[mapping.name]?.trim();
      const email = row[mapping.email]?.toLowerCase().trim();
      const email_2 = mapping.email_2 ? row[mapping.email_2]?.toLowerCase().trim() : null;
      const settore = mapping.settore ? row[mapping.settore]?.trim() : null;
      const contact_labels = mapping.contact_labels ? row[mapping.contact_labels]?.trim() : null;
      const testata = mapping.testata ? row[mapping.testata]?.trim() : null;
      const canale = mapping.canale ? row[mapping.canale]?.trim() : null;
      const ruolo = mapping.ruolo ? row[mapping.ruolo]?.trim() : null;
      const area = mapping.area ? row[mapping.area]?.trim() : null;
      const tipologia_canale = mapping.tipologia_canale ? row[mapping.tipologia_canale]?.trim() : null;
      const periodicita_canale = mapping.periodicita_canale ? row[mapping.periodicita_canale]?.trim() : null;
      const copertura_canale = mapping.copertura_canale ? row[mapping.copertura_canale]?.trim() : null;
      
      const tags = mapping.tags
        ? row[mapping.tags]?.split(";").map(t => t.trim()).filter(Boolean)
        : [];
  
      // ✅ Parsing robusto tag_labels — gestisce sia "label1;label2" che "['Label1', 'Label2']"
      const rawTagLabels = mapping.tag_labels ? row[mapping.tag_labels] : '';
      const tag_labels = rawTagLabels
        ? rawTagLabels
            .replace(/^\[|\]$/g, '')  // rimuove [ e ]
            .replace(/'/g, '')         // rimuove apici singoli
            .replace(/"/g, '')         // rimuove apici doppi
            .split(/[;,]/)             // split per ; o ,
            .map(t => t.trim())
            .filter(Boolean)
        : [];
  
      if (!email || !isValidEmail(email)) {
        invalidEmails.push({ email: email || "(vuoto)", row: i + 2, name: name || "(senza nome)" });
        return;
      }
  
      if (name && email) {
        validContacts.push({
          id: Date.now() + i, name, email, email_2,
          settore, testata, contact_labels, canale, ruolo, area,
          tipologia_canale, periodicita_canale, copertura_canale,
          tags,
          tag_labels,
        });
      }
    });
  
    if (validContacts.length === 0) {
      if (duplicateEmails.length > 0) {
        toast.error(`❌ Tutti i ${duplicateEmails.length} contatti nel CSV sono già presenti.`);
      } else {
        toast.error("❌ Nessun contatto valido trovato (controlla i nomi delle colonne)");
      }
      return;
    }
  
    setSummary({
      imported: validContacts.length,
      duplicates: duplicateEmails.length,
      invalid: invalidEmails.length,
      invalidEmailsList: invalidEmails,
      duplicateEmailsList: duplicateEmails
    });
  
    if (invalidEmails.length > 0) toast(`🚫 ${invalidEmails.length} email non valide scartate`);
    if (duplicateEmails.length > 0) toast(`⚠️ ${duplicateEmails.length} duplicati ignorati`);
  
    setPreviewData(validContacts);
    setSelectedRows(validContacts.map(c => c.id));
    setStep(3);
  };

  const toggleSelect = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleImport = async () => {
    const selectedContacts = previewData.filter(c => selectedRows.includes(c.id));
    console.log('🔍 selectedContacts:', selectedContacts.length);
    if (selectedContacts.length === 0) { toast.error("⚠️ Nessun contatto selezionato"); return; }
  
    try {
      setImportProgress({ show: true, current: 0, total: selectedContacts.length, status: 'importing', errors: [] });
      console.log('✅ Progress impostato');
  
      const { data: { user } } = await supabase.auth.getUser();
      console.log('✅ User:', user?.id);
      if (!user) { toast.error("Errore: utente non autenticato"); setImportProgress(prev => ({ ...prev, show: false })); return; }
  
      console.log('⏳ Carico lookup tables...');
      const [
        { data: allSectors },
        { data: allChannels },
        { data: allRoles },
        { data: allAreas },
        { data: allEtichette },
        { data: allTipologie },
        { data: allPeriodicita },
        { data: allCoperture },
        { data: allTestate },
        { data: allTags },
        { data: allTagLabels },
      ] = await Promise.all([
        supabase.from('sectors').select('id, name'),
        supabase.from('channels').select('id, name'),
        supabase.from('contact_roles').select('id, name'),
        supabase.from('areas').select('id, nome').eq('user_id', user.id),
        supabase.from('contact_labels').select('id, nome').eq('user_id', user.id),
        supabase.from('tipologia_canale').select('id, nome').eq('user_id', user.id),
        supabase.from('periodicita_canale').select('id, nome').eq('user_id', user.id),
        supabase.from('copertura_canale').select('id, nome').eq('user_id', user.id),
        supabase.from('testate').select('id, nome').eq('user_id', user.id),
        supabase.from('tags').select('id, label, value').eq('user_id', user.id),
        supabase.from('tag_labels').select('id, label, tag_id').eq('user_id', user.id),
      ]);
      console.log('✅ Lookup tables caricate:', { sectors: allSectors?.length, channels: allChannels?.length, roles: allRoles?.length });
  
      // ✅ Carica email esistenti con ID
      const { data: existingContactsFromDB } = await supabase
        .from('contacts')
        .select('id, email')
        .eq('user_id', user.id);
      
      const existingEmailMap = new Map(
        (existingContactsFromDB || []).map(c => [c.email.toLowerCase().trim(), c.id])
      );
  
      let newContacts = selectedContacts.filter(c => !existingEmailMap.has(c.email.toLowerCase().trim()));
  
      const seenEmails = new Set();
      const duplicatesInCSV = [];
      newContacts = newContacts.filter(contact => {
        const email = contact.email.toLowerCase().trim();
        if (seenEmails.has(email)) { duplicatesInCSV.push(email); return false; }
        seenEmails.add(email);
        return true;
      });
  
      if (newContacts.length === 0) {
        toast.error("⚠️ Tutti i contatti sono già presenti o duplicati");
        setImportProgress(prev => ({ ...prev, show: false }));
        return;
      }
  
      const insertedContacts = [];
      const failedContacts = [];
      const testateCache = [...(allTestate || [])];
      const tagsCache = [...(allTags || [])];
  
      for (const contact of newContacts) {
        try {
          const normalize = (val) => (val || '').toLowerCase().trim();
  
          const sectorId = (allSectors || []).find(s => normalize(s.name) === normalize(contact.settore))?.id || null;
          const channelId = (allChannels || []).find(c => normalize(c.name) === normalize(contact.canale))?.id || null;
          const roleId = (allRoles || []).find(r => normalize(r.name) === normalize(contact.ruolo))?.id || null;
          const areaId = (allAreas || []).find(a => normalize(a.nome) === normalize(contact.area))?.id || null;
          const tipologiaId = (allTipologie || []).find(t => normalize(t.nome) === normalize(contact.tipologia_canale))?.id || null;
          const periodicitaId = (allPeriodicita || []).find(p => normalize(p.nome) === normalize(contact.periodicita_canale))?.id || null;
          const coperturaId = (allCoperture || []).find(c => normalize(c.nome) === normalize(contact.copertura_canale))?.id || null;
          const labelId = (allEtichette || []).find(e => normalize(e.nome) === normalize(contact.contact_labels))?.id || null;
  
          // ✅ Testata — cerca o crea
          let testataId = testateCache.find(t => normalize(t.nome) === normalize(contact.testata))?.id || null;
          if (!testataId && contact.testata?.trim()) {
            const { data: newTestata } = await supabase
              .from('testate')
              .insert({
                id: crypto.randomUUID(),
                user_id: user.id,
                nome: contact.testata.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id, nome').single();
            if (newTestata) { testataId = newTestata.id; testateCache.push(newTestata); }
          }
  
          // ✅ Insert contatto — solo insert, niente upsert
          const contactId = crypto.randomUUID();
          const { error: contactError } = await supabase.from('contacts').insert({
            id: contactId,
            user_id: user.id,
            name: contact.name,
            email: contact.email.toLowerCase().trim(),
            email_2: contact.email_2 || null,
            status: 'active',
            sector_id: sectorId,
            channel_id: channelId,
            contact_role_id: roleId,
            area_id: areaId,
            tipologia_canale_id: tipologiaId,
            periodicita_canale_id: periodicitaId,
            copertura_canale_id: coperturaId,
            contact_label_id: labelId,
            testata_id: testataId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
  
          if (contactError) throw contactError;
  
          // ✅ Tags
          if (contact.tags && contact.tags.length > 0) {
            for (const tagLabel of contact.tags.filter(t => t.trim() !== '')) {
              const tagValue = tagLabel.toLowerCase().replace(/\s+/g, '-');
              let tagId = tagsCache.find(t => t.value === tagValue || normalize(t.label) === normalize(tagLabel))?.id;
  
              if (!tagId) {
                const { data: newTag } = await supabase
                  .from('tags')
                  .insert({
                    id: crypto.randomUUID(),
                    user_id: user.id,
                    label: tagLabel.trim(),
                    value: tagValue,
                    color: '#3b82f6',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select('id, label, value').single();
                if (newTag) { tagId = newTag.id; tagsCache.push(newTag); }
              }
  
              if (tagId) {
                await supabase.from('contact_tags').insert({
                  id: crypto.randomUUID(),
                  contact_id: contactId,
                  tag_id: tagId,
                  created_at: new Date().toISOString(),
                });
              }
            }
          }
  
          // ✅ Tag Labels
          if (contact.tag_labels && contact.tag_labels.length > 0) {
            for (const labelName of contact.tag_labels.filter(l => l.trim() !== '')) {
              const foundLabel = (allTagLabels || []).find(
                tl => normalize(tl.label) === normalize(labelName)
              );
  
              if (foundLabel) {
                const { error: labelError } = await supabase.from('contact_tag_labels').insert({
                  id: crypto.randomUUID(),
                  contact_id: contactId,
                  tag_label_id: foundLabel.id,
                  created_at: new Date().toISOString(),
                });
                if (labelError) console.warn(`⚠️ Errore tag_label "${labelName}":`, labelError);
              } else {
                console.warn(`⚠️ Sotto-etichetta "${labelName}" non trovata — ignorata`);
              }
            }
          }
  
          insertedContacts.push(contact);
  
        } catch (err) {
          console.error('❌ Errore contatto:', contact.email, err);
          failedContacts.push({ contact, error: err });
          setImportProgress(prev => ({
            ...prev,
            errors: [...prev.errors, { email: contact.email, reason: err.message }]
          }));
        }
  
        setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
  
      onImport(insertedContacts);

      // ✅ Notifica importazione contatti
try {
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: `👥 ${insertedContacts.length} contatti importati`,
    description: `Importati da CSV: ${insertedContacts.length} nuovi contatti`,
    type: 'success',
    read: false,
    visible_to: 'all',
  });
} catch (notifError) {
  console.warn('⚠️ Notifica fallita:', notifError.message);
}
  
      setImportProgress({
        show: true,
        current: newContacts.length,
        total: newContacts.length,
        status: 'completed',
        errors: []
      });
  
      setSummary(prev => ({
        ...prev,
        imported: insertedContacts.length,
        duplicates: (selectedContacts.length - insertedContacts.length) + duplicatesInCSV.length,
        invalid: failedContacts.length,
      }));
  
      setTimeout(() => { setImportProgress(prev => ({ ...prev, show: false })); setStep(4); }, 2000);
  
    } catch (error) {
      console.error("❌ Errore importazione:", error);
      setImportProgress({
        show: true, current: 0, total: 0, status: 'error',
        errors: [{ email: 'Sistema', reason: error.message }]
      });
      setTimeout(() => { setImportProgress(prev => ({ ...prev, show: false })); }, 3000);
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
    // ✅ Reset input file nel DOM
    const fileInput = document.querySelector('input[type="file"][accept=".csv"]');
    if (fileInput) fileInput.value = '';
    onClose();
  };
  if (!show) return null;

  const mappingFields = [
    { key: "name", label: "Colonna Nome *" },
    { key: "email", label: "Colonna Email Principale *" },
    { key: "email_2", label: "Email Secondaria (opzionale)" },
    { key: "tags", label: "Tag (opzionale) — separati da ;" },
    { key: "tag_labels", label: "Sotto-etichette Tag (opzionale) — separate da ;" },
    { key: "contact_labels", label: "Colonna Etichetta Contatto *" },
    { key: "settore", label: "Settore (opzionale)" },
    { key: "canale", label: "Canale (opzionale)" },
    { key: "ruolo", label: "Ruolo (opzionale)" },
    { key: "area", label: "Area (opzionale)" },
    { key: "testata", label: "Testata (opzionale)" },
    { key: "tipologia_canale", label: "Tipologia Canale (opzionale)" },
    { key: "periodicita_canale", label: "Periodicità Canale (opzionale)" },
    { key: "copertura_canale", label: "Copertura Canale (opzionale)" },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-lg max-h-[90vh] overflow-y-auto">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h3 className="text-xl font-bold mb-4">Importa Contatti da CSV</h3>
              <p className="text-gray-600 text-sm mb-4">
                Carica un file CSV con le colonne desiderate oppure scarica il modello pronto.
              </p>
              <input type="file" accept=".csv" onChange={handleFileChange}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 mb-6" />
              <div className="flex gap-3">
                <button onClick={handleDownloadTemplate} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg">
                  📥 Scarica modello CSV
                </button>
                <button onClick={handleParseHeaders} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">
                  Continua
                </button>
              </div>
              <div className="mt-4 text-center">
                <button onClick={handleClose} className="text-gray-500 text-sm hover:underline">Annulla importazione</button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h3 className="text-xl font-bold mb-4">Mappa le Colonne</h3>
              <p className="text-gray-600 text-sm mb-4">Abbina le colonne del tuo CSV ai campi del sistema.</p>
              <div className="space-y-3 mb-6">
                {mappingFields.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <select value={mapping[key]} onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                      <option value="">-- Seleziona colonna --</option>
                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg">Indietro</button>
                <button onClick={handleConfirmMapping} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">Continua</button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <h3 className="text-xl font-bold mb-4">Anteprima Contatti</h3>
              <p className="text-gray-600 text-sm mb-4">
                Seleziona i contatti da importare ({selectedRows.length}/{previewData.length})
              </p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">✔</th>
                      <th className="px-4 py-2">Nome</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Settore</th>
                      <th className="px-4 py-2">Canale</th>
                      <th className="px-4 py-2">Testata</th>
                      <th className="px-4 py-2">Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map(c => (
                      <tr key={c.id} className={`${selectedRows.includes(c.id) ? "bg-blue-50" : "hover:bg-gray-50"} border-b`}>
                        <td className="text-center px-3 py-2">
                          <input type="checkbox" checked={selectedRows.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-800">{c.name}</td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{c.email}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{c.settore || '-'}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{c.canale || '-'}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{c.testata || '-'}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{(c.tags || []).join(", ") || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg">Annulla</button>
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg">Indietro</button>
                <button onClick={handleImport} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">Importa Selezionati</button>
              </div>
            </>
          )}

          {/* STEP 4 */}
          {step === 4 && summary && (
            <div className="overflow-y-auto max-h-[80vh]">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">✅ Importazione completata</h3>
              <div className="space-y-3 mb-6 text-center">
                <p className="text-lg text-green-600 font-semibold">{summary.imported} contatti importati correttamente</p>
                <p className="text-yellow-600 text-sm">⚠️ {summary.duplicates} duplicati ignorati</p>
                <p className="text-red-600 text-sm">🚫 {summary.invalid} email non valide scartate</p>
              </div>

              {summary.invalidEmailsList?.length > 0 && (
                <div className="mb-6">
                  <details className="bg-red-50 border border-red-200 rounded-lg" open>
                    <summary className="cursor-pointer p-4 font-semibold text-red-800 hover:bg-red-100 flex items-center justify-between">
                      <span>📋 Email non valide ({summary.invalidEmailsList.length})</span>
                    </summary>
                    <div className="p-4 max-h-80 overflow-y-auto border-t border-red-200 bg-white">
                      <button onClick={() => { navigator.clipboard.writeText(summary.invalidEmailsList.map(i => `Riga ${i.row}: ${i.name} - ${i.email}`).join('\n')); toast.success('📋 Copiato!'); }}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 mb-2">📋 Copia tutto</button>
                      <table className="w-full text-sm">
                        <thead><tr className="bg-red-100"><th className="px-3 py-2 text-left text-xs">Riga</th><th className="px-3 py-2 text-left text-xs">Nome</th><th className="px-3 py-2 text-left text-xs">Email</th></tr></thead>
                        <tbody>{summary.invalidEmailsList.map((item, i) => (
                          <tr key={i} className="hover:bg-red-50 border-b border-red-100">
                            <td className="px-3 py-2 text-xs">#{item.row}</td>
                            <td className="px-3 py-2 text-xs">{item.name}</td>
                            <td className="px-3 py-2 text-xs text-red-600">{item.email}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </details>
                </div>
              )}

              {summary.duplicateEmailsList?.length > 0 && (
                <div className="mb-6">
                  <details className="bg-yellow-50 border border-yellow-200 rounded-lg">
                    <summary className="cursor-pointer p-4 font-semibold text-yellow-800 hover:bg-yellow-100 flex items-center justify-between">
                      <span>📋 Email duplicate ({summary.duplicateEmailsList.length})</span>
                    </summary>
                    <div className="p-4 max-h-80 overflow-y-auto border-t border-yellow-200 bg-white">
                      <button onClick={() => { navigator.clipboard.writeText(summary.duplicateEmailsList.join('\n')); toast.success('📋 Copiato!'); }}
                        className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 mb-2">📋 Copia tutto</button>
                      {summary.duplicateEmailsList.map((email, i) => (
                        <div key={i} className="text-sm text-yellow-700 font-mono bg-yellow-50 px-3 py-2 rounded border border-yellow-200 mb-1">{email}</div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              <button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium">
                Chiudi riepilogo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PROGRESS MODAL */}
      {importProgress.show && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className={`p-6 text-center flex-shrink-0 ${
              importProgress.status === 'importing' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
              importProgress.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600' :
              'bg-gradient-to-r from-red-500 to-red-600'
            }`}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                {importProgress.status === 'importing' && <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                {importProgress.status === 'completed' && <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                {importProgress.status === 'error' && <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
              </div>
              <h3 className="text-2xl font-bold text-white">
                {importProgress.status === 'importing' ? 'Importazione in corso...' : importProgress.status === 'completed' ? 'Completato!' : 'Errore'}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Contatti processati</span>
                  <span className="font-bold">{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${importProgress.status === 'completed' ? 'bg-green-600' : importProgress.status === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
                    style={{ width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-gray-800">
                  {importProgress.total ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {importProgress.status === 'importing' ? 'Attendere prego...' : importProgress.status === 'completed' ? 'Importazione completata!' : 'Si è verificato un errore'}
                </p>
              </div>
              {importProgress.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto mb-4">
                  <p className="text-xs font-semibold text-red-800 mb-2">{importProgress.errors.length} errori rilevati:</p>
                  {importProgress.errors.map((err, i) => (
                    <div key={i} className="text-xs text-red-700 bg-white rounded px-2 py-1 mb-1">
                      <span className="font-medium">{err.email}</span> - {err.reason}
                    </div>
                  ))}
                </div>
              )}
              {importProgress.status === 'importing' && (
                <button onClick={() => { setImportProgress(prev => ({ ...prev, show: false })); setStep(3); toast.error('❌ Importazione annullata'); }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium">
                  Annulla importazioneonImport(insertedContacts);onImport(insertedContacts);
                </button>
              )}
              {(importProgress.status === 'completed' || importProgress.status === 'error') && (
                <button onClick={() => { setImportProgress({ show: false, current: 0, total: 0, status: 'importing', errors: [] }); if (importProgress.status === 'completed') setStep(4); else setStep(3); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium">
                  Chiudi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
    
};

export default ImportContactsModal;







