import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Send, User, Search, MessageCircle, Clock } from 'lucide-react';

export const ChatInterface = ({ initialUserId = null, isAdmin = false }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(initialUserId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  // Per gli admin: Carica la lista degli utenti con cui c'è una conversazione
  useEffect(() => {
    if (!isAdmin) return;

    const fetchConversations = async () => {
      // In una chat reale, prenderesti gli ultimi messaggi per utente.
      // Per semplicità, qui carichiamo tutti gli utenti che hanno inviato o ricevuto messaggi dall'admin
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, roles(name)');
      
      if (!error && users) {
        // Escludiamo gli altri admin dalla lista (o no, a discrezione)
        const clients = users.filter(u => u.roles?.name !== 'super_admin' && u.roles?.name !== 'admin');
        setConversations(clients);
      }
    };
    
    fetchConversations();
  }, [isAdmin]);

  // Carica i messaggi per la conversazione selezionata
  useEffect(() => {
    if (!user) return;
    
    // Se non è admin, l'interlocutore è sempre l'admin (o il sistema in generale)
    // Per ora facciamo che i messaggi sono salvati con receiver_id = l'admin che ha risposto.
    // Oppure, più semplicemente: sender_id e receiver_id.
    
    const fetchMessages = async () => {
      setLoading(true);
      
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
      
      if (isAdmin) {
        if (!selectedUser) {
          setMessages([]);
          setLoading(false);
          return;
        }
        // Messaggi tra l'admin loggato e l'utente selezionato
        query = query.or(`and(sender_id.eq.\${user.id},receiver_id.eq.\${selectedUser}),and(sender_id.eq.\${selectedUser},receiver_id.eq.\${user.id})`);
      } else {
        // Messaggi dove l'utente è sender o receiver
        query = query.or(`sender_id.eq.\${user.id},receiver_id.eq.\${user.id}`);
      }
      
      const { data, error } = await query;
      if (!error) {
        setMessages(data || []);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Se l'utente è un admin, il receiver è selectedUser.
    // Se l'utente è un cliente, il receiver deve essere un admin. Nel DB, possiamo fare che i messaggi verso l'assistenza
    // abbiano un receiver_id specifico o null. Per ora inviamo ad un admin di default o lasciamo che il primo admin risponda.
    // Poiché serve un UUID valido in `receiver_id`, per gli utenti standard potremmo dover scegliere un admin_id.
    // Soluzione temporanea: l'utente non manda al primo avvio, o manda ad un admin noto.
    // In questo piano, assumiamo che l'admin_id venga recuperato dal backend o l'utente stia rispondendo.
    
    let targetReceiver = null;
    if (isAdmin) {
      targetReceiver = selectedUser;
    } else {
      // Se c'è già una conversazione, prendi l'ID dell'admin che ha scritto per ultimo
      const lastAdminMsg = messages.slice().reverse().find(m => m.sender_id !== user.id);
      targetReceiver = lastAdminMsg?.sender_id; 
      
      if (!targetReceiver) {
        // Fallback: Ottieni un admin
        const { data } = await supabase.from('profiles').select('id, roles(name)').eq('roles.name', 'super_admin').limit(1).single();
        targetReceiver = data?.id;
      }
    }

    if (!targetReceiver) {
      alert("Nessun amministratore disponibile a ricevere il messaggio.");
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
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(c => 
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
      
      {/* SIDEBAR (Solo Admin) */}
      {isAdmin && (
        <div className="w-80 border-r border-gray-200 dark:border-slate-800 flex flex-col bg-gray-50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-500" />
              Conversazioni
            </h2>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca utente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedUser(c.id)}
                className={\`w-full p-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors \${selectedUser === c.id ? 'bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500' : ''}\`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  {(c.full_name || c.email).charAt(0).toUpperCase()}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {c.full_name || 'Utente'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {(!isAdmin || selectedUser) ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {isAdmin ? 'Utente Selezionato' : 'Assistenza Tecnica'}
                  </h3>
                  <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                  <p>Nessun messaggio in questa conversazione.</p>
                  <p className="text-sm">Invia il primo messaggio per iniziare!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id || idx} className={\`flex \${isMe ? 'justify-end' : 'justify-start'}\`}>
                      <div className={\`max-w-[75%] rounded-2xl p-4 shadow-sm \${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-tl-sm'
                      }\`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className={\`flex items-center justify-end gap-1 mt-2 text-[10px] \${isMe ? 'text-indigo-200' : 'text-gray-400'}\`}>
                          <Clock className="w-3 h-3" />
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-700" />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">Seleziona una conversazione</h3>
            <p className="text-sm mt-2">Scegli un utente dalla lista a sinistra per iniziare a chattare</p>
          </div>
        )}
      </div>
    </div>
  );
};
