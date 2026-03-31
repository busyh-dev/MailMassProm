// src/components/email/RecipientSelect.jsx
import React, { useState, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { Plus, Users, Tag, Filter } from 'lucide-react';
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

const RecipientSelect = ({
  value,
  onChange,
  contacts = [],
  className = '',
}) => {
  const { tags, createTag, loading: tagsLoading } = useTags();
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [pendingTag, setPendingTag] = useState(null);
  
  // ✅ NUOVO: stato per modalità filtro
  const [filterMode, setFilterMode] = useState('tag'); // 'tag' | 'label' | 'tag_label'
  
  // ✅ NUOVO: stato per etichette contatto e sotto-etichette
  const [contactLabels, setContactLabels] = useState([]);
  const [tagLabels, setTagLabels] = useState([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  // ✅ Carica etichette e sotto-etichette al mount
  React.useEffect(() => {
    const loadLabels = async () => {
      setLoadingLabels(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: labelsData }, { data: tagLabelsData }] = await Promise.all([
          supabase.from('contact_labels').select('*').eq('user_id', user.id).order('nome'),
          supabase.from('tag_labels').select('*, tags(id, label, color)').eq('user_id', user.id).order('label'),
        ]);

        setContactLabels(labelsData || []);
        setTagLabels(tagLabelsData || []);
      } catch (err) {
        console.error('Errore caricamento etichette:', err);
      } finally {
        setLoadingLabels(false);
      }
    };
    loadLabels();
  }, []);

  const activeContacts = useMemo(() => 
    contacts.filter(c => c.status === 'active'), 
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
      // Filtro per ETICHETTA CONTATTO
      contactLabels.forEach(label => {
        const count = activeContacts.filter(
          c => c.contact_label_id === label.id
        ).length;
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

  // ✅ Calcola conteggio destinatari effettivi
  const recipientCount = useMemo(() => {
    if (value.includes('all')) return activeContacts.length;
    
    const emailSet = new Set();
    value.forEach(val => {
      if (val.startsWith('tag:')) {
        const tagValue = val.replace('tag:', '');
        activeContacts.filter(c => 
          c.tags && (c.tags.includes(tagValue) || c.tags.some(t => t === tagValue))
        ).forEach(c => emailSet.add(c.email));
      } else if (val.startsWith('label:')) {
        const labelId = val.replace('label:', '');
        activeContacts.filter(c => c.contact_label_id === labelId)
          .forEach(c => emailSet.add(c.email));
      } else if (val.startsWith('tag_label:')) {
        const tagLabelId = val.replace('tag_label:', '');
        const tl = tagLabels.find(t => t.id === tagLabelId);
        if (tl) {
          activeContacts.filter(c => 
            c.tag_labels && c.tag_labels.includes(tl.label)
          ).forEach(c => emailSet.add(c.email));
        }
      }
    });
    return emailSet.size;
  }, [value, activeContacts, tagLabels]);

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

      {/* ✅ Conteggio destinatari effettivi */}
      {value.length > 0 && (
        <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
          recipientCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
        }`}>
          <Users className="w-4 h-4" />
          <span>
            {value.includes('all') 
              ? `${recipientCount} contatti attivi selezionati`
              : `${recipientCount} destinatari unici`
            }
          </span>
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