import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from '../../lib/supabaseClient';
import toast from "react-hot-toast";
import InputField from "../../components/ui/InputField";
import ForgotPasswordModal from './ForgotPasswordModal';

// Aggiungi questo import in cima
import { AnimatePresence, motion } from 'framer-motion';

// Aggiungi questo stato dentro LoginPage
const [showInactivityMessage, setShowInactivityMessage] = useState(false);



import { 
  Mail, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Shield, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  MailOpen
} from 'lucide-react';

// Aggiungi questo useEffect (dopo quelli già esistenti)
useEffect(() => {
  if (typeof window !== 'undefined') {
    const reason = sessionStorage.getItem('logout_reason');
    if (reason === 'inactivity') {
      setShowInactivityMessage(true);
      sessionStorage.removeItem('logout_reason');
    }
  }
}, []);

// ============================================
// MODALE EMAIL NON CONFERMATA
// ============================================
const EmailNotConfirmedModal = ({ show, onClose, email, onResend, isResending }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <MailOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Email Non Confermata
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-800 leading-relaxed">
                Il tuo account <strong className="text-gray-900">{email}</strong> non è ancora stato attivato.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Cosa devi fare:</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Controlla la tua casella email <strong>{email}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Cerca l'email di conferma da <strong>MailMassProm</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Clicca sul link di attivazione nell'email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Torna qui e prova ad accedere di nuovo</span>
              </li>
            </ol>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Suggerimento:</strong> Se non trovi l'email, controlla anche nella cartella <strong>Spam</strong> o <strong>Promozioni</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-xl space-y-3">
          <button
            onClick={onResend}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Reinvia Email di Conferma
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false); // ✅ Nuovo stato
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false); // ✅ Per il reinvio
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
// ✅ In LoginPage, aggiungi questo useEffect
useEffect(() => {
  // ✅ Azzera l'utente corrente quando sei sulla pagina di login
  // così il prossimo SIGNED_IN viene sempre accettato
  if (typeof window !== 'undefined') {
    window.__loginPageActive = true;
    window.__currentLoginUserId = null; // ✅ segnala che non c'è utente attivo
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.__loginPageActive = false;
      window.__currentLoginUserId = null;
    }
  };
}, []);
// ✅ Aggiungi in LoginPage nel useEffect esistente
useEffect(() => {
  // ✅ Resetta currentUserId quando sei sulla pagina di login
  // Questo permette al prossimo SIGNED_IN di essere accettato
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setIsLoading(false);
    }
  };

  const handleFocus = () => {
    setIsLoading(false);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
}, []);


  // Gestione input
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Validazione
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email richiesta';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    if (!formData.password) {
      newErrors.password = 'Password richiesta';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password deve essere di almeno 8 caratteri';
    }

    if (!isLogin) {
      if (!formData.full_name) {
        newErrors.full_name = 'Nome completo richiesto';
      } else if (formData.full_name.length < 2) {
        newErrors.full_name = 'Nome deve essere di almeno 2 caratteri';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Conferma password richiesta';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Le password non coincidono';
      }

      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'Devi accettare i termini di servizio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Funzione per reinviare email di conferma
  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error('Inserisci la tua email');
      return;
    }

    try {
      setIsResending(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email.trim().toLowerCase(),
      });

      if (error) {
        throw error;
      }

      toast.success('✅ Email di conferma inviata! Controlla la tua casella di posta.', {
        duration: 5000
      });
      
      setShowEmailNotConfirmed(false); // Chiudi il modale
      
   // ✅ Sostituisci il finally con questo
} catch (error) {
  console.error('❌ Errore catch finale:', error);
  const errorMessage = error.message || 'Errore sconosciuto';

  if (errorMessage.includes('already registered')) {
    setErrors({ email: 'Questa email è già registrata' });
    toast.error('Email già registrata. Prova ad accedere.');
  } else if (errorMessage.includes('Invalid login credentials')) {
    setErrors({ general: 'Email o password non corretti' });
    toast.error('Credenziali non valide');
  } else if (errorMessage.includes('pending') || errorMessage.includes('attesa')) {
    setErrors({ general: errorMessage });
    toast.error('Account in attesa di approvazione');
  } else if (errorMessage.includes('rejected') || errorMessage.includes('rifiutato')) {
    setErrors({ general: errorMessage });
    toast.error('Account rifiutato');
  } else if (errorMessage.includes('inactive') || errorMessage.includes('disattivato')) {
    setErrors({ general: errorMessage });
    toast.error('Account disattivato');
  } else {
    setErrors({ general: errorMessage });
    toast.error(errorMessage);
  }
  
  // ✅ Resetta loading solo in caso di errore
  setIsLoading(false);
  
} finally {
  // ✅ NON resettare loading qui - lo fa il setTimeout o il catch
  // setIsLoading(false); // ❌ RIMUOVI questa riga
}
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
  
    // ✅ AGGIUNGI QUESTE DUE RIGHE - azzera il flag prima del login
    if (typeof window !== 'undefined') {
      window.__currentLoginUserId = null;
      window.__loginPageActive = false; // ✅ disabilita temporaneamente il blocco
    }
  
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
  
      // ====================== LOGIN ======================
if (isLogin) {
  console.log('🔐 Tentativo di login per:', cleanEmail);

  // 1️⃣ Login con Supabase Auth - CON TRY-CATCH INTERNO
  let authData, authError;
  
  try {
    const result = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: formData.password,
    });
    authData = result.data;
    authError = result.error;
  } catch (err) {
    // Cattura l'errore se Supabase lancia un'eccezione
    authError = err;
  }

  if (authError) {
    console.error('❌ Errore login:', authError);
    
    // ✅ Gestione errore email non confermata - MOSTRA POPUP
    if (authError.message === 'Email not confirmed' || 
        authError.message?.includes('Email not confirmed')) {
      setShowEmailNotConfirmed(true);
      setIsLoading(false);
      return; // ✅ Ferma qui senza lanciare errori
    }
    
    // Gestione altri errori
    if (authError.message?.includes('Invalid login credentials')) {
      throw new Error('Email o password non corretti');
    }
    
    throw new Error(authError.message || 'Errore durante il login');
  }

  console.log('✅ Autenticazione riuscita per:', authData.user.email);

  // ✅ Controlla se l'email è confermata (doppio controllo)
  if (!authData.user.email_confirmed_at) {
    await supabase.auth.signOut();
    setShowEmailNotConfirmed(true);
    setIsLoading(false);
    return; // ✅ Ferma qui
  }

  // 2️⃣ Recupera il profilo con ruolo
  let { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles (
        id,
        name,
        description
      )
    `)
    .eq('id', authData.user.id)
    .single();

  // 2.5️⃣ Se il profilo non esiste, crealo al volo
  if (profileError?.code === 'PGRST116') {
    console.warn('⚠️ Profilo non trovato, creazione automatica...');
    
    const { data: defaultRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .single();

    const { error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email: cleanEmail,
        full_name: authData.user.user_metadata?.full_name || cleanEmail,
        status: 'approved',
        role_id: defaultRole?.id
      }]);

    if (!createError) {
      const result = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles (
            id,
            name,
            description
          )
        `)
        .eq('id', authData.user.id)
        .single();
      
      profileData = result.data;
      profileError = result.error;
      
      if (!profileError) {
        console.log('✅ Profilo creato e caricato con successo');
      }
    }
  }

  if (profileError || !profileData) {
    console.error('❌ Profilo non recuperabile:', profileError);
    await supabase.auth.signOut();
    throw new Error('Errore nel caricamento del profilo. Contatta l\'amministratore.');
  }

  console.log('👤 Profilo recuperato:', {
    email: profileData.email,
    status: profileData.status,
    role: profileData.role?.name
  });

  // 3️⃣ Verifica lo status del profilo
  if (profileData.status === 'pending') {
    await supabase.auth.signOut();
    throw new Error('Il tuo account è in attesa di approvazione. Riceverai un\'email quando sarà attivato.');
  }

  if (profileData.status === 'rejected') {
    await supabase.auth.signOut();
    throw new Error('Il tuo account è stato rifiutato. Per informazioni contatta l\'amministratore.');
  }

  if (profileData.status === 'inactive') {
    await supabase.auth.signOut();
    throw new Error('Il tuo account è stato disattivato. Contatta l\'amministratore.');
  }

  if (profileData.status !== 'approved' && profileData.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('Il tuo account non è attivo. Contatta l\'amministratore.');
  }

  // 4️⃣ Verifica che abbia un ruolo assegnato
  if (!profileData.role_id) {
    console.warn('⚠️ Utente senza ruolo assegnato');
    toast.warning('Accesso con permessi limitati');
  }

  // 5️⃣ Login riuscito
  const welcomeName = profileData.full_name || profileData.email.split('@')[0];
  toast.success(`Benvenuto, ${welcomeName}! 👋`);
  
  // 6️⃣ Redirect in base al ruolo
 // 6️⃣ Redirect alla dashboard
console.log('🚀 Preparazione redirect...', {
  role: profileData.role?.name,
  email: profileData.email
});

setTimeout(() => {
  console.log('🚀 Eseguo redirect ora!');
  
  if (typeof window !== 'undefined') {
    window.__loginPageActive = false;
    window.__currentLoginUserId = null;
  }

  setIsLoading(false);
  
  // ✅ Usa window.location invece di router.push
  window.location.href = '/dashboard';
  
  console.log('✅ Redirect chiamato');
}, 1000);

console.log('⏰ setTimeout impostato, attendo 1 secondo...');
}
  
      // ====================== REGISTRAZIONE ======================
      else {
        console.log('📝 Tentativo di registrazione per:', cleanEmail);

        // 1️⃣ Registra con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
            }
          }
        });

        if (authError) {
          console.error('❌ Errore registrazione:', authError);
          
          if (authError.message.includes('already registered') || 
              authError.message.includes('User already registered')) {
            throw new Error('Questa email è già registrata. Prova ad accedere.');
          }
          
          throw new Error(authError.message);
        }

        const user = authData?.user;
        if (!user) {
          throw new Error('Errore nella creazione dell\'utente');
        }

        console.log('✅ Utente creato in auth:', user.id);

        // 2️⃣ Verifica se il profilo è stato creato dal trigger
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, status')
          .eq('id', user.id)
          .single();

        // 3️⃣ Se non esiste, crealo manualmente
        if (!existingProfile) {
          console.log('⚠️ Profilo non creato da trigger, creazione manuale...');
          
          const { data: defaultRole } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'user')
            .single();

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: cleanEmail,
              full_name: formData.full_name,
              status: 'pending',
              role_id: defaultRole?.id || null
            }]);

          if (profileError) {
            console.error('❌ Errore creazione profilo:', profileError);
            throw new Error('Errore nella creazione del profilo. Contatta il supporto.');
          }

          console.log('✅ Profilo creato manualmente');
        } else {
          console.log('✅ Profilo già esistente (creato da trigger)');
        }

        // 4️⃣ Invia email all'amministratore per approvazione
        try {
          const response = await fetch('/api/sendEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: cleanEmail,
              userName: formData.full_name,
              userId: user.id
            }),
          });

          if (response.ok) {
            console.log('✅ Email notifica inviata all\'admin');
          } else {
            console.warn('⚠️ Email notifica non inviata (non blocca la registrazione)');
          }
        } catch (emailError) {
          console.warn('⚠️ Errore invio email:', emailError);
        }

        // 5️⃣ Logout automatico (deve aspettare approvazione)
        await supabase.auth.signOut();

        // 6️⃣ Messaggio di successo
        setSuccessMessage(
          '🎉 Registrazione completata! Riceverai un\'email quando il tuo account sarà approvato dall\'amministratore. Controlla anche lo spam.'
        );
        toast.success('Registrazione completata! In attesa di approvazione.');
        
        console.log('✅ Registrazione completata con successo');
      }
  
    } catch (error) {
      console.error('❌ Errore catch finale:', error);
      const errorMessage = error.message || 'Errore sconosciuto';
    
      // Gestione altri errori
      if (errorMessage.includes('already registered')) {
        setErrors({ email: 'Questa email è già registrata' });
        toast.error('Email già registrata. Prova ad accedere.');
      } else if (errorMessage.includes('Invalid login credentials')) {
        setErrors({ general: 'Email o password non corretti' });
        toast.error('Credenziali non valide');
      } else if (errorMessage.includes('pending') || errorMessage.includes('attesa')) {
        setErrors({ general: errorMessage });
        toast.error('Account in attesa di approvazione');
      } else if (errorMessage.includes('rejected') || errorMessage.includes('rifiutato')) {
        setErrors({ general: errorMessage });
        toast.error('Account rifiutato');
      } else if (errorMessage.includes('inactive') || errorMessage.includes('disattivato')) {
        setErrors({ general: errorMessage });
        toast.error('Account disattivato');
      } else {
        setErrors({ general: errorMessage });
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle login/register
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setSuccessMessage('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      acceptTerms: false
    });
  };

  return (

    <>
    {/* 🔔 BANNER LOGOUT PER INATTIVITÀ */}
    <AnimatePresence>
      {showInactivityMessage && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xl">⏱️</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Sessione terminata per inattività</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Sei stato disconnesso automaticamente dopo 30 minuti senza attività. Accedi di nuovo per continuare.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInactivityMessage(false)}
            className="shrink-0 text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen flex">
        {/* Pannello sinistro - branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5">
          <div className="flex flex-col justify-center w-full max-w-md mx-auto p-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-600 p-3 rounded-2xl">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MailMassProm</h1>
              <p className="text-gray-600 text-lg">Piattaforma Professionale di Email Marketing</p>
              <p className="text-xs text-gray-400 mt-1">
  v{process.env.NEXT_PUBLIC_APP_VERSION}
</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg mt-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Invii Illimitati</h3>
                  <p className="text-gray-600 text-sm">Raggiungi migliaia di clienti con campagne personalizzate</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg mt-1">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sicurezza Garantita</h3>
                  <p className="text-gray-600 text-sm">I tuoi dati sono protetti con crittografia avanzata</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg mt-1">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Setup Immediato</h3>
                  <p className="text-gray-600 text-sm">Inizia a inviare email in meno di 5 minuti</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white">
              <blockquote className="text-sm italic mb-3">
                "MailMassProm ha trasformato completamente la nostra strategia di email marketing. Risultati incredibili!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Marco Verdi</div>
                  <div className="text-xs opacity-80">CEO, TechStart Italia</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pannello destro - form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo Mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-600 p-3 rounded-2xl">
                  <Mail className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MailMassProm</h1>
            </div>

            {/* Header Form */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {isLogin ? 'Bentornato!' : 'Crea Account'}
              </h2>
              <p className="mt-2 text-gray-600">
                {isLogin 
                  ? 'Accedi al tuo account per continuare' 
                  : 'Inizia la tua prova gratuita oggi'}
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error General */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => !isLoading && setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                } ${isLoading ? 'cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => !isLoading && setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                } ${isLoading ? 'cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                Registrati
              </button>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <InputField
                  name="full_name"
                  placeholder="Nome completo"
                  icon={User}
                  value={formData.full_name}
                  onChange={handleInputChange}
                  errors={errors}
                  isLoading={isLoading}
                />
              )}

              <InputField
                name="email"
                type="email"
                placeholder="Email"
                icon={Mail}
                value={formData.email}
                onChange={handleInputChange}
                errors={errors}
                isLoading={isLoading}
              />

              <InputField
                name="password"
                placeholder="Password"
                icon={Lock}
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                value={formData.password}
                onChange={handleInputChange}
                errors={errors}
                isLoading={isLoading}
              />

              {!isLogin && (
                <InputField
                  name="confirmPassword"
                  placeholder="Conferma Password"
                  icon={Lock}
                  showPasswordToggle
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  errors={errors}
                  isLoading={isLoading}
                />
              )}

              {!isLogin && (
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptTerms" className="text-gray-600">
                      Accetto i{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                        Termini di Servizio
                      </a>{' '}
                      e la{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                        Privacy Policy
                      </a>
                    </label>
                    {errors.acceptTerms && (
                      <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.acceptTerms}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  )}
                  {isLoading
                    ? isLogin
                      ? 'Accesso in corso...'
                      : 'Registrazione in corso...'
                    : isLogin
                    ? 'Accedi alla Piattaforma'
                    : 'Crea Account Gratuito'}
                </button>
              </div>

              {isLogin && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-500 transition"
                    disabled={isLoading}
                  >
                    Password dimenticata?
                  </button>
                </div>
              )}     
            </form>

            {/* Modal Password Dimenticata */}
            <ForgotPasswordModal 
              show={showForgotPassword} 
              onClose={() => setShowForgotPassword(false)} 
            />

            {/* ✅ Modal Email Non Confermata */}
            <EmailNotConfirmedModal
              show={showEmailNotConfirmed}
              onClose={() => setShowEmailNotConfirmed(false)}
              email={formData.email}
              onResend={handleResendConfirmation}
              isResending={isResending}
            />

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                {isLogin ? 'Non hai un account? ' : 'Hai già un account? '}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                  disabled={isLoading}
                >
                  {isLogin ? 'Registrati gratis' : 'Accedi'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS per l'animazione */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
    </>
  );
};

export default LoginPage;