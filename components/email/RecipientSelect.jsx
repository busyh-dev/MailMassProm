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
    .map(item => {
      if (item === null || item === undefined) return '';
      if (typeof item === 'object') return String(item.id || item.value || item.email || '').trim();
      return String(item).replace(/['"{} \t\n\r]/g, '').trim();
    })
    .filter(Boolean);
};

const getContactTagStrings = (tags) => {
  if (!tags) return [];
  let list = [];
  if (Array.isArray(tags)) {
    list = tags;
  } else if (typeof tags === 'string') {
    let str = tags.trim();
    if (str.startsWith('{') && str.endsWith('}')) {
      str = str.slice(1, -1);
    } else if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) list = parsed;
        else str = str.slice(1, -1);
      } catch {
        str = str.slice(1, -1);
      }
    }
    if (list.length === 0 && str) {
      list = str.split(',');
    }
  } else if (typeof tags === 'object' && tags !== null) {
    list = [tags];
  }
  return list.flatMap(item => {
    if (!item) return [];
    if (typeof item === 'object') {
      return [item.id, item.value, item.label, item.name, item.tag]
        .filter(Boolean)
        .map(v => String(v).trim().toLowerCase());
    }
    return [String(item).replace(/['"{} \t\n\r]/g, '').trim().toLowerCase()].filter(Boolean);
  });
};

const RecipientSelect = ({
  value,
  onChange,
  contacts = [],
  className = '',
  onResolvedContactsChange,
}) => {
  const { tags, createTag, loading: tagsLoading } = useTags();
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [pendingTag, setPendingTag] = useState(null);
  const [internalContacts, setInternalContacts] = useState([]);
  
  // Modale elenco nomi + email contatti per tutte le liste
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Stato per modalità filtro
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'label' | 'tag' | 'tag_label'
  
  // Ref per scroll automatico alla selezione
  const containerRef = React.useRef(null);

  // ✅ Auto-scroll quando viene selezionata una lista/destinatario
  React.useEffect(() => {
    if (value && value.length > 0 && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [value]);
  const [contactLabels, setContactLabels] = useState([]);
  const [tagLabels, setTagLabels] = useState([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  // ✅ Carica etichette e liste contatti al mount filtrate per l'utente loggato
  React.useEffect(() => {
    const loadLabels = async () => {
      setLoadingLabels(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          setLoadingLabels(false);
          return;
        }

        const [
          { data: listsData },
          { data: labelsData },
          { data: tagLabelsData },
          { data: junctionData }
        ] = await Promise.all([
          supabase.from('contact_lists').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('contact_labels').select('*').eq('user_id', userId).order('nome'),
          supabase.from('tag_labels').select('*, tags(id, label, color)').order('label'),
          supabase.from('list_contacts').select('*').then(res => res.data || []).catch(() => []),
        ]);

        const combinedLists = [];
        const seenNames = new Map(); // normalizedName -> index in combinedLists

        const normalizeName = (str) => String(str || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // 1. Aggiungi le liste reali da contact_lists
        (listsData || []).forEach(l => {
          let ids = parseContactIds(l.contact_ids);
          if (junctionData && junctionData.length > 0) {
            const matches = junctionData.filter(j => String(j.list_id || j.listId || j.contact_list_id) === String(l.id));
            const jIds = matches.map(m => String(m.contact_id || m.contactId));
            ids = Array.from(new Set([...ids, ...jIds]));
          }
          const listName = l.name || l.title || l.label || l.nome || 'Lista';
          const normName = normalizeName(listName);

          const listObj = {
            id: l.id,
            nome: listName,
            contact_ids: ids,
            contact_count: l.contact_count || (ids ? ids.length : 0),
            color: l.color || '#3b82f6'
          };

          if (normName && seenNames.has(normName)) {
            const existingIdx = seenNames.get(normName);
            const existing = combinedLists[existingIdx];
            const mergedIds = Array.from(new Set([...(existing.contact_ids || []), ...ids]));
            existing.contact_ids = mergedIds;
            existing.contact_count = Math.max(existing.contact_count || 0, listObj.contact_count || 0, mergedIds.length);
          } else {
            if (normName) seenNames.set(normName, combinedLists.length);
            combinedLists.push(listObj);
          }
        });

        // 2. Unisci etichette contatti (contact_labels) evitando doppioni con lo stesso nome
        (labelsData || []).forEach(l => {
          const labelName = l.nome || l.name || l.title || 'Etichetta';
          const normName = normalizeName(labelName);
          let ids = parseContactIds(l.contact_ids);

          if (normName && seenNames.has(normName)) {
            const existingIdx = seenNames.get(normName);
            const existing = combinedLists[existingIdx];
            const mergedIds = Array.from(new Set([...(existing.contact_ids || []), ...ids]));
            existing.contact_ids = mergedIds;
            existing.contact_count = Math.max(existing.contact_count || 0, l.contact_count || 0, mergedIds.length);
          } else {
            if (normName) seenNames.set(normName, combinedLists.length);
            combinedLists.push({
              id: l.id,
              nome: labelName,
              contact_ids: ids,
              contact_count: l.contact_count || (ids ? ids.length : 0),
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
  // ✅ Carica contatti dal database se contacts prop non è ancora popolato
  React.useEffect(() => {
    if (!contacts || contacts.length === 0) {
      const fetchInternalContacts = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (!userId) return;
          const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', userId)
            .limit(50000);
          if (!error && data && data.length > 0) {
            setInternalContacts(data);
          }
        } catch (e) {
          console.error('Errore caricamento contatti in RecipientSelect:', e);
        }
      };
      fetchInternalContacts();
    }
  }, [contacts]);

  const effectiveContacts = useMemo(() => {
    if (contacts && contacts.length > 0) return contacts;
    return internalContacts;
  }, [contacts, internalContacts]);

  const activeContacts = useMemo(() => 
    effectiveContacts.filter(c => {
      if (!c || !c.email) return false;
      if (!c.status) return true;
      const s = String(c.status).trim().toLowerCase();
      return s !== 'inactive' && s !== 'disiscritto' && s !== 'bounced' && s !== 'blocked' && s !== 'unsubscribed' && s !== 'disabled';
    }), 
    [effectiveContacts]
  );

  // ✅ Opzioni basate sulla modalità filtro con conteggi esatti e senza doppioni
  const recipientOptions = useMemo(() => {
    const options = [
      {
        value: 'all',
        label: `✅ Tutti i contatti attivi (${activeContacts.length})`,
        icon: '👥',
      },
    ];

    const normalizeName = (str) => String(str || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Funzione helper per calcolare i contatti ESATTI per una lista/etichetta
    const buildLabelOption = (label) => {
      const listIds = new Set((label.contact_ids || []).map(id => String(id).toLowerCase().trim()));
      const labelIdStr = String(label.id || '').toLowerCase().trim();
      const labelNameNorm = normalizeName(label.nome);
      
      const matchedCount = activeContacts.filter(c => {
        const cId = String(c.id || '').toLowerCase().trim();
        const altId = String(c.contact_id || '').toLowerCase().trim();
        const cEmail = String(c.email || '').toLowerCase().trim();
        const cLabelId = String(c.contact_label_id || '').toLowerCase().trim();
        const cListId = String(c.list_id || '').toLowerCase().trim();

        // Match diretto per ID contatto
        if (cId && listIds.has(cId)) return true;
        if (altId && listIds.has(altId)) return true;
        if (cEmail && listIds.has(cEmail)) return true;

        // Match per ID lista/etichetta nel contatto
        if (labelIdStr && (cLabelId === labelIdStr || cListId === labelIdStr)) return true;

        // Match per array contact_labels
        if (c.contact_labels) {
          const cLabels = Array.isArray(c.contact_labels)
            ? c.contact_labels
            : typeof c.contact_labels === 'string' ? c.contact_labels.split(',') : [];
          const matches = cLabels.some(lbl => {
            const norm = normalizeName(lbl);
            return norm === labelNameNorm || String(lbl).trim().toLowerCase() === labelIdStr;
          });
          if (matches) return true;
        }

        return false;
      }).length;

      const finalCount = (matchedCount === 0 && listIds.size > 0 && activeContacts.length === 0)
        ? listIds.size
        : matchedCount;

      return {
        value: `label:${label.id}`,
        label: `📋 ${label.nome} (${finalCount})`,
        color: label.color,
        isCustomTag: true,
        type: 'label',
        count: finalCount,
      };
    };

    // Funzione helper per calcolare i contatti ESATTI per un Tag
    const buildTagOption = (tag) => {
      const targetValues = [
        String(tag.id || '').toLowerCase().trim(),
        String(tag.value || '').toLowerCase().trim(),
        String(tag.label || '').toLowerCase().trim()
      ].filter(Boolean);

      const count = activeContacts.filter(c => {
        const cTagStrings = getContactTagStrings(c.tags);
        return targetValues.some(tv => cTagStrings.includes(tv));
      }).length;

      return {
        value: `tag:${tag.value || tag.label || tag.id}`,
        label: `🏷️ ${tag.label} (${count})`,
        color: tag.color || '#10b981',
        isCustomTag: true,
        type: 'tag',
        count,
      };
    };

    // Funzione helper per sotto-etichette
    const buildTagLabelOption = (tl) => {
      const targetLabel = String(tl.label || '').toLowerCase().trim();
      const targetId = String(tl.id || '').toLowerCase().trim();

      const count = activeContacts.filter(c => {
        const cTagLabels = Array.isArray(c.tag_labels)
          ? c.tag_labels
          : typeof c.tag_labels === 'string' ? c.tag_labels.split(',') : [];
        return cTagLabels.some(l => {
          const s = String(l).trim().toLowerCase();
          return s === targetLabel || s === targetId;
        });
      }).length;

      return {
        value: `tag_label:${tl.id}`,
        label: `🔖 ${tl.label} (${count})`,
        color: tl.tags?.color || '#f59e0b',
        isCustomTag: true,
        type: 'tag_label',
        tagName: tl.tags?.label,
        count,
      };
    };

    const seenOptionKeys = new Set();
    const seenNames = new Set();

    const addOptionUnique = (opt) => {
      if (!opt || !opt.value) return;
      const key = `${opt.type || ''}:${String(opt.value).toLowerCase().trim()}`;
      if (seenOptionKeys.has(key)) return;
      seenOptionKeys.add(key);
      options.push(opt);
    };

    // 1. Liste contatti reali (esclude liste vuote/eliminate con 0 contatti)
    (contactLabels || []).forEach(l => {
      const opt = buildLabelOption(l);
      if (opt.count > 0) {
        const norm = normalizeName(l.nome);
        if (norm) seenNames.add(norm);
        addOptionUnique(opt);
      }
    });

    // 2. Tag (evita doppioni con lo stesso nome di una lista nella vista "Tutte")
    if (filterMode === 'all' || filterMode === 'tag') {
      (tags || []).forEach(t => {
        const opt = buildTagOption(t);
        if (opt.count > 0) {
          const norm = normalizeName(t.label || t.value);
          if (filterMode === 'all' && norm && seenNames.has(norm)) {
            return; // evita di duplicare la stessa voce con icona diversa
          }
          if (norm) seenNames.add(norm);
          addOptionUnique(opt);
        }
      });
    }

    // 3. Sotto-etichette
    if (filterMode === 'all' || filterMode === 'tag_label') {
      (tagLabels || []).forEach(tl => {
        const opt = buildTagLabelOption(tl);
        if (opt.count > 0) {
          const norm = normalizeName(tl.label);
          if (filterMode === 'all' && norm && seenNames.has(norm)) {
            return;
          }
          addOptionUnique(opt);
        }
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

  // ✅ Risolve i contatti reali (Nomi + Email) da tutte le liste/tag selezionate (rigoroso, senza fuzzy falso)
  const resolvedContactsList = useMemo(() => {
    if (!value || value.length === 0) return [];
    if (value.includes('all')) return activeContacts;

    const matchedMap = new Map();
    const normalizeName = (str) => String(str || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    value.forEach(val => {
      if (val.startsWith('tag:')) {
        const tagValue = val.replace('tag:', '').toLowerCase().trim();
        activeContacts.forEach(c => {
          const cTags = getContactTagStrings(c.tags);
          if (cTags.includes(tagValue)) {
            matchedMap.set(c.id || c.email, c);
          }
        });
      } else if (val.startsWith('label:') || val.startsWith('list:')) {
        const labelId = val.replace(/^(label|list):/, '');
        const targetLabel = contactLabels.find(l => 
          String(l.id) === String(labelId) || 
          normalizeName(l.nome) === normalizeName(labelId)
        );
        if (targetLabel) {
          const listIds = new Set((targetLabel.contact_ids || []).map(id => String(id).toLowerCase().trim()));
          const labelIdStr = String(targetLabel.id || '').toLowerCase().trim();
          const targetNormName = normalizeName(targetLabel.nome);

          activeContacts.forEach(c => {
            const cId = String(c.id || '').toLowerCase().trim();
            const altId = String(c.contact_id || '').toLowerCase().trim();
            const cEmail = String(c.email || '').toLowerCase().trim();
            const cLabelId = String(c.contact_label_id || '').toLowerCase().trim();
            const cListId = String(c.list_id || '').toLowerCase().trim();

            if (cId && listIds.has(cId)) {
              matchedMap.set(c.id || c.email, c);
            } else if (altId && listIds.has(altId)) {
              matchedMap.set(c.id || c.email, c);
            } else if (cEmail && listIds.has(cEmail)) {
              matchedMap.set(c.id || c.email, c);
            } else if (labelIdStr && (cLabelId === labelIdStr || cListId === labelIdStr)) {
              matchedMap.set(c.id || c.email, c);
            } else if (c.contact_labels) {
              const cLabels = Array.isArray(c.contact_labels)
                ? c.contact_labels
                : typeof c.contact_labels === 'string' ? c.contact_labels.split(',') : [];
              if (cLabels.some(l => normalizeName(l) === targetNormName || String(l).trim().toLowerCase() === labelIdStr)) {
                matchedMap.set(c.id || c.email, c);
              }
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
        const tagLabelId = val.replace('tag_label:', '').toLowerCase().trim();
        const tl = tagLabels.find(t => String(t.id).toLowerCase() === tagLabelId || normalizeName(t.label) === tagLabelId);
        if (tl) {
          const tlNorm = normalizeName(tl.label);
          activeContacts.forEach(c => {
            const cTagLabels = Array.isArray(c.tag_labels)
              ? c.tag_labels
              : typeof c.tag_labels === 'string' ? c.tag_labels.split(',') : [];
            if (cTagLabels.some(l => normalizeName(l) === tlNorm || String(l).trim().toLowerCase() === String(tl.id).toLowerCase())) {
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

  // ✅ Comunica i contatti risolti al componente padre
  React.useEffect(() => {
    if (typeof onResolvedContactsChange === 'function') {
      onResolvedContactsChange(resolvedContactsList);
    }
  }, [resolvedContactsList, onResolvedContactsChange]);

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
          onClick={() => setFilterMode('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
            filterMode === 'all' 
              ? 'bg-white text-indigo-700 shadow-sm font-bold' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🌟 Tutte
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('label')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
            filterMode === 'label' 
              ? 'bg-white text-blue-700 shadow-sm font-bold' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Filter className="w-3 h-3" />
          Liste & Etichette
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('tag')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
            filterMode === 'tag' 
              ? 'bg-white text-emerald-700 shadow-sm font-bold' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Tag className="w-3 h-3" />
          Per Tag
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('tag_label')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition cursor-pointer ${
            filterMode === 'tag_label' 
              ? 'bg-white text-amber-700 shadow-sm font-bold' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🏷️ Sotto-etichette
        </button>
      </div>

      {/* ✅ Descrizione modalità */}
      <p className="text-xs text-gray-500">
        {filterMode === 'all' && '🌟 Tutte le liste, etichette e tag disponibili con contatori contatti aggiornati'}
        {filterMode === 'label' && '📌 Seleziona i destinatari in base alle liste o etichette contatti'}
        {filterMode === 'tag' && '🏷️ Seleziona i destinatari in base ai tag standard'}
        {filterMode === 'tag_label' && '→ Seleziona i destinatari in base alle sotto-etichette dei tag'}
      </p>

      {/* Select */}
      <CreatableSelect
        isMulti
        options={recipientOptions}
        value={(() => {
          if (!Array.isArray(value)) return [];
          const valSet = new Set(value.map(v => String(v).toLowerCase().trim()));
          return recipientOptions.filter(opt => {
            const optVal = String(opt.value).toLowerCase().trim();
            if (valSet.has(optVal)) return true;
            const strippedOpt = optVal.replace(/^(label|list|tag|tag_label):/, '');
            return Array.from(valSet).some(v => {
              const strippedV = v.replace(/^(label|list|tag|tag_label):/, '');
              return strippedV === strippedOpt;
            });
          });
        })()}
        onChange={handleChange}
        onCreateOption={filterMode === 'tag' ? handleCreateTag : undefined}
        styles={customStyles}
        placeholder={
          filterMode === 'all' ? 'Cerca o seleziona una lista, etichetta o tag...' :
          filterMode === 'label' ? 'Seleziona liste o etichette destinatari...' :
          filterMode === 'tag' ? 'Seleziona tag destinatari...' :
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

      {/* Conteggio destinatari ed Elenco Dettagliato (Nomi + Email) SUBITO VISIBILE INLINE */}
      {value.length > 0 && (
        <div ref={containerRef} className="space-y-2.5 mt-3 animate-fadeIn">
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl border ${
            recipientCount > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">
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
                Espandi in Modale ({resolvedContactsList.length})
              </button>
            )}
          </div>

          {/* ⚡ LISTA NOMI & EMAIL AUTOMATICAMENTE VISIBILE SUBITO INLINE */}
          {resolvedContactsList.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/60 rounded-xl p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span>📋 Destinatari Estratti Visibili Subito ({resolvedContactsList.length})</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-normal">Nomi & Email pronti</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-700/50">
                {resolvedContactsList.map((c, idx) => {
                  const displayName = c.full_name || c.name || c.azienda || (c.email ? c.email.split('@')[0] : 'Destinatario');
                  return (
                    <div key={c.id || idx} className="pt-1.5 flex items-center justify-between text-xs hover:bg-slate-100/70 dark:hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</span>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] shrink-0 ml-2">
                        {c.email || 'Nessuna email'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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