// src/components/settings/TagsSettings.jsx
import React, { useState } from 'react';
import { Tag, Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import { useTags } from '../../hooks/useTags';
import AddTagModal from '../modals/AddTagModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const TagsSettings = () => {
  const { tags, createTag, updateTag, deleteTag, loading } = useTags();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');

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

  const handleAddTag = async (tagData) => {
    const result = await createTag(tagData);
    if (result.success) {
      toast.success('✅ Tag creato con successo');
      setShowAddModal(false);
    } else {
      toast.error('❌ ' + result.error);
    }
    return result;
  };

  const handleStartEdit = (tag) => {
    setEditingTag(tag.id);
    setEditLabel(tag.label);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async (tagId) => {
    const result = await updateTag(tagId, {
      label: editLabel,
      color: editColor,
    });

    if (result.success) {
      toast.success('✅ Tag aggiornato');
      setEditingTag(null);
    } else {
      toast.error('❌ ' + result.error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditLabel('');
    setEditColor('');
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Sei sicuro di voler eliminare questo tag?')) return;

    const result = await deleteTag(tagId);
    if (result.success) {
      toast.success('🗑️ Tag eliminato');
    } else {
      toast.error('❌ ' + result.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Tag</h2>
          <p className="text-gray-600 mt-1">
            Crea e gestisci i tag per organizzare i tuoi contatti
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nuovo Tag
        </button>
      </div>

      {/* Lista Tag */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-3">Caricamento tag...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nessun tag creato</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Crea il tuo primo tag
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {tags.map((tag) => (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 hover:bg-gray-50 transition"
                >
                  {editingTag === tag.id ? (
                    // Modalità modifica
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div className="flex gap-2">
                        {colorOptions.map((colorOption) => (
                          <button
                            key={colorOption.value}
                            onClick={() => setEditColor(colorOption.value)}
                            className={`w-8 h-8 rounded-full transition ${
                              editColor === colorOption.value
                                ? 'ring-2 ring-offset-2 ring-blue-500'
                                : ''
                            }`}
                            style={{ backgroundColor: colorOption.value }}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => handleSaveEdit(tag.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    // Visualizzazione normale
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${tag.color}20` }}
                        >
                          <Tag
                            className="w-5 h-5"
                            style={{ color: tag.color }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {tag.label}
                            </span>
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.value}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Creato il{' '}
                            {new Date(tag.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(tag)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal Aggiungi Tag */}
      <AddTagModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTag}
      />
    </div>
  );
};

export default TagsSettings;