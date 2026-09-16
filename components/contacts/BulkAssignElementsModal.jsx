import React, { useState } from 'react';
import { Tag, Layers, X, Check, Loader2, Info, Plus, RefreshCw, Bookmark } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BulkAssignElementsModal = ({
  show,
  onClose,
  selectedContactIds = [],
  contacts = [],
  contactLabels = [],
  tags = [],
  tagLabels = [],
  onSuccess,
}) => {
  const [selectedLabelId, setSelectedLabelId] = useState('KEEP'); // 'KEEP', 'REMOVE', or label UUID
  const [selectedTagValues, setSelectedTagValues] = useState([]); // array of tag labels or IDs
  const [tagMode, setTagMode] = useState('ADD'); // 'ADD' or 'REPLACE'
  const [selectedTagLabelValues, setSelectedTagLabelValues] = useState([]); // array of sub-label values
  const [tagLabelMode, setTagLabelMode] = useState('ADD'); // 'ADD' or 'REPLACE'
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const handleToggleTag = (tagVal) => {
    setSelectedTagValues(prev =>
      prev.includes(tagVal)
        ? prev.filter(t => t !== tagVal)
        : [...prev, tagVal]
    );
  };

  const handleToggleTagLabel = (labelVal) => {
    setSelectedTagLabelValues(prev =>
      prev.includes(labelVal)
        ? prev.filter(l => l !== labelVal)
        : [...prev, labelVal]
    );
  };

  const handleSave = async () => {
    if (selectedContactIds.length === 0) {
      toast.error('Nessun contatto selezionato');
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Trova i contatti da aggiornare
      const contactsToUpdate = contacts.filter(c => selectedContactIds.includes(c.id));
      const updatedMap = {};

      for (const contact of contactsToUpdate) {
        const contactId = contact.id;
        const updates = {};

        // 1. Etichetta principale (contact_label_id)
        if (selectedLabelId === 'REMOVE') {
          updates.contact_label_id = null;
        } else if (selectedLabelId !== 'KEEP') {
          updates.contact_label_id = selectedLabelId;
        }

        // 2. Tag standard (tags)
        if (selectedTagValues.length > 0) {
          if (tagMode === 'REPLACE') {
            updates.tags = selectedTagValues;
          } else {
            const currentTags = Array.isArray(contact.tags) ? contact.tags : [];
            const merged = Array.from(new Set([...currentTags, ...selectedTagValues]));
            updates.tags = merged;
          }
        }

        // 3. Sotto-etichette (tag_labels)
        if (selectedTagLabelValues.length > 0) {
          if (tagLabelMode === 'REPLACE') {
            updates.tag_labels = selectedTagLabelValues;
          } else {
            const currentTagLabels = Array.isArray(contact.tag_labels) ? contact.tag_labels : [];
            const merged = Array.from(new Set([...currentTagLabels, ...selectedTagLabelValues]));
            updates.tag_labels = merged;
          }
        }

        if (Object.keys(updates).length > 0) {
          // Aggiorna tabella contacts
          const { error: updateErr } = await supabase
            .from('contacts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', contactId);

          if (updateErr) {
            console.error(`Errore aggiornamento contatto ${contactId}:`, updateErr);
          }

          // Salva in tabella di giunzione contact_tags se sono stati inseriti tag
          if (updates.tags && Array.isArray(updates.tags)) {
            try {
              await supabase.from('contact_tags').delete().eq('contact_id', contactId);
              const tagObjList = tags.filter(t => updates.tags.includes(t.label || t.value || t.id));
              const tagInserts = tagObjList.map(t => ({
                id: crypto.randomUUID(),
                contact_id: contactId,
                tag_id: t.id
              }));
              if (tagInserts.length > 0) {
                await supabase.from('contact_tags').insert(tagInserts);
              }
            } catch (errTag) {
              console.warn('Tabella contact_tags non aggiornata:', errTag);
            }
          }

          // Salva in tabella di giunzione contact_tag_labels se sono state inserite sotto-etichette
          if (updates.tag_labels && Array.isArray(updates.tag_labels)) {
            try {
              await supabase.from('contact_tag_labels').delete().eq('contact_id', contactId);
              const subObjList = tagLabels.filter(tl => updates.tag_labels.includes(tl.label || tl.id));
              const subInserts = subObjList.map(tl => ({
                id: crypto.randomUUID(),
                contact_id: contactId,
                tag_label_id: tl.id
              }));
              if (subInserts.length > 0) {
                await supabase.from('contact_tag_labels').insert(subInserts);
              }
            } catch (errSub) {
              console.warn('Tabella contact_tag_labels non aggiornata:', errSub);
            }
          }

          updatedMap[contactId] = updates;
        }
      }

      toast.success(`✅ Elementi aggiornati per ${selectedContactIds.length} contatti!`);
      if (onSuccess) onSuccess(updatedMap);
      onClose();
    } catch (err) {
      console.error('Errore assegnazione elementi:', err);
      toast.error('Errore durante l\'assegnazione degli elementi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Assegna Elementi ai Contatti</h2>
              <p className="text-emerald-100 text-xs">
                {selectedContactIds.length} {selectedContactIds.length === 1 ? 'contatto selezionato' : 'contatti selezionati'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-gray-700">

          {/* 1. SEZIONE ETICHETTA PRINCIPALE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                1. Etichetta Principale (Contact Label)
              </label>
              <span className="text-[11px] text-gray-400 font-normal">Seleziona un'etichetta per il gruppo</span>
            </div>

            <select
              value={selectedLabelId}
              onChange={(e) => setSelectedLabelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800"
            >
              <option value="KEEP">🔹 Mantieni etichette attuali dei contatti (nessuna modifica)</option>
              <option value="REMOVE">❌ Rimuovi etichetta attuale a tutti</option>
              {contactLabels.map(l => (
                <option key={l.id} value={l.id}>
                  🏷️ {l.nome}
                </option>
              ))}
            </select>
          </div>

          {/* 2. SEZIONE TAG STANDARD */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                <Tag className="w-4 h-4 text-blue-600" />
                2. Tag Standard
              </label>

              {/* Modalità Aggiungi / Sostituisci */}
              <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTagMode('ADD')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center gap-1 ${
                    tagMode === 'ADD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Plus className="w-3 h-3" /> Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => setTagMode('REPLACE')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center gap-1 ${
                    tagMode === 'REPLACE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" /> Sostituisci
                </button>
              </div>
            </div>

            {tags.length === 0 ? (
              <p className="text-gray-400 italic text-[11px] py-1">Nessun tag disponibile nel sistema</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map(t => {
                  const tagVal = t.label || t.value || t.name;
                  const isSelected = selectedTagValues.includes(tagVal);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleTag(tagVal)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                      style={{
                        backgroundColor: isSelected ? (t.color || '#2563eb') : undefined,
                        borderColor: isSelected ? (t.color || '#1d4ed8') : undefined,
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{tagVal}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. SEZIONE SOTTO-ETICHETTE (TAG LABELS) */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <Layers className="w-4 h-4 text-amber-600" />
                3. Sotto-etichette (Tag Labels)
              </label>

              {/* Modalità Aggiungi / Sostituisci */}
              <div className="flex items-center gap-1 bg-white border border-amber-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTagLabelMode('ADD')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center gap-1 ${
                    tagLabelMode === 'ADD'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Plus className="w-3 h-3" /> Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => setTagLabelMode('REPLACE')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center gap-1 ${
                    tagLabelMode === 'REPLACE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" /> Sostituisci
                </button>
              </div>
            </div>

            {tagLabels.length === 0 ? (
              <p className="text-gray-400 italic text-[11px] py-1">Nessuna sotto-etichetta disponibile nel sistema</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tagLabels.map(tl => {
                  const labelVal = tl.label || tl.name || tl.id;
                  const isSelected = selectedTagLabelValues.includes(labelVal);
                  return (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => handleToggleTagLabel(labelVal)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1 shadow-2xs ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{labelVal}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-[11px] text-gray-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Gli elementi selezionati verranno applicati contemporaneamente a tutti i <strong>{selectedContactIds.length}</strong> contatti selezionati.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-medium transition"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            {saving ? 'Salvataggio...' : `Salva elementi su ${selectedContactIds.length} contatti`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkAssignElementsModal;
