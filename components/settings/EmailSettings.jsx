import React, { useState, useEffect } from "react";
import { Key, Mail, Trash2, Plus, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";


const EmailSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({ name: "", email: "" });
  const [defaultSender, setDefaultSender] = useState(null);
  const [testing, setTesting] = useState(false);
  const [selectedSender, setSelectedSender] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showConnectionToast, setShowConnectionToast] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [apiKeyTypeWarning, setApiKeyTypeWarning] = useState(null);
  const [isTestKey, setIsTestKey] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(null);
  const { user, loading } = useAuth();
  const [updatingEmail, setUpdatingEmail] = useState(null);
  const [editingSmtp, setEditingSmtp] = useState(null); // email dell'account in modifica
  const [smtpUsername, setSmtpUsername] = useState(""); // ✅ AGGIUNGI QUESTO
const [smtpPassword, setSmtpPassword] = useState("");

  // Carica configurazione da localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem("resendApiKey") || "";
    const savedAccounts = JSON.parse(localStorage.getItem("emailAccounts") || "[]");
    const savedDefault = localStorage.getItem("defaultSender");
  
    setApiKey(savedApiKey);
    setAccounts(savedAccounts);
    setDefaultSender(savedDefault);
  
    if (savedApiKey.startsWith("test_")) {
      setIsTestKey(true);
      toast("⚠️ Chiave di test rilevata: alcune funzioni sono disabilitate.", {
        icon: "🔒",
        duration: 4000,
      });
    } else {
      setIsTestKey(false);
    }
  }, []);


  useEffect(() => {
    if (loading) return; // aspetta che AuthContext finisca di caricare
  
    if (!user?.id) {
      console.warn("⏳ Nessun utente loggato, caricamento mittenti saltato.");
      toast.error("⚠️ Devi effettuare l'accesso per vedere i tuoi mittenti.");
      return;
    }
  
    const loadAccountsFromDB = async () => {
      try {
        console.log('📡 Fetching from:', '/api/email-accounts'); // ← Aggiungi questo log
        const res = await fetch(`/api/email-accounts/get?user_id=${user.id}`);
        const text = await res.text();
  
        let result;
        try {
          result = JSON.parse(text);
        } catch {
          console.error("❌ Risposta non JSON:", text);
          throw new Error("La risposta dell'API non è JSON valida (verifica percorso /api).");
        }
  
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Errore durante il caricamento dei mittenti.");
        }
  
        setAccounts(result.data);
        localStorage.setItem("emailAccounts", JSON.stringify(result.data));
  
        toast.success("✅ Mittenti caricati dal database.");
      } catch (err) {
        console.error("💥 Errore caricamento mittenti:", err);
        toast.error(`❌ ${err.message}`);
      }
    };
  
    loadAccountsFromDB();
  }, [user?.id, loading]);
  
  

  // 💾 Salvataggio configurazione
  const saveSettings = async () => {
    if (!user?.id) {
      toast.error("⚠️ Devi essere loggato per salvare la configurazione.");
      return;
    }
    if (!apiKey || apiKey.trim().length < 10) {
      toast.error("⚠️ Inserisci una chiave API valida prima di salvare.");
      return;
    }
  
    if (apiKey.startsWith("test_")) {
      toast.error("🚫 Non puoi usare una chiave di test. Inserisci una chiave 'live_' per procedere.");
      return;
    }
  
    if (accounts.length === 0) {
      toast.error("⚠️ Aggiungi almeno un mittente prima di salvare.");
      return;
    }
  
    try {
      const res = await fetch("/api/email-accounts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accounts,
          user_id: user?.id,
        }),
      });
  
      const result = await res.json();
  
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Errore nel salvataggio.");
      }
  
      localStorage.setItem("resendApiKey", apiKey);
      localStorage.setItem("emailAccounts", JSON.stringify(accounts));
      localStorage.setItem("defaultSender", defaultSender || "");
  
      toast.success("✅ Configurazione salvata nel database!");
    } catch (err) {
      console.error("💥 Errore salvataggio:", err);
      toast.error(`❌ ${err.message}`);
    }
  };
  

  // 🔄 Verifica singolo mittente - versione finale con gestione toast uniforme
const verifySingleSender = async (email) => {
  if (!apiKey) {
    toast.error("⚠️ Inserisci una chiave API prima di verificare.");
    return;
  }

  if (isTestKey) {
    toast.error("🚫 Non puoi verificare mittenti con una chiave di test.");
    return;
  }

  setVerifyingEmail(email);
  console.groupCollapsed(`🔍 Verifica dominio per ${email}`);
  console.log("🔑 API key:", apiKey.substring(0, 8) + "********");
  console.log("📤 Invio richiesta a /api/resend/verify...");

  try {
    const res = await fetch("/api/resend/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    console.log("📡 Stato risposta:", res.status);
    const textResponse = await res.text();
    console.log("📦 Risposta RAW:", textResponse);

    let result;
    try {
      result = JSON.parse(textResponse);
      console.log("✅ JSON interpretato:", result);
    } catch (parseError) {
      console.error("❌ Errore parsing JSON:", parseError);
      toast.error("❌ Risposta API non valida o corrotta.");
      return;
    }

    // 🔴 Gestione errori chiara e coerente
    if (!result.success) {
      console.error("❌ Verifica fallita:", result);

      let icon = "⚠️";
      if (result.code === "INVALID_API_KEY") icon = "🔑";
      else if (result.code === "FORBIDDEN") icon = "🚫";
      else if (result.code === "NETWORK_ERROR") icon = "🌐";

      toast.error(`${icon} ${result.message || "Errore durante la verifica del dominio."}`);
      return;
    }

    // ✅ Se la risposta è positiva
    const domains = result.data || [];
    const senderDomain = email.split("@")[1];
    const domainInfo = domains.find((d) => d.name === senderDomain);

    console.log("🌐 Domini ricevuti:", domains);
    console.log("📋 Dominio corrispondente:", domainInfo);

    // Aggiorna solo l’account corrispondente
    const updatedAccounts = accounts.map((acc) => {
      if (acc.email === email) {
        const records = domainInfo?.records || [];
        const dkimRecord = records.find((r) => r.record === "DKIM");
        const spfRecord = records.find((r) => r.record === "SPF");

        const updated = {
          ...acc,
          verified: domainInfo?.status === "verified",
          dkimStatus: dkimRecord?.status || "unknown",
          spfStatus: spfRecord?.status || "unknown",
        };

        console.log("✏️ Account aggiornato:", updated);
        return updated;
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    localStorage.setItem("emailAccounts", JSON.stringify(updatedAccounts));

    // 🎯 Mostra il toast appropriato
    if (domainInfo?.status === "verified") {
      toast.success(`✅ ${email} verificato correttamente!`);
    } else {
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg shadow-md font-medium border border-yellow-300`}
        >
          ⚠️ {email} non è ancora verificato. Controlla i record DNS.
        </div>
      ));
    }
  } catch (err) {
    console.error("💥 Errore completo:", err);
    toast.error(`❌ ${err.message || "Errore imprevisto durante la verifica."}`);
  } finally {
    console.groupEnd();
    setVerifyingEmail(null);
  }
};


const refreshDomainStatus = async (email) => {
  if (!apiKey) {
    toast.error("⚠️ Inserisci la chiave API prima di aggiornare lo stato.");
    return;
  }

  const domain = email.split("@")[1];

  try {
    const res = await fetch("/api/resend/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    const info = result.data.find((d) => d.name === domain);
    if (!info) {
      toast.error("❌ Dominio non trovato in Resend.");
      return;
    }

    const records = info.records || [];
    const dkim = records.find((r) => r.record === "DKIM");
    const spf = records.find((r) => r.record === "SPF");

    const updated = accounts.map((a) =>
      a.email === email
        ? {
            ...a,
            verified: info.status === "verified",
            dkimStatus: dkim?.status || "unknown",
            spfStatus: spf?.status || "unknown",
          }
        : a
    );

    setAccounts(updated);
    localStorage.setItem("emailAccounts", JSON.stringify(updated));

    toast.success(`🔄 Stato aggiornato per ${email}`);
  } catch (err) {
    toast.error(`❌ ${err.message}`);
  }
};


// 🔁 Aggiorna un singolo mittente nel database
const updateSingleAccount = async (email, updatedAccount = null) => {
  if (!user?.id) {
    toast.error("⚠️ Devi essere loggato per aggiornare.");
    return;
  }

  const account = updatedAccount || accounts.find((a) => a.email === email);
  if (!account) {
    toast.error("❌ Mittente non trovato.");
    return;
  }

  try {
    const res = await fetch("/api/email-accounts/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        account, // ✅ ora invia i dati aggiornati
      }),
    });

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error("❌ Risposta non JSON:", text);
      throw new Error("Risposta API non valida (non JSON).");
    }

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Errore durante l'aggiornamento.");
    }

    toast.success(`✅ ${account.email} aggiornato correttamente.`);
  } catch (err) {
    console.error("💥 Errore update singolo:", err);
    toast.error(`❌ ${err.message}`);
  }
};
// 🔄 Aggiorna lo stato DKIM/SPF dal dominio su Resend
const refreshSenderStatus = async (email) => {
  if (!apiKey) {
    toast.error("⚠️ Inserisci una chiave API valida prima di aggiornare lo stato.");
    return;
  }

  if (apiKey.startsWith("test_")) {
    toast.error("🚫 Le chiavi di test non possono verificare domini.");
    return;
  }

  const senderDomain = email.split("@")[1];
  setVerifyingEmail(email);
  console.log(`🌍 Aggiornamento stato dominio: ${senderDomain}`);

  try {
    const res = await fetch("/api/resend/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Errore durante la verifica.");
    }

    const domains = result.data || [];
    const domainInfo = domains.find((d) => d.name === senderDomain);

    if (!domainInfo) {
      toast.error(`❌ Dominio ${senderDomain} non trovato su Resend.`);
      return;
    }

    const records = domainInfo.records || [];

    const dkimRecord = records.find((r) => r.record === "DKIM");
    const spfRecord = records.find((r) => r.record === "SPF");
    
    // Se il dominio è verified ma non ha records → segna DKIM/SPF come valid
    const dkimStatus =
      dkimRecord?.status || (domainInfo.status === "verified" ? "valid" : "unknown");
    const spfStatus =
      spfRecord?.status || (domainInfo.status === "verified" ? "valid" : "unknown");
    
    // ✅ Crea l’oggetto aggiornato
    const updatedAccount = {
      ...accounts.find((a) => a.email === email),
      verified: domainInfo.status === "verified",
      dkimStatus,
      spfStatus,
    };
    
    // ✅ Aggiorna in memoria
    const updatedAccounts = accounts.map((a) =>
      a.email === email ? updatedAccount : a
    );
    setAccounts(updatedAccounts);
    localStorage.setItem("emailAccounts", JSON.stringify(updatedAccounts));
    
    // ✅ Salva nel DB con i dati aggiornati
    await updateSingleAccount(email, updatedAccount);

    if (domainInfo.status === "verified") {
      toast.success(`✅ Dominio ${senderDomain} verificato con successo!`);
    } else {
      toast(`⚠️ Dominio ${senderDomain} non ancora verificato.`, { icon: "🕓" });
    }
  } catch (err) {
    console.error("💥 Errore refreshSenderStatus:", err);
    toast.error(`❌ ${err.message}`);
  } finally {
    setVerifyingEmail(null);
  }
};



  // 🔄 Verifica manuale di tutti i mittenti
  const handleManualVerification = async () => {
    if (!apiKey || accounts.length === 0) {
      toast.error("⚠️ Inserisci una chiave API e almeno un mittente prima di verificare.");
      return;
    }

    if (isTestKey) {
      toast.error("🚫 Non puoi verificare con una chiave di test.");
      return;
    }
  
    setIsVerifying(true);
    setVerifyStatus(null);
    console.log("🔄 Verifica tutti i mittenti...");
  
    try {
      const res = await fetch("/api/resend/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
  
      console.log("📡 Status risposta (verifica tutti):", res.status);

      const textResponse = await res.text();
      console.log("📦 Risposta raw (verifica tutti):", textResponse);

      let result;
      try {
        result = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("❌ Errore parsing JSON:", parseError);
        throw new Error("Risposta API non valida");
      }

      if (!result.success) {
        console.error("❌ Verifica fallita:", result);
        toast.error(`❌ ${result.message || "Errore durante la verifica del dominio."}`);
        return; // ❗️Blocca qui la funzione
      }
      const domains = result.data || [];
      console.log("🌐 Domini ricevuti:", domains);
  
      const updatedAccounts = accounts.map((acc) => {
        const senderDomain = acc.email.split("@")[1];
        const domainInfo = domains.find((d) => d.name === senderDomain);
  
        const records = domainInfo?.records || [];
        const dkimRecord = records.find(r => r.record === "DKIM");
        const spfRecord = records.find(r => r.record === "SPF");
  
        return {
          ...acc,
          verified: domainInfo?.status === "verified",
          dkimStatus: dkimRecord?.status || "unknown",
          spfStatus: spfRecord?.status || "unknown",
        };
      });
  
      setAccounts(updatedAccounts);
      localStorage.setItem("emailAccounts", JSON.stringify(updatedAccounts));
  
      setVerifyStatus({
        type: "success",
        message: "✅ Tutti i domini sono stati verificati correttamente!",
      });
  
      setTimeout(() => setVerifyStatus(null), 3000);
    } catch (err) {
      console.error("💥 Errore verifica tutti:", err);
      setVerifyStatus({
        type: "error",
        message: `❌ Errore: ${err.message}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // ➕ Aggiungi nuovo account

const addAccount = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!newAccount.name.trim() || !newAccount.email.trim()) {
    toast.error("⚠️ Inserisci sia il nome che l'indirizzo email del mittente.");
    return;
  }

  if (!emailRegex.test(newAccount.email)) {
    toast.error("❌ L'indirizzo email inserito non è valido.");
    return;
  }

  if (accounts.some(acc => acc.email === newAccount.email)) {
    toast.error("⚠️ Questo indirizzo email è già presente tra i mittenti.");
    return;
  }

  // ✅ AGGIUNGI CONFIGURAZIONE SMTP PREDEFINITA
  const accountWithSmtp = {
    ...newAccount,
    provider: "resend", // Cambiato da "brevo" a "resend"
    smtp: {
      host: "smtp.resend.com",  // Host SMTP per Resend
      port: 587,               // Porta SMTP per Resend
      user: newAccount.email,  // L'email mittente per il login SMTP
      pass: "",                // Lascia vuoto, l'utente dovrà inserire la password SMTP
      secure: false            // Impostazione di sicurezza (false per non utilizzare TLS/SSL)
    },
    verified: false,
    dkimStatus: "unknown",
    spfStatus: "unknown"
  };
  // const accountWithSmtp = {
  //   ...newAccount,
  //   provider: "brevo", // o "smtp"
  //   smtp: {
  //     host: "smtp-relay.brevo.com",
  //     port: 587,
  //     user: newAccount.email,
  //     pass: "", // ← Vuoto, l'utente dovrà inserirlo
  //     secure: false
  //   },
  //   verified: false,
  //   dkimStatus: "unknown",
  //   spfStatus: "unknown"
  // };

  const updated = [...accounts, accountWithSmtp];
  setAccounts(updated);
  setNewAccount({ name: "", email: "" });
  localStorage.setItem("emailAccounts", JSON.stringify(updated));

  setShowSuccessToast(true);
  setTimeout(() => setShowSuccessToast(false), 2500);
  
  toast("⚠️ Ricorda di configurare la password SMTP nelle impostazioni!", {
    icon: "🔑",
    duration: 4000
  });
};
  // 🗑️ Rimuovi account
  const removeAccount = (email) => {
    const updated = accounts.filter(acc => acc.email !== email);
    setAccounts(updated);
    localStorage.setItem("emailAccounts", JSON.stringify(updated));
    
    if (defaultSender === email) {
      setDefaultSender(null);
      localStorage.removeItem("defaultSender");
    }
    
    toast.success("🗑️ Mittente rimosso");
  };

  // ✅ Verifica automatica domini al caricamento - DISABILITATA PER DEBUG
  useEffect(() => {
    // Commentiamo temporaneamente per debug
    // const verifyAllDomains = async () => { ... };
    // verifyAllDomains();
    
    console.log("ℹ️ Verifica automatica disabilitata per debug");
  }, [apiKey, accounts.length, isTestKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        Caricamento in corso...
      </div>
    );
  }
  
// 🎨 Helper: ritorna badge colorato per stato DKIM/SPF
const getStatusBadge = (type, status) => {
  let color = "text-gray-500";
  let label = "In attesa";
  let icon = "🟡";

  switch (status) {
    case "valid":
      color = "text-green-600";
      label = "Valido";
      icon = "🟢";
      break;
    case "invalid":
      color = "text-red-600";
      label = "Non valido";
      icon = "🔴";
      break;
    case "unknown":
      color = "text-gray-500";
      label = "In attesa";
      icon = "🟡";
      break;
    default:
      color = "text-gray-400";
      label = "Sconosciuto";
      icon = "⚪";
  }

  return (
    <span className={`flex items-center gap-1 text-sm ${color}`}>
      <span className="font-medium">{icon} {type}:</span> {label}
    </span>
  );
};

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ⚙️ Configurazione Email (Resend)
      </h2>
      
      {isTestKey && (
        <div className="mb-4 px-4 py-3 bg-yellow-50 text-yellow-800 border border-yellow-300 rounded-lg flex items-center gap-2 shadow-sm">
          ⚠️ <strong>Chiave di test attiva:</strong> alcune funzioni (verifica domini, invii reali) non saranno disponibili.
        </div>
      )}

      {/* Debug Info */}
      <div className="mb-4 px-4 py-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-sm">
        <strong>🔍 Debug Mode:</strong> Controlla la console del browser (F12) per log dettagliati
      </div>

      {/* 🔄 Stato Verifica Domini */}
      {isVerifying && (
        <div className="mb-4 px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg flex items-center gap-2 animate-pulse">
          <svg
            className="animate-spin h-5 w-5 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span>Verifica automatica domini in corso...</span>
        </div>
      )}

      {verifyStatus && !isVerifying && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-500 ${
            verifyStatus.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {verifyStatus.type === "success" ? "✅" : "⚠️"} {verifyStatus.message}
        </div>
      )}

      {/* 🔑 API KEY */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🔑 Chiave API Resend
        </label>
        <div className="relative">
          <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              const value = e.target.value.trim();
              setApiKey(value);
              console.log("🔑 Chiave API aggiornata:", value.substring(0, 10) + "...");
            
              if (value.startsWith("test_")) {
                setIsTestKey(true);
                setApiKeyTypeWarning("⚠️ Stai usando una chiave di test. Usa una chiave 'live_' per verificare i domini.");
              } else if (value && !value.startsWith("re_") && !value.startsWith("live_")) {
                setIsTestKey(false);
                setApiKeyTypeWarning("⚠️ Il formato della chiave non sembra corretto. Deve iniziare con 'live_' o 're_'.");
              } else {
                setIsTestKey(false);
                setApiKeyTypeWarning(null);
              }
            }}
            placeholder="Inserisci la tua API key..."
            className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 outline-none ${
              apiKeyTypeWarning
                ? "border-yellow-400 focus:ring-yellow-300"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {apiKeyTypeWarning && (
            <p className="mt-2 text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              ⚠️ {apiKeyTypeWarning}
            </p>
          )}
        </div>
      </div>

      {/* 📧 GESTIONE ACCOUNT */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Mittenti autorizzati
        </h3>

        {accounts.length > 0 ? (
  <ul className="space-y-3">
    {accounts.map((a) => (
      <li
        key={a.email}
        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition"
      >
        <div className="flex-1">
          <p className="font-medium text-gray-900 flex items-center gap-2">
            {a.name}
            {a.verified ? (
              <span className="text-green-600 text-xs flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Verificato
              </span>
            ) : (
              <span className="text-yellow-600 text-xs flex items-center gap-1">
                ⚠️ Non verificato
              </span>
            )}
            {/* Badge SMTP configurato */}
            {a.smtp?.pass ? (
              <span className="text-blue-600 text-xs flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                🔐 SMTP OK
              </span>
            ) : (
              <span className="text-orange-600 text-xs flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
                🔑 SMTP da configurare
              </span>
            )}
          </p>
          <p className="text-sm text-gray-600">{a.email}</p>
          
          {/* Stato DKIM e SPF */}
          <div className="mt-2 flex items-center gap-3">
            <span className={`text-sm ${a.dkimStatus === "valid"
                ? "text-green-600"
                : a.dkimStatus === "invalid"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}>
              <span className="font-semibold">🔵 DKIM:</span> {
                a.dkimStatus === "valid"
                  ? "Valido"
                  : a.dkimStatus === "invalid"
                    ? "Non valido"
                    : "In attesa"
              }
            </span>
            <span className={`text-sm ${a.spfStatus === "valid"
                ? "text-green-600"
                : a.spfStatus === "invalid"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}>
              <span className="font-semibold">🔵 SPF:</span> {
                a.spfStatus === "valid"
                  ? "Valido"
                  : a.spfStatus === "invalid"
                    ? "Non valido"
                    : "In attesa"
              }
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ NUOVO: Bottone Configura SMTP */}
          <button
            onClick={() => {
              setEditingSmtp(a.email);
              setSmtpUsername(a.smtp?.user || "9de7f6001@smtp-brevo.com"); // ✅ Precarica username
              setSmtpPassword(a.smtp?.pass || "");
            }}
            className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition flex items-center gap-1 text-sm"
            title="Configura credenziali SMTP"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">SMTP</span>
          </button>

          {/* Resto dei bottoni come prima */}
          <button
            onClick={() => refreshSenderStatus(a.email)}
            disabled={verifyingEmail === a.email || isTestKey}
            className={`p-2 rounded-lg text-sm flex items-center gap-1 transition ${verifyingEmail === a.email
                ? "bg-blue-100 text-blue-600 cursor-wait"
                : "bg-blue-50 hover:bg-blue-100 text-blue-600"
              }`}
          >
            {verifyingEmail === a.email ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Aggiorna...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Aggiorna stato</span>
              </>
            )}
          </button>

          <button
            onClick={() => verifySingleSender(a.email)}
            disabled={verifyingEmail === a.email || isTestKey}
            className={`p-2 rounded-lg transition flex items-center gap-1 text-sm ${
              verifyingEmail === a.email
                ? "bg-blue-100 text-blue-600 cursor-wait"
                : isTestKey
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-50 hover:bg-blue-100 text-blue-600"
            }`}
          >
            {verifyingEmail === a.email ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Verifica...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Verifica</span>
              </>
            )}
          </button>

          {defaultSender === a.email ? (
            <span className="text-green-600 flex items-center gap-1 text-sm px-2 py-1">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Predefinito</span>
            </span>
          ) : (
            <button
              onClick={() => {
                const updated = accounts.map((acc) => ({
                  ...acc,
                  is_default: acc.email === a.email,
                }));
                setAccounts(updated);
                localStorage.setItem("emailAccounts", JSON.stringify(updated));
                setDefaultSender(a.email);
                localStorage.setItem("defaultSender", a.email);
                updateSingleAccount(a.email, { ...a, is_default: true });
                toast.success("✅ Mittente predefinito aggiornato!");
              }}
              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
            >
              Imposta
            </button>
          )}

          <button
            onClick={() => removeAccount(a.email)}
            className="text-red-500 hover:text-red-700 p-2"
            title="Elimina mittente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </li>
    ))}
  </ul>
) : (
  <p className="text-gray-500 text-sm italic">Nessun mittente aggiunto.</p>
)}
        

        {/* ➕ Aggiungi nuovo mittente */}
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Nome mittente (es. Promoter Marketing)"
              value={newAccount.name}
              onChange={(e) => {
                const value = e.target.value;
                setNewAccount((prev) => ({ ...prev, name: value }));
                setNameError(value.trim() === "" ? "Il nome è obbligatorio." : "");
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition ${
                nameError ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {nameError && <p className="text-red-600 text-sm mt-1">{nameError}</p>}
          </div>

          <div className="flex-1">
            <input
              type="email"
              placeholder="Email mittente"
              value={newAccount.email}
              onChange={(e) => {
                const value = e.target.value;
                setNewAccount((prev) => ({ ...prev, email: value }));
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value.trim() === "") setEmailError("L'indirizzo email è obbligatorio.");
                else if (!emailRegex.test(value)) setEmailError("Inserisci un indirizzo email valido.");
                else setEmailError("");
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition ${
                emailError ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {emailError && <p className="text-red-600 text-sm mt-1">{emailError}</p>}
          </div>

          <button
            onClick={() => {
              addAccount();
              setShowAddSuccess(true);
              setTimeout(() => setShowAddSuccess(false), 2000);
            }}
            disabled={
              !newAccount.name.trim() ||
              !newAccount.email.trim() ||
              !!emailError ||
              !!nameError
            }
            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition font-medium ${
              !newAccount.name.trim() ||
              !newAccount.email.trim() ||
              !!emailError ||
              !!nameError
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
            }`}
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>

        {showAddSuccess && (
          <div className="mt-3 text-green-600 text-sm flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4" />
            Mittente aggiunto correttamente
          </div>
        )}
      </div>

      {/* 💾 Azioni Configurazione */}
      <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={saveSettings}
          disabled={isTestKey}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 ${
            isTestKey
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {isTestKey ? "Chiave di test (bloccato)" : "Salva Configurazione"}
        </button>
{/* 🔐 Modal Configurazione SMTP */}
{/* 🔐 Modal Configurazione SMTP */}
{editingSmtp && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Key className="w-5 h-5 text-purple-600" />
        Configura SMTP per {editingSmtp}
      </h3>

      <div className="space-y-3">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Host SMTP
    </label>
    <input
      type="text"
      defaultValue="smtp.resend.com" // Cambiato da "smtp-relay.brevo.com" a "smtp.resend.com"
      readOnly
      className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Porta
    </label>
    <input
      type="number"
      defaultValue="465" // Porta per Resend (587 è comune per TLS)
      readOnly
      className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Username SMTP (Login Resend)
    </label>
    <input
      type="text"
      defaultValue="resend" // Cambiato per Resend
      readOnly
      className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
    />
    <p className="text-xs text-gray-500 mt-1">
      💡 Questo è il tuo login SMTP di Resend (diverso dall'email mittente)
    </p>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Password SMTP *
    </label>
    <input
      type="password"
      value={smtpPassword}
      onChange={(e) => setSmtpPassword(e.target.value)}
      placeholder="Inserisci la chiave SMTP da Resend"
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
    />
    <p className="text-xs text-gray-500 mt-1">
      💡 Copia la chiave SMTP completa da Resend → Impostazioni → SMTP & API
    </p>
  </div>
</div>


      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={() => {
            setEditingSmtp(null);
            setSmtpPassword("");
          }}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Annulla
        </button>
        <button
          onClick={async () => {
            if (!smtpPassword.trim()) {
              toast.error("⚠️ Inserisci la password SMTP");
              return;
            }

            // Aggiorna account con password SMTP
            const updatedAccounts = accounts.map(acc => {
              if (acc.email === editingSmtp) {
                return {
                  ...acc,
                  provider: "resend",
                  smtp: {
                    host: "smtp.resend.com",
                    port: 465,
                    user: "resend",
                    pass: smtpPassword,
                    secure: false
                  }
                };
              }
              return acc;
            });

            setAccounts(updatedAccounts);
            localStorage.setItem("emailAccounts", JSON.stringify(updatedAccounts));

            // Salva nel database
            const accountToUpdate = updatedAccounts.find(a => a.email === editingSmtp);
            await updateSingleAccount(editingSmtp, accountToUpdate);

            toast.success("✅ Password SMTP salvata!");
            setEditingSmtp(null);
            setSmtpPassword("");
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Salva
        </button>
      </div>
    </div>
  </div>
)}
        <button
          onClick={handleManualVerification}
          disabled={isVerifying || isTestKey}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 ${
            isVerifying || isTestKey
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-5 h-5 ${isVerifying ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582M20 20v-5h-.581M5 19a9 9 0 0014 0M19 5a9 9 0 00-14 0"
            />
          </svg>
          {isTestKey
            ? "Verifica disabilitata (test key)"
            : isVerifying
            ? "Verifica in corso..."
            : "Verifica tutti ora"}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        🔒 I dati vengono salvati solo nel tuo browser e non vengono inviati a server esterni.
      </p>

      {/* ✅ Toast Successo */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slideIn z-50">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Mittente aggiunto correttamente</span>
        </div>
      )}
    </div>
  );
};

export default EmailSettings;