// src/components/email/RecipientSelect.jsx
import React, { useState, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { Plus, Users, Tag, Filter, Eye, Search, X, Copy } from 'lucide-react';
import { useTags } from '../../hooks/useTags';
import AddTagModal from '../../components/modals/AddTagModal';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const colorOptions = [
  { value: '#3b82f6', name: 'Blu' },
  { value: '#10b981', name: 'Verde' },
  { value: '#f59e0b', name: 'Arancione' },
  { value: '#ef4444', name: 'Rosso' },
  { value: '#8b5cf6', name: 'Viola' },
  { value: '#ec4899', name: 'Rosa' },
  { value: '#6366f1', name: 'Indaco' },
  { value: '#14b8a6', name: 'Teal' },
];

const parseContactIds = (raw) => {
  if (!raw) return [];
  let items = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === 'string') {
    let str = raw.trim();
    if (str.startsWith('{') && str.endsWith('}')) {
      str = str.slice(1, -1);
    } else if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) items = parsed;
        else str = str.slice(1, -1);
      } catch {
        str = str.slice(1, -1);
      }
    }
    if (items.length === 0 && str) {
      items = str.split(',');
    }
  } else if (typeof raw === 'number') {
    return [String(raw)];
  }

  return items
    .map(item => String(item).replace(/['"{} \t\n\r]/g, '').trim())
    .filter(Boolean);
};

const RecipientSelect = ({
  value,
  onChange,
  contacts = [],
  className = '',
}) => {
  const { tags, createTag, loading: tagsLoading } = useTags();
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [pendingTag, setPendingTag] = useState(null);
  
  // Modale elenco nomi + email contatti per tutte le liste
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Stato per modalità filtro
  const [filterMode, setFilterMode] = useState('tag'); // 'tag' | 'label' | 'tag_label'
  
  // ✅ NUOVO: stato per etichette contatto e sotto-etichette
  const [contactLabels, setContactLabels] = useState([]);
  const [tagLabels, setTagLabels] = useState([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  // ✅ Carica etichette e liste contatti al mount
  React.useEffect(() => {
    const loadLabels = async () => {
      setLoadingLabels(true);
      try {
        const [{ data: listsData }, { data: labelsData }, { data: tagLabelsData }, { data: junctionData }] = await Promise.all([
          supabase.from('contact_lists').select('*').order('created_at', { ascending: false }),
          supabase.from('contact_labels').select('*').order('nome'),
          supabase.from('tag_labels').select('*, tags(id, label, color)').order('label'),
          supabase.from('list_contacts').select('*').then(res => res.data || []).catch(() => []),
        ]);

        const combinedLists = [];
        const seenIds = new Set();

        (listsData || []).forEach(l => {
          let ids = parseContactIds(l.contact_ids);
          if (junctionData && junctionData.length > 0) {
            const matches = junctionData.filter(j => String(j.list_id || j.listId || j.contact_list_id) === String(l.id));
            const jIds = matches.map(m => String(m.contact_id || m.contactId));
            ids = Array.from(new Set([...ids, ...jIds]));
          }
          combinedLists.push({
            id: l.id,
            nome: l.name || l.title || l.label || l.nome || 'Lista',
            contact_ids: ids,
            color: l.color || '#3b82f6'
          });
          seenIds.add(String(l.id));
        });

        (labelsData || []).forEach(l => {
          if (!seenIds.has(String(l.id))) {
            let ids = parseContactIds(l.contact_ids);
            combinedLists.push({
              id: l.id,
              nome: l.nome || l.name || l.title || 'Etichetta',
              contact_ids: ids,
              color: l.color || '#10b981'
            });
          }
        });

        setContactLabels(combinedLists);
        setTagLabels(tagLabelsData || []);
      } catch (err) {
        console.error('Errore caricamento liste in RecipientSelect:', err);
      } finally {
        setLoadingLabels(false);
      }
    };
    loadLabels();
  }, []);

  const activeContacts = useMemo(() => 
    contacts.filter(c => {
      if (!c) return false;
      if (!c.status) return true;
      const s = String(c.status).toLowerCase();
      return s === 'active' || s === 'attivo' || s === 'approved';
    }), 
    [contacts]
  );

  // ✅ Opzioni basate sulla modalità filtro
  const recipientOptions = useMemo(() => {
    const options = [
      {
        value: 'all',
        label: `✅ Tutti i contatti attivi (${activeContacts.length})`,
        icon: '👥',
      },
    ];

    if (filterMode === 'tag') {
      // Filtro per TAG
      if (tags && tags.length > 0) {
        tags.forEach(tag => {
          const count = activeContacts.filter(
            c => c.tags && (c.tags.includes(tag.value) || c.tags.includes(tag.label))
          ).length;
          options.push({
            value: `tag:${tag.value}`,
            label: `🏷️ ${tag.label} (${count})`,
            color: tag.color,
            isCustomTag: true,
            type: 'tag',
          });
        });
      }
    } else if (filterMode === 'label') {
      // Filtro per ETICHETTA / LISTA CONTATTO
      contactLabels.forEach(label => {
        const listIds = new Set((label.contact_ids || []).map(id => String(id).toLowerCase().trim()));
        const count = activeContacts.filter(c => {
          const cId = String(c.id || '').toLowerCase().trim();
          if (cId && listIds.has(cId)) return true;
          if (label.id && (String(c.contact_label_id) === String(label.id) || String(c.list_id) === String(label.id))) return true;
          return false;
        }).length;

        options.push({
          value: `label:${label.id}`,
          label: `📌 ${label.nome} (${count})`,
          color: label.color,
          isCustomTag: true,
          type: 'label',
        });
      });
    } else if (filterMode === 'tag_label') {
      // Filtro per SOTTO-ETICHETTA TAG
      tagLabels.forEach(tl => {
        const count = activeContacts.filter(
          c => c.tag_labels && c.tag_labels.includes(tl.label)
        ).length;
        options.push({
          value: `tag_label:${tl.id}`,
          label: `→ ${tl.label} (${count})`,
          color: tl.tags?.color || '#f59e0b',
          isCustomTag: true,
          type: 'tag_label',
          tagName: tl.tags?.label,
        });
      });
    }

    return options;
  }, [tags, contacts, filterMode, contactLabels, tagLabels, activeContacts]);

  const customStyles = {
    option: (provided, state) => {
      const option = recipientOptions.find(opt => opt.value === state.data.value);
      return {
        ...provided,
        backgroundColor: state.isSelected
          ? option?.color || '#3b82f6'
          : state.isFocused
          ? option?.color ? `${option.color}20` : '#eff6ff'
          : 'white',
        color: state.isSelected ? 'white' : '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      };
    },
    multiValue: (provided, state) => {
      const option = recipientOptions.find(opt => opt.value === state.data.value);
      return {
        ...provided,
        backgroundColor: option?.color ? `${option.color}20` : '#dbeafe',
        borderRadius: '6px',
      };
    },
    multiValueLabel: (provided, state) => {
      const option = recipientOptions.find(opt => opt.value === state.data.value);
      return {
        ...provided,
        color: option?.color || '#1e40af',
        fontWeight: '500',
      };
    },
    multiValueRemove: (provided, state) => {
      const option = recipientOptions.find(opt => opt.value === state.data.value);
      return {
        ...provided,
        color: option?.color || '#1e40af',
        ':hover': {
          backgroundColor: option?.color || '#1e40af',
          color: 'white',
        },
      };
    },
  };

  const handleChange = (selectedOptions) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map(o => o.value)
      : [];
    if (selectedValues.includes('all')) {
      onChange(['all']);
    } else {
      onChange(selectedValues);
    }
  };

  const handleCreateTag = async (inputValue) => {
    const label = inputValue.trim();
    if (!label) return;
    setPendingTag(label);
  };

  const handleSelectColor = async (color) => {
    if (!pendingTag) return;
    const newTagData = {
      label: pendingTag,
      value: pendingTag.toLowerCase().replace(/\s+/g, '-'),
      color,
    };
    const result = await createTag(newTagData);
    if (result.success) {
      toast.success(`✅ Tag "${newTagData.label}" creato`);
      onChange([...value, `tag:${newTagData.value}`]);
      setPendingTag(null);
    } else {
      toast.error(`❌ Errore: ${result.error}`);
    }
  };

  const handleAddTag = async (tagData) => {
    const result = await createTag(tagData);
    if (result.success) {
      toast.success(`✅ Tag "${tagData.label}" creato`);
      setShowAddTagModal(false);
    } else {
      toast.error(`❌ ${result.error}`);
    }
    return result;
  };

  // ✅ Risolve i contatti reali (Nomi + Email) da tutte le liste/tag selezionate
  const resolvedContactsList = useMemo(() => {
    if (!value || value.length === 0) return [];
    if (value.includes('all')) return activeContacts;

    const matchedMap = new Map();

    value.forEach(val => {
      if (val.startsWith('tag:')) {
        const tagValue = val.replace('tag:', '');
        activeContacts.forEach(c => {
          if (c.tags && (c.tags.includes(tagValue) || c.tags.some(t => t === tagValue))) {
            matchedMap.set(c.id || c.email, c);
          }
        });
      } else if (val.startsWith('label:')) {
        const labelId = val.replace('label:', '');
        const targetLabel = contactLabels.find(l => String(l.id) === String(labelId));
        if (targetLabel) {
          const listIds = new Set((targetLabel.contact_ids || []).map(id => String(id).toLowerCase().trim()));
          activeContacts.forEach(c => {
            const cId = String(c.id || '').toLowerCase().trim();
            if (cId && listIds.has(cId)) matchedMap.set(c.id || c.email, c);
            else if (targetLabel.id && (String(c.contact_label_id) === String(targetLabel.id) || String(c.list_id) === String(targetLabel.id))) {
              matchedMap.set(c.id || c.email, c);
            }
          });
        } else {
          activeContacts.forEach(c => {
            if (String(c.contact_label_id) === String(labelId) || String(c.list_id) === String(labelId)) {
              matchedMap.set(c.id || c.email, c);
            }
          });
        }
      } else if (val.startsWith('tag_label:')) {
        const tagLabelId = val.replace('tag_label:', '');
        const tl = tagLabels.find(t => t.id === tagLabelId);
        if (tl) {
          activeContacts.forEach(c => {
            if (c.tag_labels && c.tag_labels.includes(tl.label)) {
              matchedMap.set(c.id || c.email, c);
            }
          });
        }
      } else {
        const found = activeContacts.find(c => c.email === val || String(c.id) === String(val));
        if (found) matchedMap.set(found.id || found.email, found);
        else matchedMap.set(val, { email: val, full_name: val.split('@')[0] });
      }
    });

    return Array.from(matchedMap.values());
  }, [value, activeContacts, contactLabels, tagLabels]);

  const recipientCount = resolvedContactsList.length;

  const filteredModalContacts = useMemo(() => {
    if (!modalSearch.trim()) return resolvedContactsList;
    const term = modalSearch.toLowerCase();
    return resolvedContactsList.filter(c => {
      const name = (c.full_name || c.name || c.azienda || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [resolvedContactsList, modalSearch]);

  return (
    <div className="space-y-3 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Lista Destinatari
        </label>
        <button
          type="button"
          onClick={() => setShowAddTagModal(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuovo Tag
        </button>
      </div>

      {/* ✅ SWITCHER MODALITÀ FILTRO */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => { setFilterMode('tag'); onChange([]); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition ${
            filterMode === 'tag' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Tag className="w-3 h-3" />
          Per Tag
        </button>
        <button
          type="button"
          onClick={() => { setFilterMode('label'); onChange([]); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition ${
            filterMode === 'label' 
              ? 'bg-white text-indigo-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Filter className="w-3 h-3" />
          Per Etichetta
        </button>
        <button
          type="button"
          onClick={() => { setFilterMode('tag_label'); onChange([]); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition ${
            filterMode === 'tag_label' 
              ? 'bg-white text-amber-700 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🏷️ Sotto-etichette
        </button>
      </div>

      {/* ✅ Descrizione modalità */}
      <p className="text-xs text-gray-500">
        {filterMode === 'tag' && '🏷️ Seleziona i destinatari in base ai tag assegnati'}
        {filterMode === 'label' && '📌 Seleziona i destinatari in base all\'etichetta contatto'}
        {filterMode === 'tag_label' && '→ Seleziona i destinatari in base alle sotto-etichette dei tag'}
      </p>

      {/* Select */}
      <CreatableSelect
        isMulti
        options={recipientOptions}
        value={recipientOptions.filter(opt => value.includes(opt.value))}
        onChange={handleChange}
        onCreateOption={filterMode === 'tag' ? handleCreateTag : undefined}
        styles={customStyles}
        placeholder={
          filterMode === 'tag' ? 'Seleziona tag destinatari...' :
          filterMode === 'label' ? 'Seleziona etichette destinatari...' :
          'Seleziona sotto-etichette...'
        }
        noOptionsMessage={() => 'Nessuna opzione disponibile'}
        isLoading={tagsLoading || loadingLabels}
        formatCreateLabel={inputValue => `➕ Crea tag "${inputValue}"`}
        formatOptionLabel={option => (
          <div className="flex items-center gap-2">
            {option.icon && <span>{option.icon}</span>}
            {option.isCustomTag && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: option.color }}
              />
            )}
            <span className="flex-1">{option.label}</span>
            {option.tagName && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {option.tagName}
              </span>
            )}
          </div>
        )}
        className={className}
      />

      {/* ✅ Palette colori per nuovo tag */}
      {pendingTag && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-fit">
          <p className="text-sm text-gray-700 mb-2">
            Colore per <strong>{pendingTag}</strong>:
          </p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map(c => (
              <button
                key={c.value}
                onClick={() => handleSelectColor(c.value)}
                className="w-8 h-8 rounded-full hover:ring-2 ring-offset-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Conteggio destinatari ed Elenco Dettagliato (Nomi + Email) */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl border ${
            recipientCount > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600 shrink-0" />
              <span>
                {value.includes('all') 
                  ? `${recipientCount} contatti attivi totali`
                  : `${recipientCount} destinatari unici dalle liste selezionate`
                }
              </span>
            </div>
            {resolvedContactsList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowContactsModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1.5 transition shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                Vedi Nomi & Email ({resolvedContactsList.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODALE POPUP ELENCO NOMI + EMAIL CONTATTI */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800">
            {/* Header Modale */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">Contatti delle Liste Selezionate</h3>
                  <p className="text-blue-100 text-xs">{resolvedContactsList.length} destinatari unici estratti dalle tue liste</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContactsModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra di Ricerca nei Contatti */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per Nome o Email..."
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Elenco dei Contatti (Nomi + Email) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {filteredModalContacts.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs sm:text-sm">
                  Nessun contatto trovato per la ricerca "{modalSearch}"
                </div>
              ) : (
                filteredModalContacts.map((c, idx) => {
                  const displayName = c.full_name || c.name || c.azienda || (c.email ? c.email.split('@')[0] : 'Destinatario');
                  const initials = displayName.substring(0, 2).toUpperCase();

                  return (
                    <div
                      key={c.id || idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/60 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {c.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {c.azienda && (
                          <span className="hidden sm:inline-block px-2 py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-[10px] font-semibold rounded-md">
                            {c.azienda}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(c.email);
                            toast.success(`Copiato: ${c.email}`);
                          }}
                          className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500 hover:text-blue-600 transition"
                          title="Copia email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modale */}
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-gray-500">
                Mostrati {filteredModalContacts.length} di {resolvedContactsList.length} contatti
              </span>
              <button
                type="button"
                onClick={() => setShowContactsModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      <AddTagModal
        show={showAddTagModal}
        onClose={() => setShowAddTagModal(false)}
        onAdd={handleAddTag}
      />
    </div>
  );
};

export default RecipientSelect;