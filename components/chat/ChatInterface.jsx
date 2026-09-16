import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  Send, User, Search, MessageCircle, Clock, Trash2, 
  Download, X, CheckCircle, AlertCircle, XCircle, Filter, 
  ShieldCheck, ChevronDown, Plus, Tag, RefreshCw, AlertTriangle,
  LifeBuoy, FileText, CornerDownRight, Check, Paperclip, File, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ChatInterface = ({ initialUserId = null, isAdmin = false, onClose }) => {
  const { user } = useAuth();
  
  // Lista ticket e conversazioni
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  // Amministratori e utenti online
  const [adminsList, setAdminsList] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  // Filtro stato ticket nella sidebar (ALL, non_completato, completato, annullato)
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modale per la creazione di un Nuovo Ticket
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('Media');
  const [newTicketAdminId, setNewTicketAdminId] = useState('ALL');
  const [newTicketFiles, setNewTicketFiles] = useState([]);
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Allegati per la chat risposte
  const [chatFiles, setChatFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Modale per la conferma d'eliminazione ticket
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const ticketFileInputRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const typingChannelRef = useRef(null);
  const ticketSyncChannelRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  // Helper per l'upload degli allegati (con fallback a Data URL)
  const uploadFilesToStorage = async (fileList) => {
    if (!fileList || fileList.length === 0) return [];
    const uploaded = [];

    for (const file of fileList) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `ticket-file-${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `ticket-attachments/${fileName}`;

        const { error } = await supabase.storage
          .from('campaign-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (error) {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          uploaded.push({ name: file.name, url: dataUrl, type: file.type });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('campaign-images')
            .getPublicUrl(filePath);
          uploaded.push({ name: file.name, url: publicUrl, type: file.type });
        }
      } catch (err) {
        console.warn('Fallback lettura file localmente:', err);
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        uploaded.push({ name: file.name, url: dataUrl, type: file.type });
      }
    }
    return uploaded;
  };

  // Helper resiliente per l'inserimento dei messaggi nel DB (con fallback automatico se ticket_id non esiste nel DB)
  const insertMessageToSupabase = async (msgPayload) => {
    try {
      const { error } = await supabase.from('messages').insert([msgPayload]);
      if (error) {
        console.warn('Inserimento diretto fallito, esecuzione fallback senza colonna ticket_id:', error.message);
        
        const fallbackPayload = {
          sender_id: msgPayload.sender_id,
          receiver_id: msgPayload.receiver_id || msgPayload.sender_id,
          content: msgPayload.ticket_id 
            ? `[TICKET:${msgPayload.ticket_id}]\n${msgPayload.content}` 
            : msgPayload.content,
          read: false,
          created_at: msgPayload.created_at || new Date().toISOString()
        };

        const { error: fallbackErr } = await supabase.from('messages').insert([fallbackPayload]);
        if (fallbackErr) {
          console.error('Errore inserimento messaggio fallback:', fallbackErr);
          throw fallbackErr;
        }
      }
    } catch (err) {
      console.error('Errore definitivo inserimento messaggio:', err);
      throw err;
    }
  };

  // 1. Carica la lista degli Amministratori
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

  // 2. Carica i Ticket da SUPABASE DATABASE & Sincronizzazione Realtime
  useEffect(() => {
    if (!user) return;

    const fetchDbTickets = async () => {
      try {
        const { data: dbTickets, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && dbTickets && dbTickets.length > 0) {
          setTickets(dbTickets);
          try { localStorage.setItem('support_tickets_v2', JSON.stringify(dbTickets)); } catch(e){}
        } else {
          const stored = localStorage.getItem('support_tickets_v2');
          if (stored) setTickets(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Fallback a cache ticket locale:', err);
        const stored = localStorage.getItem('support_tickets_v2');
        if (stored) setTickets(JSON.parse(stored));
      }
    };

    fetchDbTickets();

    const fetchUnread = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, ticket_id')
          .eq('receiver_id', user.id)
          .eq('read', false);

        if (!error && data) {
          const counts = {};
          data.forEach(msg => {
            if (msg.ticket_id) counts[msg.ticket_id] = (counts[msg.ticket_id] || 0) + 1;
            if (msg.sender_id) counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
          });
          setUnreadCounts(counts);
        }
      } catch (err) {
        console.error('Errore unread counts:', err);
      }
    };
    fetchUnread();

    const ticketSyncChannel = supabase.channel('support_tickets_realtime');
    ticketSyncChannelRef.current = ticketSyncChannel;

    ticketSyncChannel
      .on('broadcast', { event: 'ticket_created' }, payload => {
        const newT = payload.payload;
        setTickets(prev => {
          if (prev.some(t => t.id === newT.id)) return prev;
          const updated = [newT, ...prev];
          try { localStorage.setItem('support_tickets_v2', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
      })
      .on('broadcast', { event: 'ticket_status_changed' }, payload => {
        const { ticketId, newStatus } = payload.payload;
        setTickets(prev => {
          const updated = prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
          try { localStorage.setItem('support_tickets_v2', JSON.stringify(updated)); } catch(e){}
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketSyncChannel);
    };
  }, [user]);

  // 3. Presence & Typing Broadcast
  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel('chat_presence', {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    const typingChannel = supabase.channel('chat_typing_status');
    typingChannelRef.current = typingChannel;

    typingChannel
      .on('broadcast', { event: 'typing' }, payload => {
        const { userId, isTyping } = payload.payload;
        if (userId === user.id) return;

        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) newSet.add(userId); else newSet.delete(userId);
          return newSet;
        });

        if (isTyping) {
          if (typingTimeoutRef.current[userId]) clearTimeout(typingTimeoutRef.current[userId]);
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
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [user]);

  // 4. Carica i messaggi E DIMINUISCE IL PALLINO NON LETTI alla visualizzazione del ticket!
  useEffect(() => {
    if (!user || !selectedTicketId) {
      setMessages([]);
      return;
    }

    const currentTicket = tickets.find(t => t.id === selectedTicketId);

    const fetchTicketMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          const filtered = data.filter(m => 
            m.ticket_id === selectedTicketId || 
            (m.content && m.content.includes(`[TICKET:${selectedTicketId}]`)) ||
            (currentTicket && (m.sender_id === currentTicket.user_id || m.receiver_id === currentTicket.user_id))
          );
          setMessages(filtered);
        }

        // ✅ DIMINUZIONE / AZZERAMENTO PALLINO NON LETTI ALLA VISUALIZZAZIONE DEL TICKET
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', user.id)
          .eq('read', false);

        setUnreadCounts(prev => {
          const updated = { ...prev };
          delete updated[selectedTicketId];
          if (currentTicket?.user_id) delete updated[currentTicket.user_id];
          return updated;
        });

      } catch (err) {
        console.error('Errore caricamento messaggi ticket:', err);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    fetchTicketMessages();

    // Iscrizione al canale realtime dei messaggi
    const channel = supabase
      .channel(`ticket_chat_${selectedTicketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new;
        if (
          newMsg.ticket_id === selectedTicketId ||
          (newMsg.content && newMsg.content.includes(`[TICKET:${selectedTicketId}]`)) ||
          (currentTicket && (newMsg.sender_id === currentTicket.user_id || newMsg.receiver_id === currentTicket.user_id))
        ) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();

          if (newMsg.receiver_id === user.id) {
            supabase.from('messages').update({ read: true }).eq('id', newMsg.id);
            setUnreadCounts(prev => {
              const updated = { ...prev };
              delete updated[selectedTicketId];
              if (currentTicket?.user_id) delete updated[currentTicket.user_id];
              return updated;
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicketId, user, tickets]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // 5. Creazione Nuovo Ticket con SALVATAGGIO IN TABELLA SUPABASE DB
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDescription.trim() || !user) {
      toast.error('Inserisci sia l\'oggetto che la descrizione del ticket.');
      return;
    }

    setCreatingTicket(true);

    try {
      const ticketId = `ticket-${Date.now().toString(36)}`;
      const uploadedFiles = await uploadFilesToStorage(newTicketFiles);

      const newTicketObj = {
        id: ticketId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utente',
        user_email: user.email,
        subject: newTicketSubject.trim(),
        description: newTicketDescription.trim(),
        priority: newTicketPriority,
        status: 'non_completato',
        assigned_admin_id: newTicketAdminId,
        attachments: uploadedFiles,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 💾 1. Salva nella tabella support_tickets del DATABASE SUPABASE
      try {
        const { error: dbErr } = await supabase
          .from('support_tickets')
          .insert([newTicketObj]);
        if (dbErr) console.warn('Database support_tickets insert info:', dbErr.message);
      } catch (dbEx) {
        console.warn('Fallback local storage per support_tickets:', dbEx);
      }

      // 💾 2. Aggiorna stato locale e cache localStorage
      const updatedTickets = [newTicketObj, ...tickets];
      setTickets(updatedTickets);
      try {
        localStorage.setItem('support_tickets_v2', JSON.stringify(updatedTickets));
      } catch (e) {}

      // 📡 3. Broadcast realtime
      if (ticketSyncChannelRef.current) {
        ticketSyncChannelRef.current.send({
          type: 'broadcast',
          event: 'ticket_created',
          payload: newTicketObj
        });
      }

      // 📨 4. Invia primo messaggio nel DB via helper resiliente
      const targetAdmin = newTicketAdminId !== 'ALL' ? newTicketAdminId : (adminsList[0]?.id || user.id);
      
      let initialContent = `🎫 **NUOVO TICKET #${ticketId.slice(-4).toUpperCase()}**: ${newTicketSubject.trim()}\n\n📝 **Priorità**: ${newTicketPriority}\n\n${newTicketDescription.trim()}`;
      if (uploadedFiles.length > 0) {
        initialContent += `\n\n📎 **Allegati (${uploadedFiles.length})**:\n` + uploadedFiles.map(f => `• [${f.name}](${f.url})`).join('\n');
      }

      const initialMessage = {
        ticket_id: ticketId,
        sender_id: user.id,
        receiver_id: targetAdmin,
        content: initialContent,
        read: false,
        created_at: new Date().toISOString()
      };

      await insertMessageToSupabase(initialMessage);

      setSelectedTicketId(ticketId);
      setShowNewTicketModal(false);
      setNewTicketSubject('');
      setNewTicketDescription('');
      setNewTicketPriority('Media');
      setNewTicketAdminId('ALL');
      setNewTicketFiles([]);

      toast.success('🎉 Nuovo ticket salvato nel database ed aperto con successo!');
    } catch (err) {
      console.error('Errore creazione ticket:', err);
      toast.error('Si è verificato un errore durante la creazione del ticket.');
    } finally {
      setCreatingTicket(false);
    }
  };

  // 6. Cambio Stato Ticket con AGGIORNAMENTO SUPABASE DATABASE
  const handleChangeTicketStatus = async (newStatus) => {
    if (!selectedTicketId) return;

    try {
      await supabase
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedTicketId);
    } catch (errDb) {
      console.warn('Database update status:', errDb);
    }

    const updatedTickets = tickets.map(t => 
      t.id === selectedTicketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
    );

    setTickets(updatedTickets);
    try {
      localStorage.setItem('support_tickets_v2', JSON.stringify(updatedTickets));
    } catch (e) {}

    if (ticketSyncChannelRef.current) {
      ticketSyncChannelRef.current.send({
        type: 'broadcast',
        event: 'ticket_status_changed',
        payload: { ticketId: selectedTicketId, newStatus }
      });
    }

    const statusLabels = {
      non_completato: '🟠 Non completato (Aperto)',
      completato: '🟢 Completato (Risolto)',
      annullato: '🔴 Annullato'
    };

    const label = statusLabels[newStatus] || newStatus;
    toast.success(`Stato del ticket aggiornato: ${label}`);

    const currentTicket = tickets.find(t => t.id === selectedTicketId);
    const targetReceiver = isAdmin 
      ? (currentTicket?.user_id || user.id) 
      : (currentTicket?.assigned_admin_id !== 'ALL' ? currentTicket?.assigned_admin_id : adminsList[0]?.id || user.id);

    try {
      await insertMessageToSupabase({
        ticket_id: selectedTicketId,
        sender_id: user.id,
        receiver_id: targetReceiver,
        content: `📌 Stato del ticket modificato in: ${label}`,
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Errore log cambio stato:', err);
    }
  };

  // 7. Invio Messaggio con Allegati
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && chatFiles.length === 0) || !user || !selectedTicketId) return;

    setUploadingFiles(true);

    try {
      if (typingChannelRef.current) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user?.id, isTyping: false }
        });
      }

      const currentTicket = tickets.find(t => t.id === selectedTicketId);
      let targetReceiver = isAdmin 
        ? currentTicket?.user_id 
        : (currentTicket?.assigned_admin_id !== 'ALL' ? currentTicket?.assigned_admin_id : adminsList[0]?.id);

      if (!targetReceiver) targetReceiver = user.id;

      const uploadedFiles = await uploadFilesToStorage(chatFiles);

      let fullContent = newMessage.trim();
      if (uploadedFiles.length > 0) {
        const fileLinks = uploadedFiles.map(f => `📎 Allegato: [${f.name}](${f.url})`).join('\n');
        fullContent = fullContent ? `${fullContent}\n\n${fileLinks}` : fileLinks;
      }

      const msgPayload = {
        ticket_id: selectedTicketId,
        sender_id: user.id,
        receiver_id: targetReceiver,
        content: fullContent,
        read: false,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, { ...msgPayload, id: Math.random().toString() }]);
      setNewMessage('');
      setChatFiles([]);

      await insertMessageToSupabase(msgPayload);
    } catch (err) {
      console.error('Errore invio messaggio:', err);
      toast.error('Errore nell\'invio del messaggio.');
    } finally {
      setUploadingFiles(false);
    }
  };

  // 8. Esportazione della chat del ticket
  const handleExportChat = () => {
    if (!messages.length) {
      toast.error('Nessun messaggio da esportare.');
      return;
    }

    const currentTicket = tickets.find(t => t.id === selectedTicketId);
    let text = `=== TICKET #${selectedTicketId} ===\n`;
    text += `Oggetto: ${currentTicket?.subject || 'Supporto'}\n`;
    text += `Cliente: ${currentTicket?.user_name} (${currentTicket?.user_email})\n`;
    text += `Priorità: ${currentTicket?.priority || 'Media'}\n`;
    text += `Stato: ${currentTicket?.status || 'non_completato'}\n\n`;
    text += `=== CRONOLOGIA MESSAGGI ===\n\n`;

    messages.forEach(m => {
      const isMe = m.sender_id === user?.id;
      const date = new Date(m.created_at).toLocaleString('it-IT');
      const senderName = isMe ? "Io" : (isAdmin ? "Cliente" : "Supporto Admin");
      text += `[${date}] ${senderName}:\n${m.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket_${selectedTicketId}_Export.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('📥 Chat del ticket esportata con successo!');
  };

  // 9. Eliminazione Ticket da SUPABASE DATABASE
  const confirmDeleteTicket = async () => {
    if (!selectedTicketId) return;
    setDeleting(true);

    try {
      try {
        await supabase.from('support_tickets').delete().eq('id', selectedTicketId);
      } catch (dbErr) {
        console.warn('Database delete ticket:', dbErr);
      }

      const updatedTickets = tickets.filter(t => t.id !== selectedTicketId);
      setTickets(updatedTickets);
      try {
        localStorage.setItem('support_tickets_v2', JSON.stringify(updatedTickets));
      } catch(e){}

      setSelectedTicketId(null);
      setMessages([]);
      toast.success('🗑️ Ticket eliminato con successo!');
    } catch (err) {
      toast.error('Impossibile eliminare il ticket.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (statusKey) => {
    switch (statusKey) {
      case 'completato':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Completato
          </span>
        );
      case 'annullato':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shrink-0">
            <XCircle className="w-3 h-3 text-rose-600" />
            Annullato
          </span>
        );
      case 'non_completato':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-amber-600" />
            Aperto
          </span>
        );
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Urgente':
        return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">🔴 Urgente</span>;
      case 'Alta':
        return <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">🟠 Alta</span>;
      case 'Bassa':
        return <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">🟢 Bassa</span>;
      case 'Media':
      default:
        return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">🔵 Media</span>;
    }
  };

  // Ticket filtrati
  const visibleTickets = tickets.filter(t => {
    if (!isAdmin && t.user_id !== user?.id) return false;

    const matchesSearch = 
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.id || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden relative">
      
      {/* SIDEBAR TICKET */}
      <div className="w-80 border-r border-gray-200 dark:border-slate-800 flex flex-col bg-gray-50 dark:bg-slate-900/50">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-indigo-600" />
              {isAdmin ? 'Tutti i Ticket' : 'I miei Ticket'}
            </h2>

            {!isAdmin && (
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-4 h-4" /> Nuovo Ticket
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={isAdmin ? "Cerca utente, oggetto..." : "Cerca tra i tuoi ticket..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filtri stato ticket */}
          <div className="flex items-center gap-1 bg-gray-200/60 dark:bg-slate-800 p-1 rounded-lg text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1 rounded text-center transition ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs font-bold' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Tutti ({visibleTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('non_completato')}
              className={`flex-1 py-1 rounded text-center transition ${statusFilter === 'non_completato' ? 'bg-amber-500 text-white font-bold shadow-2xs' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Aperti
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

        {/* Lista dei Ticket con Pallino dei Non Letti dinamico */}
        <div className="flex-1 overflow-y-auto">
          {visibleTickets.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 italic space-y-2">
              <FileText className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p>Nessun ticket presente in questa sezione</p>
              {!isAdmin && (
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="mt-2 text-indigo-600 font-bold hover:underline block mx-auto text-xs"
                >
                  + Clicca qui per aprire un nuovo ticket
                </button>
              )}
            </div>
          ) : (
            visibleTickets.map(t => {
              const unreadCount = unreadCounts[t.id] || unreadCounts[t.user_id] || 0;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full p-3.5 flex flex-col gap-1.5 border-b border-gray-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors text-left ${selectedTicketId === t.id ? 'bg-white dark:bg-slate-800 border-l-4 border-l-indigo-600 shadow-2xs' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate max-w-[150px] flex items-center gap-1.5">
                      {t.subject}
                      {unreadCount > 0 && selectedTicketId !== t.id && (
                        <span className="min-w-[1.1rem] h-4 px-1 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-2xs animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>

                  <div className="flex items-center justify-between w-full text-[11px] text-gray-500">
                    <span className="truncate max-w-[140px] font-medium text-gray-600 dark:text-gray-400">
                      {isAdmin ? `👤 ${t.user_name}` : `📌 #${t.id.slice(-4).toUpperCase()}`}
                    </span>
                    <div className="flex items-center gap-1">
                      {t.attachments && t.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-indigo-500" title={`${t.attachments.length} allegati`} />
                      )}
                      {getPriorityBadge(t.priority)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

      </div>

      {/* CHAT AREA DEL TICKET SELEZIONATO */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedTicket ? (
          <>
            {/* Header del Ticket Attivo */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs z-10">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                  #{selectedTicket.id.slice(-4).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      {selectedTicket.subject}
                    </h3>
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isAdmin ? `Cliente: ${selectedTicket.user_name} (${selectedTicket.user_email})` : `Inviato il ${new Date(selectedTicket.created_at).toLocaleDateString('it-IT')}`}
                  </p>
                </div>
              </div>

              {/* Selettore Modifica Stato del Ticket */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-xl">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 hidden sm:inline">
                    Stato:
                  </span>
                  <select
                    value={selectedTicket.status || 'non_completato'}
                    onChange={(e) => handleChangeTicketStatus(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  >
                    <option value="non_completato">🟠 Non completato (Aperto)</option>
                    <option value="completato">🟢 Completato (Risolto)</option>
                    <option value="annullato">🔴 Annullato</option>
                  </select>
                </div>

                <button
                  onClick={handleExportChat}
                  className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="Esporta Chat Ticket (.txt)"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  title="Elimina Ticket"
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

            {/* Descrizione Iniziale + Allegati Iniziali */}
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 p-3.5 px-6 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5 shrink-0">
              <CornerDownRight className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-indigo-900 dark:text-indigo-100 block mb-0.5">Descrizione Iniziale del Ticket:</span>
                <p className="whitespace-pre-wrap text-indigo-800 dark:text-indigo-300 mb-2">{selectedTicket.description}</p>
                
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-1">
                    <span className="font-bold text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" /> Allegati del Ticket ({selectedTicket.attachments.length}):
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedTicket.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded-lg border border-indigo-200 dark:border-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="truncate max-w-[160px]">{att.name}</span>
                          <Download className="w-3 h-3 text-indigo-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Area Messaggi Chat */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                  <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  <p className="font-semibold text-sm text-gray-600 dark:text-gray-300">La chat di questo ticket è attiva</p>
                  <p className="text-xs text-gray-400">Scrivi un messaggio per rispondere</p>
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

            {/* Preview Allegati Selezionati nella Risposta Chat */}
            {chatFiles.length > 0 && (
              <div className="px-4 py-2 bg-indigo-50/80 dark:bg-slate-800 border-t border-indigo-100 dark:border-slate-700 flex flex-wrap gap-2">
                {chatFiles.map((file, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-600 text-indigo-900 dark:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button type="button" onClick={() => setChatFiles(chatFiles.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input Form Risposta Chat con Tasto Allegato */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={e => setChatFiles(prev => [...prev, ...Array.from(e.target.files)])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition"
                  title="Allega file o immagini"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                  placeholder="Scrivi una risposta o inserisci allegati..."
                  className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />

                <button
                  type="submit"
                  disabled={(!newMessage.trim() && chatFiles.length === 0) || uploadingFiles}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center space-y-3">
            <LifeBuoy className="w-16 h-16 text-indigo-300 dark:text-slate-700" />
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
              Seleziona un Ticket o Apri un Nuovo Ticket
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
              {isAdmin 
                ? 'Scegli un ticket dalla lista a sinistra per chattare con il cliente e modificarne lo stato.'
                : 'Seleziona un tuo ticket o clicca su "+ Nuovo Ticket" per ricevere assistenza.'}
            </p>
            {!isAdmin && (
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Apri Nuovo Ticket di Supporto
              </button>
            )}
          </div>
        )}
      </div>

      {/* FORM MODALE PER CREARE UN NUOVO TICKET CON ALLEGATI (Lato Utente) */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-700">
            
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Apri Nuovo Ticket di Supporto</h3>
                  <p className="text-indigo-100 text-xs">Richiedi assistenza ed inserisci allegati se necessario</p>
                </div>
              </div>
              <button onClick={() => setShowNewTicketModal(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Oggetto del Ticket *
                </label>
                <input
                  type="text"
                  required
                  value={newTicketSubject}
                  onChange={e => setNewTicketSubject(e.target.value)}
                  placeholder="Es. Problema invio email campagna o chiarimento fattura"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                    Priorità *
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={e => setNewTicketPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Bassa">🟢 Bassa</option>
                    <option value="Media">🔵 Media (Predefinita)</option>
                    <option value="Alta">🟠 Alta</option>
                    <option value="Urgente">🔴 Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                    Amministratore *
                  </label>
                  <select
                    value={newTicketAdminId}
                    onChange={e => setNewTicketAdminId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="ALL">📢 Tutti gli Amministratori</option>
                    {adminsList.map(a => (
                      <option key={a.id} value={a.id}>
                        👤 {a.full_name || a.name || a.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Descrizione Iniziale del Problema *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newTicketDescription}
                  onChange={e => setNewTicketDescription(e.target.value)}
                  placeholder="Descrivi dettagliatamente la tua richiesta di supporto..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Upload Allegati del Ticket */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 text-xs">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    Allegati Ticket (Opzionale)
                  </label>
                  <input
                    type="file"
                    ref={ticketFileInputRef}
                    multiple
                    onChange={e => setNewTicketFiles(prev => [...prev, ...Array.from(e.target.files)])}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => ticketFileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Aggiungi File
                  </button>
                </div>

                {newTicketFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {newTicketFiles.map((file, i) => (
                      <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1 shadow-2xs">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        <span className="truncate max-w-[130px]">{file.name}</span>
                        <button type="button" onClick={() => setNewTicketFiles(newTicketFiles.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  disabled={creatingTicket}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {creatingTicket ? 'Creazione in corso...' : '🚀 Crea Ticket e Avvia Chat'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* POPUP MODALE CONFERMA ELIMINAZIONE TICKET */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-700 text-center space-y-4 animate-in fade-in duration-150">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Eliminare questo ticket?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Il ticket e i relativi messaggi verranno rimossi permanentemente.
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
                onClick={confirmDeleteTicket}
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
