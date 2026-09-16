import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  Send, User, Search, MessageCircle, Clock, Trash2, 
  Download, X, CheckCircle, AlertCircle, XCircle, Filter, 
  ShieldCheck, ChevronDown, PlusCircle, Tag, RefreshCw, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ChatInterface = ({ initialUserId = null, isAdmin = false, onClose }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(initialUserId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef({});
  const typingChannelRef = useRef(null);
  const statusChannelRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  // Stati per Amministratori e Ticket
  const [adminsList, setAdminsList] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('ALL'); // 'ALL' o ID admin specifico
  const [ticketStatuses, setTicketStatuses] = useState({}); // { [userId]: 'non_completato' | 'completato' | 'annullato' }
  const [statusFilter, setStatusFilter] = useState('ALL'); // Filtro admin: 'ALL', 'non_completato', 'completato', 'annullato'
  
  // Modale di conferma eliminazione chat (al posto di window.confirm native)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 1. Caricamento Amministratori (Per la Select Utente)
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, name, role:roles(name)');

        if (!error && data) {
          const admins = data.filter(u => {
            const roleName = u.role?.name || u.role || '';
            return ['super_admin', 'superAdmin', 'SuperAdmin', 'admin', 'Admin'].includes(roleName) || u.role_id === 1;
          });
          setAdminsList(admins);
        }
      } catch (err) {
        console.error('Errore nel caricamento amministratori:', err);
      }
    };
    fetchAdmins();
  }, []);

  // 2. Canale Broadcast per gli aggiornamenti dello Stato del Ticket in tempo reale
  useEffect(() => {
    if (!user) return;

    const statusChannel = supabase.channel('ticket_status_updates');
    statusChannelRef.current = statusChannel;

    statusChannel
      .on('broadcast', { event: 'status_update' }, payload => {
        const { targetUserId, newStatus, updatedBy } = payload.payload;
        setTicketStatuses(prev => ({
          ...prev,
          [targetUserId]: newStatus
        }));
        
        // Salva anche in localStorage per persistenza locale
        try {
          localStorage.setItem(`ticket_status_${targetUserId}`, newStatus);
        } catch (e) {}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [user]);

  // 3. Gestione Typing Status (Broadcast)
  useEffect(() => {
    if (!user) return;

    const typingChannel = supabase.channel('chat_typing_status');
    typingChannelRef.current = typingChannel;

    typingChannel
      .on('broadcast', { event: 'typing' }, payload => {
        const { userId, isTyping } = payload.payload;
        if (userId === user.id) return;

        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });

        if (isTyping) {
          if (typingTimeoutRef.current[userId]) {
            clearTimeout(typingTimeoutRef.current[userId]);
          }
          typingTimeoutRef.current[userId] = setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [user]);

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 1000) {
      lastTypingTimeRef.current = now;
      if (typingChannelRef.current) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user?.id, isTyping: true }
        });
      }
    }
  };

  // 4. Gestione messaggi non letti per l'admin
  useEffect(() => {
    if (!isAdmin || !user) return;
    
    const fetchUnreadCounts = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('read', false);
        
      if (!error && data) {
        const counts = {};
        data.forEach(msg => {
          counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }
    };
    
    fetchUnreadCounts();
  }, [user, isAdmin]);

  // Segna come letti quando si apre la conversazione
  useEffect(() => {
    if (isAdmin && selectedUser && user) {
      const markAsRead = async () => {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', selectedUser)
          .eq('receiver_id', user.id)
          .eq('read', false);
          
        if (!error) {
          setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[selectedUser];
            return newCounts;
          });
        }
      };
      markAsRead();
    }
  }, [selectedUser, isAdmin, user, messages.length]);

  // 5. Gestione Presence
  useEffect(() => {
    if (!user) return;
    
    const presenceChannel = supabase.channel('chat_presence', {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set(Object.keys(state));
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  // 6. Per gli admin: Carica la lista degli utenti con conversazioni
  useEffect(() => {
    if (!isAdmin) return;

    const fetchConversations = async () => {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, name, role:roles(name)');
      
      if (!error && users) {
        const clients = users.filter(u => {
          const roleName = u.role?.name || u.role || '';
          return !['super_admin', 'superAdmin', 'SuperAdmin', 'admin', 'Admin'].includes(roleName);
        });
        setConversations(clients);
      }
    };
    
    fetchConversations();
  }, [isAdmin]);

  // 7. Carica i messaggi per la conversazione selezionata
  useEffect(() => {
    if (!user) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
      
      if (isAdmin) {
        if (!selectedUser) {
          setMessages([]);
          setLoading(false);
          return;
        }
        query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user.id})`);
      } else {
        query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      }
      
      const { data, error } = await query;
      if (!error && data) {
        setMessages(data || []);

        // Cerca lo stato del ticket nei messaggi di sistema o in localStorage
        const activeUserId = isAdmin ? selectedUser : user.id;
        const savedStatus = localStorage.getItem(`ticket_status_${activeUserId}`);
        if (savedStatus) {
          setTicketStatuses(prev => ({ ...prev, [activeUserId]: savedStatus }));
        } else {
          // Default status: non_completato
          setTicketStatuses(prev => ({ ...prev, [activeUserId]: prev[activeUserId] || 'non_completato' }));
        }
      }
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Iscrizione al canale realtime
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMessage = payload.new;
        if (isAdmin) {
          if (newMessage.sender_id === selectedUser || newMessage.receiver_id === selectedUser) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          } else if (newMessage.receiver_id === user.id) {
            setUnreadCounts(prev => ({ ...prev, [newMessage.sender_id]: (prev[newMessage.sender_id] || 0) + 1 }));
          }
        } else {
          if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser, isAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 8. Esportazione Chat professionale con Toast
  const handleExportChat = () => {
    if (!messages.length) {
      toast.error('Nessun messaggio da esportare nella conversazione.');
      return;
    }
    
    let text = "=== CRONOLOGIA CHAT SUPPORTO ===\n\n";
    messages.forEach(m => {
      const isMe = m.sender_id === user?.id;
      const date = new Date(m.created_at).toLocaleString('it-IT');
      const senderName = isMe ? "Io" : (isAdmin ? "Cliente" : "Supporto");
      text += `[${date}] ${senderName}:\n${m.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supporto_Chat_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('📥 Cronologia chat esportata con successo!');
  };

  // 9. Eliminazione Chat (Sostituita finestra native window.confirm con Popup Tailwind)
  const confirmDeleteChat = async () => {
    if (!messages.length) return;
    setDeleting(true);

    try {
      const messageIds = messages.map(m => m.id);
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', messageIds);

      if (!error) {
        setMessages([]);
        toast.success('🗑️ Conversazione eliminata con successo!');
      } else {
        toast.error('Errore durante l\'eliminazione della chat.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Impossibile eliminare la chat.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 10. Modifica Stato del Ticket ('non_completato', 'completato', 'annullato')
  const handleChangeTicketStatus = async (newStatus) => {
    const activeUserId = isAdmin ? selectedUser : user.id;
    if (!activeUserId) return;

    setTicketStatuses(prev => ({
      ...prev,
      [activeUserId]: newStatus
    }));

    try {
      localStorage.setItem(`ticket_status_${activeUserId}`, newStatus);
    } catch (e) {}

    // Notifica broadcast a tutti i client aperti
    if (statusChannelRef.current) {
      statusChannelRef.current.send({
        type: 'broadcast',
        event: 'status_update',
        payload: {
          targetUserId: activeUserId,
          newStatus,
          updatedBy: user.id
        }
      });
    }

    // Messaggio automatico di sistema nella chat
    const statusLabels = {
      non_completato: '🟠 In corso / Non completato',
      completato: '🟢 Completato',
      annullato: '🔴 Annullato'
    };

    const label = statusLabels[newStatus] || newStatus;
    toast.success(`Stato del ticket aggiornato: ${label}`);

    // Inserisci messaggio informativo in chat
    const sysMsg = {
      sender_id: user.id,
      receiver_id: isAdmin ? selectedUser : (adminsList[0]?.id || user.id),
      content: `📌 Stato del ticket modificato in: ${label}`,
      read: false
    };

    try {
      await supabase.from('messages').insert([sysMsg]);
    } catch (err) {
      console.warn('Errore inserimento log stato:', err);
    }
  };

  // 11. Invio Messaggio
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, isTyping: false }
      });
    }

    let targetReceiver = null;
    if (isAdmin) {
      targetReceiver = selectedUser;
    } else {
      // Se l'utente ha scelto un admin specifico dalla select:
      if (selectedAdminId && selectedAdminId !== 'ALL') {
        targetReceiver = selectedAdminId;
      } else {
        // Se c'è già una conversazione attiva, prendi l'admin che ha risposto
        const lastAdminMsg = messages.slice().reverse().find(m => m.sender_id !== user.id);
        targetReceiver = lastAdminMsg?.sender_id; 

        if (!targetReceiver) {
          // Fallback sul primo admin disponibile nella lista
          targetReceiver = adminsList[0]?.id;
        }
      }
    }

    if (!targetReceiver) {
      toast.error('Nessun amministratore selezionato o disponibile a ricevere il messaggio.');
      return;
    }

    const msg = {
      sender_id: user.id,
      receiver_id: targetReceiver,
      content: newMessage.trim(),
      read: false
    };

    // Optimistic UI
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(), created_at: new Date().toISOString() }]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert([msg]);
    if (error) {
      console.error("Errore invio messaggio:", error);
      toast.error("Errore nell'invio del messaggio");
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper badge stato
  const getStatusBadge = (statusKey) => {
    switch (statusKey) {
      case 'completato':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Completato
          </span>
        );
      case 'annullato':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
            <XCircle className="w-3 h-3 text-rose-600" />
            Annullato
          </span>
        );
      case 'non_completato':
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600" />
            Non completato
          </span>
        );
    }
  };

  // Filtro conversazioni per l'admin
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      (c.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
      (c.email || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    const cStatus = ticketStatuses[c.id] || 'non_completato';
    return cStatus === statusFilter;
  });

  const activeUserId = isAdmin ? selectedUser : user?.id;
  const currentTicketStatus = ticketStatuses[activeUserId] || 'non_completato';

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden relative">
      
      {/* SIDEBAR (Solo Admin) */}
      {isAdmin && (
        <div className="w-80 border-r border-gray-200 dark:border-slate-800 flex flex-col bg-gray-50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-500" />
                Ticket & Chat
              </span>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {filteredConversations.length}
              </span>
            </h2>

            {/* Cerca utente */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca utente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtro Stato Ticket */}
            <div className="flex items-center gap-1 bg-gray-200/60 dark:bg-slate-800 p-1 rounded-lg text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1 rounded text-center transition ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 font-bold text-indigo-600 shadow-2xs' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Tutti
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('non_completato')}
                className={`flex-1 py-1 rounded text-center transition ${statusFilter === 'non_completato' ? 'bg-amber-500 text-white font-bold shadow-2xs' : 'text-gray-600 dark:text-gray-400'}`}
              >
                In corso
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completato')}
                className={`flex-1 py-1 rounded text-center transition ${statusFilter === 'completato' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Chiusi
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 italic">
                Nessun ticket trovato con questo filtro
              </div>
            ) : (
              filteredConversations.map(c => {
                const status = ticketStatuses[c.id] || 'non_completato';
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedUser(c.id)}
                    className={`w-full p-3.5 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors ${selectedUser === c.id ? 'bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500 shadow-2xs' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                      {(c.full_name || c.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="flex items-center gap-1.5 truncate font-semibold text-xs text-gray-900 dark:text-gray-100">
                          {c.full_name || 'Utente'}
                          {onlineUsers.has(c.id) && <span className="w-2 h-2 rounded-full bg-green-500" title="Online"></span>}
                        </span>
                        {unreadCounts[c.id] > 0 && (
                          <span className="min-w-[1.1rem] h-4 px-1 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white shadow-2xs">
                            {unreadCounts[c.id]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-400 truncate max-w-[110px]">{c.email}</p>
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {(!isAdmin || selectedUser) ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs z-10">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    {isAdmin ? 'Utente Selezionato' : 'Assistenza Tecnica Supporto'}
                  </h3>
                  
                  {/* Per utente standard: Select Amministratore */}
                  {!isAdmin && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs text-gray-500 font-medium">Invia a:</span>
                      <select
                        value={selectedAdminId}
                        onChange={(e) => setSelectedAdminId(e.target.value)}
                        className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-0.5 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="ALL">📢 Tutti gli Amministratori</option>
                        {adminsList.map(a => (
                          <option key={a.id} value={a.id}>
                            👤 {a.full_name || a.name || a.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isAdmin && (
                    onlineUsers.has(selectedUser) 
                      ? <p className="text-xs text-green-500 font-medium">Utente Online</p>
                      : <p className="text-xs text-gray-400 font-medium">Utente Offline</p>
                  )}
                </div>
              </div>

              {/* Selettore Stato Ticket (Visibile sia ad Admin che a Utente) */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 hidden sm:inline">
                  Stato Ticket:
                </span>
                <select
                  value={currentTicketStatus}
                  onChange={(e) => handleChangeTicketStatus(e.target.value)}
                  className="text-xs font-bold bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                >
                  <option value="non_completato">🟠 Non completato (In corso)</option>
                  <option value="completato">🟢 Completato</option>
                  <option value="annullato">🔴 Annullato</option>
                </select>
              </div>

              {/* Azioni Esporta / Elimina */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExportChat}
                  className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="Esporta Chat (.txt)"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  title="Elimina Conversazione"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Chiudi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                  <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  <p className="font-semibold text-sm text-gray-600 dark:text-gray-300">Nessun messaggio in questo ticket</p>
                  <p className="text-xs text-gray-400">Scrivi qui sotto per inviare la richiesta all'amministratore</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  const isSystem = msg.content?.startsWith('📌 Stato del ticket');

                  if (isSystem) {
                    return (
                      <div key={msg.id || idx} className="flex justify-center my-2">
                        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800/60 shadow-2xs flex items-center gap-1.5">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-2xs ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-xs' 
                          : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-tl-xs'
                      }`}>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" />
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center space-x-2 w-max shadow-2xs border border-gray-200/50 dark:border-slate-700/50">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sta scrivendo</span>
                    <div className="flex space-x-1.5 ml-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                  placeholder="Scrivi un messaggio al supporto..."
                  className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-700" />
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Seleziona un Ticket o Utente</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Scegli un cliente dalla colonna di sinistra per iniziare la conversazione ed aggiornarne lo stato.
            </p>
          </div>
        )}
      </div>

      {/* POPUP MODALE CONFERMA ELIMINAZIONE CHAT (Al posto di window.confirm) */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-700 text-center space-y-4 animate-in fade-in duration-150">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Eliminare l'intera conversazione?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tutti i messaggi in questo ticket verranno eliminati in modo permanente.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmDeleteChat}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {deleting ? 'Eliminazione...' : 'Sì, elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
