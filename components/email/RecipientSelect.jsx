// src/components/email/RecipientSelect.jsx
import React, { useState, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { Plus, Users } from 'lucide-react';
import { useTags } from '../../hooks/useTags';
import AddTagModal from '../../components/modals/AddTagModal';

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
  const [pendingTag, setPendingTag] = useState(null); // tag in creazione

  // Crea le opzioni per il select
  const recipientOptions = useMemo(() => {
    const activeContacts = contacts.filter((c) => c.status === 'active');
    const options = [
      {
        value: 'all',
        label: `✅ Tutti i contatti attivi (${activeContacts.length})`,
        icon: '👥',
      },
    ];

    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        const contactsWithTag = activeContacts.filter(
          (c) => c.tags && c.tags.includes(tag.value)
        );
        options.push({
          value: tag.value,
          label: `${tag.label} (${contactsWithTag.length})`,
          color: tag.color,
          isCustomTag: true,
        });
      });
    }

    return options;
  }, [tags, contacts]);

  // Custom style per react-select
  const customStyles = {
    option: (provided, state) => {
      const option = recipientOptions.find(
        (opt) => opt.value === state.data.value
      );
      return {
        ...provided,
        backgroundColor: state.isSelected
          ? option?.color || '#3b82f6'
          : state.isFocused
          ? option?.color
            ? `${option.color}20`
            : '#eff6ff'
          : 'white',
        color: state.isSelected ? 'white' : '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      };
    },
    multiValue: (provided, state) => {
      const option = recipientOptions.find(
        (opt) => opt.value === state.data.value
      );
      return {
        ...provided,
        backgroundColor: option?.color ? `${option.color}20` : '#dbeafe',
        borderRadius: '6px',
      };
    },
    multiValueLabel: (provided, state) => {
      const option = recipientOptions.find(
        (opt) => opt.value === state.data.value
      );
      return {
        ...provided,
        color: option?.color || '#1e40af',
        fontWeight: '500',
      };
    },
    multiValueRemove: (provided, state) => {
      const option = recipientOptions.find(
        (opt) => opt.value === state.data.value
      );
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

  // Gestisce il cambio di selezione
  const handleChange = (selectedOptions) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((o) => o.value)
      : [];

    if (selectedValues.includes('all')) {
      onChange(['all']);
    } else {
      onChange(selectedValues);
    }
  };

  // Avvia creazione tag con selezione colore
  const handleCreateTag = async (inputValue) => {
    const label = inputValue.trim();
    if (!label) return;
    setPendingTag(label);
  };

  // Quando l'utente sceglie un colore per il nuovo tag
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
      onChange([...value, newTagData.value]);
      setPendingTag(null);
    } else {
      toast.error(`❌ Errore: ${result.error}`);
    }
  };

  // Gestione modale classica (opzionale)
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

  return (
    <div className="space-y-2 relative">
      {/* Etichetta e bottone */}
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

      {/* Select con creazione diretta */}
      <CreatableSelect
        isMulti
        options={recipientOptions}
        value={recipientOptions.filter((opt) => value.includes(opt.value))}
        onChange={handleChange}
        onCreateOption={handleCreateTag}
        styles={customStyles}
        placeholder="Seleziona o crea un tag..."
        noOptionsMessage={() => 'Nessun tag disponibile'}
        isLoading={tagsLoading}
        formatCreateLabel={(inputValue) =>
          `➕ Crea nuovo tag “${inputValue}”`
        }
        formatOptionLabel={(option) => (
          <div className="flex items-center gap-2">
            {option.icon && <span>{option.icon}</span>}
            {option.isCustomTag && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: option.color }}
              />
            )}
            <span>{option.label}</span>
          </div>
        )}
        className={className}
      />

      {/* Se l'utente sta creando un nuovo tag → mostra palette colori */}
      {pendingTag && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-fit">
          <p className="text-sm text-gray-700 mb-2">
            Seleziona un colore per <strong>{pendingTag}</strong>:
          </p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((c) => (
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

      {/* Conteggio selezionati */}
      {value.length > 0 && !value.includes('all') && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <Users className="w-4 h-4" />
          <span>
            {value.length === 1
              ? '1 gruppo selezionato'
              : `${value.length} gruppi selezionati`}
          </span>
        </div>
      )}

      {/* Modal classica opzionale */}
      <AddTagModal
        show={showAddTagModal}
        onClose={() => setShowAddTagModal(false)}
        onAdd={handleAddTag}
      />
    </div>
  );
};

export default RecipientSelect;
