import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { 
  List, Plus, Trash2, Edit3, Save, X, Users, 
  Filter, Calendar, ChevronDown, ChevronRight,
  Loader2, RefreshCw, CheckSquare, PlusCircle,
  UserPlus
} from 'lucide-react';

const ContactListsModal = ({ 
  show, onClose, currentFilters, filteredContacts,
  selectedContacts: externalSelectedIds,
  allContacts, onLoadList, onClearSelection,
}) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [expandedList, setExpandedList] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newList, setNewList] = useState({ name: '', description: '' });
  const [saveMode, setSaveMode] = useState('both');
  const [accumulated, setAccumulated] = useState([]);
  const [addingToListId, setAddingToListId] = useState(null);
  const [incomingContacts, setIncomingContacts] = useState([]);
  const saveFormRef = useRef(null);
    const [selectedInList, setSelectedInList] = useState({});
const [confirmRemoveFromList, setConfirmRemoveFromList] = useState(null); // { listId, count }

// Rimuovi il vecchio useEffect e sostituiscilo con questo:
const listsLoadedRef = useRef(false);

useEffect(() => {
  if (!show) return;
  loadLists();
}, []); // solo al mount

// Separato: aggiorna incomingContacts ogni volta che cambiano i selezionati esterni
useEffect(() => {
  if (!show) return;
  if (externalSelectedIds?.length > 0) {
    const selected = allContacts.filter(c => externalSelectedIds.includes(c.id));
    setIncomingContacts(selected);
  } else {
    setIncomingContacts([]);
  }
}, [externalSelectedIds, show]);

  // Scrolla al form quando appare
  useEffect(() => {
    if (showSaveForm && saveFormRef.current) {
      setTimeout(() => {
        saveFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [showSaveForm]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLists(data || []);
    } catch { toast.error('Errore caricamento liste'); }
    finally { setLoading(false); }
  };

  const handleAddCheckedToAccumulated = () => {
    if (incomingContacts.length === 0) {
      toast.error('Seleziona almeno un contatto con il checkbox');
      return;
    }
    const existingIds = accumulated.map(c => c.id);
    const newOnes = incomingContacts.filter(c => !existingIds.includes(c.id));
    setAccumulated(prev => [...prev, ...newOnes]);
    setIncomingContacts([]);
    onClearSelection?.();
    toast.success(`✅ ${newOnes.length} contatti aggiunti (${accumulated.length + newOnes.length} totali)`);
  };

  const handleAddFilteredToAccumulated = () => {
    const existingIds = accumulated.map(c => c.id);
    const newOnes = filteredContacts.filter(c => !existingIds.includes(c.id));
    setAccumulated(prev => [...prev, ...newOnes]);
    toast.success(`✅ ${newOnes.length} nuovi contatti aggiunti (${accumulated.length + newOnes.length} totali)`);
  };

  const handleRemoveFromAccumulated = (id) => {
    setAccumulated(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    if (!newList.name.trim()) { toast.error('Inserisci un nome'); return; }
    const contactsToSave = accumulated.length > 0 ? accumulated 
      : incomingContacts.length > 0 ? incomingContacts 
      : filteredContacts;
    if (contactsToSave.length === 0) { toast.error('Nessun contatto da salvare'); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        user_id: user.id,
        name: newList.name.trim(),
        description: newList.description.trim(),
        contact_count: contactsToSave.length,
      };
      if (saveMode === 'filters' || saveMode === 'both') payload.filters = currentFilters;
      if (saveMode === 'snapshot' || saveMode === 'both') {
        payload.contact_ids = contactsToSave.map(c => c.id);
      }

      const { error } = await supabase.from('contact_lists').insert(payload);
      if (error) throw error;

      toast.success(`✅ Lista "${newList.name}" salvata con ${contactsToSave.length} contatti`);
      setNewList({ name: '', description: '' });
      setShowSaveForm(false);
      setAccumulated([]);
      setIncomingContacts([]);
      onClearSelection?.();
      loadLists();
    } catch { toast.error('Errore salvataggio'); }
    finally { setSaving(false); }
  };

  // Funzione unificata per aggiungere a lista esistente
  const addToList = async (list, contacts, label) => {
    const existing = list.contact_ids || [];
    const newIds = contacts.map(c => c.id).filter(id => !existing.includes(id));
    if (newIds.length === 0) {
      toast('ℹ️ Tutti i contatti sono già in questa lista');
      return;
    }
    const merged = [...existing, ...newIds];
    const { error } = await supabase.from('contact_lists')
      .update({ contact_ids: merged, contact_count: merged.length, updated_at: new Date().toISOString() })
      .eq('id', list.id);
    if (error) { toast.error('Errore aggiornamento'); return; }
    toast.success(`✅ ${newIds.length} ${label} aggiunti a "${list.name}"`);
    setIncomingContacts([]);
    setAccumulated([]);
    onClearSelection?.();
    setAddingToListId(null);
    loadLists();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Eliminare la lista "${name}"?`)) return;
    try {
      await supabase.from('contact_lists').delete().eq('id', id);
      toast.success('Lista eliminata');
      loadLists();
    } catch { toast.error('Errore eliminazione'); }
  };

  const handleRename = async (id) => {
    if (!editingName.trim()) return;
    try {
      await supabase.from('contact_lists')
        .update({ name: editingName.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);
      setEditingId(null);
      loadLists();
    } catch { toast.error('Errore aggiornamento'); }
  };

  const handleUpdateSnapshot = async (list) => {
    const toUpdate = accumulated.length > 0 ? accumulated : filteredContacts;
    try {
      await supabase.from('contact_lists').update({ 
        contact_ids: toUpdate.map(c => c.id),
        contact_count: toUpdate.length,
        updated_at: new Date().toISOString()
      }).eq('id', list.id);
      toast.success(`Snapshot aggiornato: ${toUpdate.length} contatti`);
      loadLists();
    } catch { toast.error('Errore aggiornamento snapshot'); }
  };

  const resolveContacts = (list) => {
    if (!list.contact_ids?.length) return [];
    return allContacts.filter(c => list.contact_ids.includes(c.id));
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

  const getFilterSummary = (filters) => {
    if (!filters || Object.keys(filters).length === 0) return 'Nessun filtro';
    const parts = [];
    if (filters.searchTerm) parts.push(`"${filters.searchTerm}"`);
    if (filters.statusFilter?.value !== 'all') parts.push(filters.statusFilter?.label);
    if (filters.filterSectors?.length) parts.push(`${filters.filterSectors.length} settori`);
    if (filters.filterChannels?.length) parts.push(`${filters.filterChannels.length} canali`);
    if (filters.filterContactLabels?.length) parts.push(`${filters.filterContactLabels.length} etichette`);
    if (filters.selectedTags?.length) parts.push(`${filters.selectedTags.length} tag`);
    return parts.length > 0 ? parts.join(' • ') : 'Filtri salvati';
  };



  const hasAnything = incomingContacts.length > 0 || accumulated.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header - fisso */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <List className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Liste Contatti</h2>
                <p className="text-blue-100 text-xs">Crea liste da selezioni multiple</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tutto il contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto">

          {/* Area selezione e accumulo */}
          <div className="p-4 border-b border-gray-200 space-y-3 bg-slate-50">
            
            {/* Card selezionati e filtrati */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Selezionati</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{incomingContacts.length}</span>
                </div>
                <button
                  onClick={handleAddCheckedToAccumulated}
                  disabled={incomingContacts.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Accumula per dopo
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Filtrati</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{filteredContacts.length}</span>
                </div>
                <button
                  onClick={handleAddFilteredToAccumulated}
                  disabled={filteredContacts.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Accumula tutti
                </button>
              </div>
            </div>

            {/* Aggiungi rapido a lista esistente - appare se ci sono selezionati o accumulati */}
            {hasAnything && lists.length > 0 && (
              <div className="bg-white rounded-xl border border-green-200 p-3">
                <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-green-600" />
                  Aggiungi {accumulated.length > 0
                    ? `lista temporanea (${accumulated.length})`
                    : `selezionati (${incomingContacts.length})`
                  } a lista esistente:
                </p>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {lists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => {
                        const toAdd = accumulated.length > 0 ? accumulated : incomingContacts;
                        addToList(list, toAdd, accumulated.length > 0 ? 'contatti temporanei' : 'contatti selezionati');
                      }}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-green-50 hover:border-green-300 border border-gray-200 rounded-lg text-xs transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                          <List className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-800 truncate">{list.name}</span>
                        <span className="text-gray-400 shrink-0">({list.contact_count})</span>
                      </div>
                      <span className="text-green-600 font-semibold shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition">
                        + Aggiungi
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Accumulatore */}
            {accumulated.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-green-700" />
                    <span className="text-sm font-semibold text-green-800">
                      Lista temporanea: {accumulated.length} contatti
                    </span>
                  </div>
                  <button
                    onClick={() => setAccumulated([])}
                    className="text-xs text-green-600 hover:text-red-600 transition"
                  >
                    Svuota
                  </button>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {accumulated.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-white rounded-lg px-2 py-1 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-[10px] shrink-0">
                          {c.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium truncate">{c.name}</span>
                        <span className="text-gray-400 truncate hidden sm:block">{c.email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromAccumulated(c.id)}
                        className="text-gray-300 hover:text-red-500 transition shrink-0 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottone salva — SEMPRE VISIBILE */}
            {!showSaveForm && (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
              >
                <Save className="w-4 h-4" />
                {accumulated.length > 0 
                  ? `Salva lista temporanea (${accumulated.length} contatti)`
                  : incomingContacts.length > 0
                  ? `Salva selezionati (${incomingContacts.length} contatti)`
                  : `Salva filtri attuali (${filteredContacts.length} contatti)`
                }
              </button>
            )}

            {/* Form salvataggio */}
            {showSaveForm && (
              <div
                ref={saveFormRef}
                className="bg-white rounded-xl border border-blue-300 p-4 space-y-3 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Save className="w-4 h-4 text-blue-600" />
                  Salva nuova lista &mdash; {
                    accumulated.length > 0 ? accumulated.length 
                    : incomingContacts.length > 0 ? incomingContacts.length
                    : filteredContacts.length
                  } contatti
                </h3>
                <input
                  type="text"
                  placeholder="Nome lista *"
                  value={newList.name}
                  onChange={e => setNewList(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
                <input
                  type="text"
                  placeholder="Descrizione (opzionale)"
                  value={newList.description}
                  onChange={e => setNewList(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'filters', label: 'Solo filtri', desc: 'Ricalcola sempre' },
                    { value: 'snapshot', label: 'Solo snapshot', desc: 'Copia fissa' },
                    { value: 'both', label: 'Entrambi', desc: 'Consigliato' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setSaveMode(opt.value)}
                      className={`p-2 rounded-lg border text-left text-xs transition ${
                        saveMode === opt.value 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-gray-400">{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowSaveForm(false); setNewList({ name: '', description: '' }); }}
                    className="flex-1 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !newList.name.trim()}
                    className="flex-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Salvataggio...' : 'Salva lista'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Liste salvate */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Liste salvate ({lists.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <List className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nessuna lista salvata</p>
              </div>
            ) : (
              lists.map(list => {
                const resolvedContacts = resolveContacts(list);
                const isExpanded = expandedList === list.id;
                const isAddingTo = addingToListId === list.id;
                const hasFilters = list.filters && Object.keys(list.filters).length > 0;
                const hasSnapshot = list.contact_ids?.length > 0;

                return (
                  <div key={list.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {editingId === list.id ? (
                            <div className="flex gap-2">
                              <input
                                value={editingName}
                                onChange={e => setEditingName(e.target.value)}
                                className="flex-1 px-2 py-1 border border-blue-400 rounded-lg text-sm focus:outline-none"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRename(list.id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                              />
                              <button onClick={() => handleRename(list.id)} className="p-1 text-green-600">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-gray-400">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <h3 className="font-semibold text-gray-900 truncate">{list.name}</h3>
                          )}
                          {list.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{list.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="w-3 h-3" />{list.contact_count}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="w-3 h-3" />{formatDate(list.created_at)}
                            </span>
                            {hasFilters && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">filtri</span>
                            )}
                            {hasSnapshot && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">snapshot</span>
                            )}
                          </div>
                          {hasFilters && (
                            <div className="mt-1.5 p-1.5 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-700">{getFilterSummary(list.filters)}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setAddingToListId(isAddingTo ? null : list.id)}
                            title="Aggiungi contatti"
                            className={`p-1.5 rounded-lg transition ${
                              isAddingTo 
                                ? 'bg-green-100 text-green-700' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          {hasFilters && (
                            <button
                              onClick={() => { onLoadList(list); onClose(); }}
                              title="Applica filtri"
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Filter className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateSnapshot(list)}
                            title="Aggiorna snapshot"
                            className="p-1.5 text-purple-400 hover:bg-purple-50 rounded-lg transition"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingId(list.id); setEditingName(list.name); }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExpandedList(isExpanded ? null : list.id)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(list.id, list.name)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Pannello aggiungi contatti a lista esistente */}
                      {isAddingTo && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl space-y-2">
                          <p className="text-xs font-medium text-green-800">
                            Aggiungi contatti a "{list.name}":
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className={`p-2 rounded-lg border text-center ${accumulated.length > 0 ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200 opacity-40'}`}>
                              <div className="font-bold text-green-700">{accumulated.length}</div>
                              <div className="text-gray-500">temporanea</div>
                            </div>
                            <div className={`p-2 rounded-lg border text-center ${incomingContacts.length > 0 ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200 opacity-40'}`}>
                              <div className="font-bold text-blue-700">{incomingContacts.length}</div>
                              <div className="text-gray-500">selezionati</div>
                            </div>
                            <div className={`p-2 rounded-lg border text-center ${filteredContacts.length > 0 ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-200 opacity-40'}`}>
                              <div className="font-bold text-purple-700">{filteredContacts.length}</div>
                              <div className="text-gray-500">filtrati</div>
                            </div>
                          </div>
                          {accumulated.length === 0 && incomingContacts.length === 0 && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                              ⚠️ Chiudi, seleziona contatti con il checkbox, poi riapri le liste
                            </p>
                          )}
                          <div className="flex flex-col gap-2">
                            {accumulated.length > 0 && (
                              <button
                                onClick={() => addToList(list, accumulated, 'contatti temporanei')}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Aggiungi lista temporanea ({accumulated.length})
                              </button>
                            )}
                            {incomingContacts.length > 0 && (
                              <button
                                onClick={() => addToList(list, incomingContacts, 'contatti selezionati')}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Aggiungi selezionati ({incomingContacts.length})
                              </button>
                            )}
                            {filteredContacts.length > 0 && (
                              <button
                                onClick={() => addToList(list, filteredContacts, 'contatti filtrati')}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Aggiungi tutti i filtrati ({filteredContacts.length})
                              </button>
                            )}
                            <button
                              onClick={() => setAddingToListId(null)}
                              className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs transition"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contatti espansi */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-3 max-h-48 overflow-y-auto">
                        {resolvedContacts.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-2">Nessun contatto</p>
                        ) : (
                          <div className="space-y-1">
                            {resolvedContacts.slice(0, 30).map(c => (
  <div key={c.id} className="flex items-center gap-2 text-xs text-gray-700 py-1 px-2 bg-white rounded-lg hover:bg-red-50 group">
    <input
      type="checkbox"
      checked={selectedInList[list.id]?.includes(c.id) || false}
      onChange={(e) => {
        setSelectedInList(prev => {
          const current = prev[list.id] || [];
          return {
            ...prev,
            [list.id]: e.target.checked
              ? [...current, c.id]
              : current.filter(id => id !== c.id)
          };
        });
      }}
      className="rounded border-gray-300 text-red-600 shrink-0"
    />
    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px] shrink-0">
      {c.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
    <span className="font-medium truncate">{c.name}</span>
    <span className="text-gray-400 truncate">{c.email}</span>
  </div>
))}

{/* Barra azioni selezione nella lista */}
{(selectedInList[list.id]?.length || 0) > 0 && (
  <div className="mt-2 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
    <span className="text-xs font-medium text-red-800">
      {selectedInList[list.id].length} selezionati
    </span>
    <div className="flex gap-2">
      <button
        onClick={() => setSelectedInList(prev => ({ ...prev, [list.id]: [] }))}
        className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 bg-white rounded border border-gray-200 transition"
      >
        Deseleziona
      </button>
      <button
  onClick={() => setConfirmRemoveFromList({ 
    list, 
    count: selectedInList[list.id].length 
  })}
  className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition flex items-center gap-1"
>
  <Trash2 className="w-3 h-3" />
  Rimuovi dalla lista
</button>
    </div>
  </div>
)}
                            {resolvedContacts.length > 30 && (
                              <p className="text-xs text-gray-400 text-center pt-1">
                                +{resolvedContacts.length - 30} altri
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {confirmRemoveFromList && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Rimuovi dalla lista</h3>
          <p className="text-sm text-gray-500">Questa azione è irreversibile</p>
        </div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
        <p className="text-sm text-red-800">
          Stai per rimuovere <strong>{confirmRemoveFromList.count} contatti</strong> dalla lista <strong>"{confirmRemoveFromList.list.name}"</strong>.
        </p>
        <p className="text-xs text-red-600 mt-1">
        I contatti verranno rimossi dalla lista salvata nel database.
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setConfirmRemoveFromList(null)}
          className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
        >
          Annulla
        </button>
        <button
          onClick={async () => {
            const { list, count } = confirmRemoveFromList;
            const toRemove = selectedInList[list.id];
            const newIds = (list.contact_ids || []).filter(id => !toRemove.includes(id));
            const { error } = await supabase
              .from('contact_lists')
              .update({
                contact_ids: newIds,
                contact_count: newIds.length,
                updated_at: new Date().toISOString()
              })
              .eq('id', list.id);
            if (error) { toast.error('Errore rimozione'); return; }
            toast.success(`✅ ${count} contatti rimossi da "${confirmRemoveFromList.list.name}"`);
            setSelectedInList(prev => ({ ...prev, [list.id]: [] }));
            setConfirmRemoveFromList(null);
            loadLists();
          }}
          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Sì, rimuovi
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default ContactListsModal;

