import React, { useState } from 'react';
import { Tag, Layers, X, Check, Loader2, Info, Plus, RefreshCw, Bookmark, CheckSquare, Square } from 'lucide-react';
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
  const [selectedTagValues, setSelectedTagValues] = useState([]); // array of tag labels or values
  const [tagMode, setTagMode] = useState('ADD'); // 'ADD' or 'REPLACE'
  const [selectedTagLabelValues, setSelectedTagLabelValues] = useState([]); // array of sub-label values
  const [tagLabelMode, setTagLabelMode] = useState('ADD'); // 'ADD' or 'REPLACE'
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const handleToggleTag = (tagVal) => {
    setSelectedTagValues(prev =>
      prev.includes(tagVal)
        ? prev.filter(t => t !== tagVal)
        : [...prev, tagVal]
    );
  };

  const handleSelectAllTags = () => {
    if (selectedTagValues.length === tags.length) {
      setSelectedTagValues([]);
    } else {
      setSelectedTagValues(tags.map(t => t.label || t.value || t.name || t.id));
    }
  };

  const handleToggleTagLabel = (labelVal) => {
    setSelectedTagLabelValues(prev =>
      prev.includes(labelVal)
        ? prev.filter(l => l !== labelVal)
        : [...prev, labelVal]
    );
  };

  const handleSelectAllTagLabels = () => {
    if (selectedTagLabelValues.length === tagLabels.length) {
      setSelectedTagLabelValues([]);
    } else {
      setSelectedTagLabelValues(tagLabels.map(tl => tl.label || tl.name || tl.id));
    }
  };

  const handleSave = async () => {
    if (selectedContactIds.length === 0) {
      toast.error('Nessun contatto selezionato');
      return;
    }

    const hasLabelChange = selectedLabelId !== 'KEEP';
    const hasTagChange = selectedTagValues.length > 0;
    const hasSubLabelChange = selectedTagLabelValues.length > 0;

    if (!hasLabelChange && !hasTagChange && !hasSubLabelChange) {
      toast.error('Seleziona almeno un\'etichetta, un tag o una sotto-etichetta da assegnare.');
      return;
    }

    setSaving(true);

    try {
      // Trova i contatti da aggiornare
      const contactsToUpdate = contacts.filter(c => selectedContactIds.includes(c.id));
      const updatedMap = {};
      const contactUpdatesList = [];

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
        if (hasTagChange) {
          if (tagMode === 'REPLACE') {
            updates.tags = [...selectedTagValues];
          } else {
            const currentTags = parseArray(contact.tags);
            const merged = Array.from(new Set([...currentTags, ...selectedTagValues]));
            updates.tags = merged;
          }
        }

        // 3. Sotto-etichette (tag_labels)
        if (hasSubLabelChange) {
          if (tagLabelMode === 'REPLACE') {
            updates.tag_labels = [...selectedTagLabelValues];
          } else {
            const currentTagLabels = parseArray(contact.tag_labels);
            const merged = Array.from(new Set([...currentTagLabels, ...selectedTagLabelValues]));
            updates.tag_labels = merged;
          }
        }

        if (Object.keys(updates).length > 0) {
          updatedMap[contactId] = updates;
          contactUpdatesList.push({ id: contactId, updates });
        }
      }

      if (contactUpdatesList.length === 0) {
        toast.info('Nessuna modifica da applicare');
        setSaving(false);
        return;
      }

      // Esegui aggiornamenti su tabella 'contacts' in chunks paralleli
      const chunkSize = 15;
      for (let i = 0; i < contactUpdatesList.length; i += chunkSize) {
        const chunk = contactUpdatesList.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(item =>
            supabase
              .from('contacts')
              .update({
                ...item.updates,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
          )
        );
      }

      // Gestione tabella di giunzione contact_tags
      if (hasTagChange) {
        const affectedTagContactIds = contactUpdatesList.map(item => item.id);
        try {
          // Cancella vecchi tag per i contatti interessati
          await supabase
            .from('contact_tags')
            .delete()
            .in('contact_id', affectedTagContactIds);

          const allTagInserts = [];
          contactUpdatesList.forEach(item => {
            const targetTags = item.updates.tags || [];
            targetTags.forEach(tVal => {
              const matchedTag = tags.find(t =>
                String(t.id) === String(tVal) ||
                String(t.label) === String(tVal) ||
                String(t.value) === String(tVal) ||
                String(t.name) === String(tVal)
              );
              if (matchedTag && matchedTag.id) {
                allTagInserts.push({
                  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36)),
                  contact_id: item.id,
                  tag_id: matchedTag.id
                });
              }
            });
          });

          if (allTagInserts.length > 0) {
            for (let i = 0; i < allTagInserts.length; i += 100) {
              await supabase.from('contact_tags').insert(allTagInserts.slice(i, i + 100));
            }
          }
        } catch (errTag) {
          console.warn('Tabella contact_tags non aggiornata:', errTag);
        }
      }

      // Gestione tabella di giunzione contact_tag_labels
      if (hasSubLabelChange) {
        const affectedSubContactIds = contactUpdatesList.map(item => item.id);
        try {
          await supabase
            .from('contact_tag_labels')
            .delete()
            .in('contact_id', affectedSubContactIds);

          const allSubInserts = [];
          contactUpdatesList.forEach(item => {
            const targetSubs = item.updates.tag_labels || [];
            targetSubs.forEach(tlVal => {
              const matchedSub = tagLabels.find(tl =>
                String(tl.id) === String(tlVal) ||
                String(tl.label) === String(tlVal) ||
                String(tl.name) === String(tlVal)
              );
              if (matchedSub && matchedSub.id) {
                allSubInserts.push({
                  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36)),
                  contact_id: item.id,
                  tag_label_id: matchedSub.id
                });
              }
            });
          });

          if (allSubInserts.length > 0) {
            for (let i = 0; i < allSubInserts.length; i += 100) {
              await supabase.from('contact_tag_labels').insert(allSubInserts.slice(i, i + 100));
            }
          }
        } catch (errSub) {
          console.warn('Tabella contact_tag_labels non aggiornata:', errSub);
        }
      }

      toast.success(`✅ Elementi assegnati con successo a ${selectedContactIds.length} contatti!`);
      if (onSuccess) onSuccess(updatedMap);
      onClose();
    } catch (err) {
      console.error('Errore assegnazione elementi:', err);
      toast.error('Errore durante l\'assegnazione degli elementi: ' + (err.message || 'Errore database'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Assegna Elementi ai Contatti</h2>
              <p className="text-emerald-100 text-xs">
                {selectedContactIds.length} {selectedContactIds.length === 1 ? 'contatto selezionato' : 'contatti selezionati'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-gray-700">

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800 outline-none"
            >
              <option value="KEEP">🔹 Mantieni etichette attuali dei contatti (nessuna modifica)</option>
              <option value="REMOVE">❌ Rimuovi etichetta attuale a tutti</option>
              {contactLabels.map(l => (
                <option key={l.id} value={l.id}>
                  🏷️ {l.nome || l.label || l.name}
                </option>
              ))}
            </select>
            {selectedLabelId !== 'KEEP' && (
              <p className="text-[11px] font-medium text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                {selectedLabelId === 'REMOVE'
                  ? '❌ L\'etichetta principale verrà rimossa da tutti i contatti selezionati.'
                  : `🏷️ L'etichetta selezionata "${contactLabels.find(l => String(l.id) === String(selectedLabelId))?.nome || 'Etichetta'}" verrà applicata a tutti i contatti selezionati.`}
              </p>
            )}
          </div>

          {/* 2. SEZIONE TAG STANDARD */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                  <Tag className="w-4 h-4 text-blue-600" />
                  2. Tag Standard
                </label>
                {tags.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllTags}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline ml-2"
                  >
                    {selectedTagValues.length === tags.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                  </button>
                )}
              </div>

              {/* Modalità Aggiungi / Sostituisci */}
              <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTagMode('ADD')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                    tagMode === 'ADD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Aggiungi ai tag già presenti nei contatti"
                >
                  <Plus className="w-3.5 h-3.5" /> Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => setTagMode('REPLACE')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                    tagMode === 'REPLACE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Sostituisci tutti i tag esistenti nei contatti con quelli selezionati"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sostituisci
                </button>
              </div>
            </div>

            {tags.length === 0 ? (
              <p className="text-gray-400 italic text-[11px] py-1">Nessun tag standard disponibile nel sistema</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
                {tags.map(t => {
                  const tagVal = t.label || t.value || t.name || t.id;
                  const isSelected = selectedTagValues.includes(tagVal);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleTag(tagVal)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 font-bold'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                      style={{
                        backgroundColor: isSelected ? (t.color || '#2563eb') : undefined,
                        borderColor: isSelected ? (t.color || '#1d4ed8') : undefined,
                      }}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-gray-400" />}
                      <span>{t.label || t.name || t.value}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTagValues.length > 0 ? (
              <div className="text-[11px] bg-blue-100/70 text-blue-900 p-2 rounded-lg border border-blue-200">
                {tagMode === 'ADD' ? (
                  <span>
                    ➕ Modalità <strong>Aggiungi</strong>: i <strong>{selectedTagValues.length}</strong> tag selezionati verranno <em>aggiunti</em> a tutti i contatti (i tag già presenti saranno mantenuti).
                  </span>
                ) : (
                  <span>
                    🔄 Modalità <strong>Sostituisci</strong>: i tag attuali dei contatti verranno <em>completamente sostituiti</em> con i <strong>{selectedTagValues.length}</strong> tag selezionati.
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">
                Nessun tag selezionato (i tag attuali dei contatti non subiranno modifiche).
              </p>
            )}
          </div>

          {/* 3. SEZIONE SOTTO-ETICHETTE (TAG LABELS) */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <Layers className="w-4 h-4 text-amber-600" />
                  3. Sotto-etichette (Tag Labels)
                </label>
                {tagLabels.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllTagLabels}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline ml-2"
                  >
                    {selectedTagLabelValues.length === tagLabels.length ? 'Deseleziona tutte' : 'Seleziona tutte'}
                  </button>
                )}
              </div>

              {/* Modalità Aggiungi / Sostituisci */}
              <div className="flex items-center gap-1 bg-white border border-amber-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTagLabelMode('ADD')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                    tagLabelMode === 'ADD'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Aggiungi alle sotto-etichette già presenti"
                >
                  <Plus className="w-3.5 h-3.5" /> Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => setTagLabelMode('REPLACE')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                    tagLabelMode === 'REPLACE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Sostituisci tutte le sotto-etichette esistenti"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sostituisci
                </button>
              </div>
            </div>

            {tagLabels.length === 0 ? (
              <p className="text-gray-400 italic text-[11px] py-1">Nessuna sotto-etichetta disponibile nel sistema</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
                {tagLabels.map(tl => {
                  const labelVal = tl.label || tl.name || tl.id;
                  const isSelected = selectedTagLabelValues.includes(labelVal);
                  return (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => handleToggleTagLabel(labelVal)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-300 font-bold'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-gray-400" />}
                      <span>{tl.label || tl.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedTagLabelValues.length > 0 ? (
              <div className="text-[11px] bg-amber-100/70 text-amber-900 p-2 rounded-lg border border-amber-200">
                {tagLabelMode === 'ADD' ? (
                  <span>
                    ➕ Modalità <strong>Aggiungi</strong>: le <strong>{selectedTagLabelValues.length}</strong> sotto-etichette selezionate verranno <em>aggiunte</em> ai contatti.
                  </span>
                ) : (
                  <span>
                    🔄 Modalità <strong>Sostituisci</strong>: le sotto-etichette attuali verranno <em>sostituite</em> con le <strong>{selectedTagLabelValues.length}</strong> selezionate.
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">
                Nessuna sotto-etichetta selezionata (le sotto-etichette attuali non subiranno modifiche).
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 text-[11px] text-emerald-900">
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
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            {saving ? 'Salvataggio in corso...' : `Salva su ${selectedContactIds.length} contatti`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkAssignElementsModal;
