import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function UnsubscribePage() {
  const router = useRouter();
  const { token } = router.query;

  const [status, setStatus] = useState('loading'); // loading | success | already | error | invalid
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!token) return;
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('unsubscribe_tokens')
        .select(`
          *,
          contact:contacts(id, name, email, status)
        `)
        .eq('token', token)
        .single();

      if (error || !data) {
        setStatus('invalid');
        return;
      }

      if (data.used_at) {
        setContactName(data.contact?.name || '');
        setContactEmail(data.contact?.email || '');
        setStatus('already');
        return;
      }

      setContactName(data.contact?.name || '');
      setContactEmail(data.contact?.email || '');
      setStatus('confirm');
    } catch {
      setStatus('error');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setStatus('loading');

      // 1. Recupera il token con il contatto
      const { data: tokenData, error: tokenError } = await supabase
        .from('unsubscribe_tokens')
        .select('*, contact:contacts(id, name, email)')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        setStatus('error');
        return;
      }

      // 2. Aggiorna lo stato del contatto a inactive
      const { error: contactError } = await supabase
        .from('contacts')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.contact_id);

      if (contactError) {
        setStatus('error');
        return;
      }

      // 3. Marca il token come usato
      await supabase
        .from('unsubscribe_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);

      // 4. Salva log disiscrizione
      await supabase
        .from('unsubscribe_logs')
        .insert({
          contact_id: tokenData.contact_id,
          campaign_id: tokenData.campaign_id || null,
          token: token,
          unsubscribed_at: new Date().toISOString(),
          contact_email: tokenData.contact?.email || '',
        })
        .select()
        .maybeSingle();

      setContactName(tokenData.contact?.name || '');
      setContactEmail(tokenData.contact?.email || '');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Head>
        <title>Disiscrizione — MailMassProm</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            background: white;
            border-radius: 20px;
            padding: 48px 40px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            text-align: center;
          }
          .icon { font-size: 56px; margin-bottom: 20px; line-height: 1; }
          h1 { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; }
          .subtitle { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
          .email-badge {
            background: #f3f4f6;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 28px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .email-badge .dot { width: 8px; height: 8px; background: #6b7280; border-radius: 50%; shrink: 0; }
          .email-badge span { font-size: 14px; color: #374151; font-weight: 500; }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 32px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            width: 100%;
            margin-bottom: 12px;
          }
          .btn-red { background: #ef4444; color: white; }
          .btn-red:hover { background: #dc2626; transform: translateY(-1px); }
          .btn-gray { background: #f3f4f6; color: #374151; }
          .btn-gray:hover { background: #e5e7eb; }
          .btn-blue { background: #3b82f6; color: white; }
          .btn-blue:hover { background: #2563eb; }
          .warning {
            background: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #92400e;
            text-align: left;
          }
          .success-check {
            width: 72px; height: 72px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px;
            font-size: 32px;
          }
          .loading-spinner {
            width: 48px; height: 48px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .footer-note {
            margin-top: 24px;
            font-size: 12px;
            color: #9ca3af;
            line-height: 1.5;
          }
          .logo {
            font-size: 13px;
            font-weight: 700;
            color: #6366f1;
            letter-spacing: 0.5px;
            margin-bottom: 32px;
          }
        `}</style>
      </Head>

      <div className="card">
        <div className="logo">✉️ MailMassProm</div>

        {/* LOADING */}
        {status === 'loading' && (
          <>
            <div className="loading-spinner" />
            <h1>Elaborazione...</h1>
            <p className="subtitle">Stiamo elaborando la tua richiesta.</p>
          </>
        )}

        {/* CONFERMA */}
        {status === 'confirm' && (
          <>
            <div className="icon">📧</div>
            <h1>Vuoi disiscriverti?</h1>
            <p className="subtitle">
              Stai per richiedere la disiscrizione dalla nostra lista email.
              Non riceverai più comunicazioni da noi.
            </p>

            {contactEmail && (
              <div className="email-badge">
                <div className="dot" />
                <span>{contactName ? `${contactName} — ` : ''}{contactEmail}</span>
              </div>
            )}

            <div className="warning">
              ⚠️ Questa operazione è irreversibile. Per ricevere nuovamente le nostre comunicazioni dovrai iscriverti di nuovo.
            </div>

            <button className="btn btn-red" onClick={handleUnsubscribe}>
              ✕ Sì, voglio disiscrivermi
            </button>
            <button className="btn btn-gray" onClick={() => window.close()}>
              ← Annulla e torna indietro
            </button>

            <p className="footer-note">
              Ai sensi del GDPR (Reg. UE 679/2016) hai il diritto di opporti al trattamento dei tuoi dati per finalità di marketing diretto.
            </p>
          </>
        )}

        {/* SUCCESSO */}
        {status === 'success' && (
          <>
            <div className="success-check">✓</div>
            <h1>Disiscrizione completata</h1>
            <p className="subtitle">
              {contactName ? `${contactName}, la tua` : 'La tua'} richiesta è stata elaborata con successo.
              {contactEmail && ` L'indirizzo ${contactEmail} è stato rimosso dalla nostra lista.`}
            </p>

            <div className="email-badge">
              <div className="dot" style={{ background: '#10b981' }} />
              <span>{contactEmail || 'Email rimossa dalla lista'}</span>
            </div>

            <button className="btn btn-blue" onClick={() => window.close()}>
              Chiudi questa pagina
            </button>

            <p className="footer-note">
              Se hai effettuato questa operazione per errore, contatta il supporto per essere reiscritto alla lista.
            </p>
          </>
        )}

        {/* GIA DISISCRITTO */}
        {status === 'already' && (
          <>
            <div className="icon">ℹ️</div>
            <h1>Già disiscritto</h1>
            <p className="subtitle">
              {contactEmail ? `L'indirizzo ${contactEmail} è` : 'Questo contatto è'} già stato rimosso dalla nostra lista in precedenza.
            </p>
            <button className="btn btn-gray" onClick={() => window.close()}>
              Chiudi questa pagina
            </button>
          </>
        )}

        {/* TOKEN NON VALIDO */}
        {status === 'invalid' && (
          <>
            <div className="icon">❌</div>
            <h1>Link non valido</h1>
            <p className="subtitle">
              Il link di disiscrizione non è valido o è scaduto.
              Contatta il mittente per ricevere un nuovo link.
            </p>
            <button className="btn btn-gray" onClick={() => window.close()}>
              Chiudi questa pagina
            </button>
          </>
        )}

        {/* ERRORE */}
        {status === 'error' && (
          <>
            <div className="icon">⚠️</div>
            <h1>Si è verificato un errore</h1>
            <p className="subtitle">
              Non è stato possibile elaborare la tua richiesta. Riprova più tardi o contatta il supporto.
            </p>
            <button className="btn btn-red" onClick={validateToken}>
              Riprova
            </button>
            <button className="btn btn-gray" onClick={() => window.close()}>
              Chiudi
            </button>
          </>
        )}
      </div>
    </>
  );
}
