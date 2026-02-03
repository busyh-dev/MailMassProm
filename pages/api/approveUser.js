import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log("🔍 Funzione di approvazione chiamata");
  
  const { email } = req.query;
  console.log("❓ Parametro email ricevuto:", email);
  
  if (!email) {
    console.error("❌ Email mancante");
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Errore - Email mancante</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .icon {
            font-size: 80px;
            margin-bottom: 20px;
          }
          h1 {
            color: #e53e3e;
            font-size: 28px;
            margin-bottom: 15px;
          }
          p {
            color: #718096;
            font-size: 16px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Email Mancante</h1>
          <p>Il parametro email è obbligatorio per completare l'approvazione.</p>
        </div>
      </body>
      </html>
    `);
  }

  const decodedEmail = decodeURIComponent(email);
  console.log("💡 Tentativo di approvazione dell'utente con email:", decodedEmail);

  try {
    console.log("👉 Eseguiamo la query di aggiornamento dello stato");
    console.log("⚡ Connessione a Supabase con URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("🔍 Query di aggiornamento:", { status: "approved", email: decodedEmail });
    
    // 1. Aggiorna lo stato nella tabella "profiles"
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "approved" })
      .eq("email", decodedEmail);
    
    console.log("❓ Log della query:", { data, error });

    if (error) {
      console.error("❌ Errore nell'aggiornamento dello stato:", error);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Errore - Aggiornamento Profilo</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              padding: 60px 40px;
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .icon {
              font-size: 80px;
              margin-bottom: 20px;
            }
            h1 {
              color: #e53e3e;
              font-size: 28px;
              margin-bottom: 15px;
            }
            p {
              color: #718096;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .error-details {
              background: #fff5f5;
              border: 1px solid #feb2b2;
              border-radius: 10px;
              padding: 15px;
              margin-top: 20px;
              color: #c53030;
              font-size: 14px;
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⚠️</div>
            <h1>Errore nell'Approvazione</h1>
            <p>Si è verificato un errore durante l'aggiornamento del profilo.</p>
            <div class="error-details">
              ${error.message}
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // 2. Recupera l'ID dell'utente dalla tabella "profiles"
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", decodedEmail)
      .single();

    if (profileError || !profileData) {
      console.error("❌ Errore nel recupero dell'ID utente:", profileError);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Errore - Utente Non Trovato</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              padding: 60px 40px;
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .icon {
              font-size: 80px;
              margin-bottom: 20px;
            }
            h1 {
              color: #e53e3e;
              font-size: 28px;
              margin-bottom: 15px;
            }
            p {
              color: #718096;
              font-size: 16px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🔍</div>
            <h1>Utente Non Trovato</h1>
            <p>Impossibile recuperare le informazioni dell'utente con l'email fornita.</p>
          </div>
        </body>
        </html>
      `);
    }

    console.log("👤 ID utente recuperato:", profileData.id);

    // 3. Aggiorna l'utente in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.updateUserById(
      profileData.id,
      {
        email_confirm: true
      }
    );

    if (userError) {
      console.error("❌ Errore nell'aggiornamento dell'utente:", userError);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Errore - Aggiornamento Autenticazione</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              padding: 60px 40px;
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .icon {
              font-size: 80px;
              margin-bottom: 20px;
            }
            h1 {
              color: #e53e3e;
              font-size: 28px;
              margin-bottom: 15px;
            }
            p {
              color: #718096;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .error-details {
              background: #fff5f5;
              border: 1px solid #feb2b2;
              border-radius: 10px;
              padding: 15px;
              margin-top: 20px;
              color: #c53030;
              font-size: 14px;
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🔐</div>
            <h1>Errore Autenticazione</h1>
            <p>Si è verificato un errore durante l'aggiornamento dei dati di autenticazione.</p>
            <div class="error-details">
              ${userError.message}
            </div>
          </div>
        </body>
        </html>
      `);
    }

    console.log("✅ Utente aggiornato con successo:", userData);

    // ✅ Risposta di successo
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approvato</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: slideIn 0.5s ease-out;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: bounce 1s ease infinite;
          }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          h1 {
            color: #38a169;
            font-size: 32px;
            margin-bottom: 15px;
            font-weight: 700;
          }
          p {
            color: #718096;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .email {
            background: #f7fafc;
            border-radius: 10px;
            padding: 15px;
            color: #2d3748;
            font-weight: 600;
            margin-bottom: 30px;
            word-break: break-word;
          }
          .info {
            background: #e6fffa;
            border-left: 4px solid #38b2ac;
            border-radius: 8px;
            padding: 20px;
            text-align: left;
            color: #234e52;
            font-size: 14px;
            line-height: 1.8;
          }
          .info-title {
            font-weight: 700;
            margin-bottom: 10px;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Account Approvato con Successo!</h1>
          <p>L'account è stato approvato e l'email è stata confermata.</p>
          <div class="email">${decodedEmail}</div>
          <div class="info">
            <div class="info-title">✨ Cosa succede ora?</div>
            L'utente può ora accedere alla piattaforma con tutte le funzionalità abilitate. L'email è stata verificata e l'account è completamente attivo.
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (err) {
    console.error("❌ Errore imprevisto:", err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Errore Imprevisto</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .icon {
            font-size: 80px;
            margin-bottom: 20px;
          }
          h1 {
            color: #e53e3e;
            font-size: 28px;
            margin-bottom: 15px;
          }
          p {
            color: #718096;
            font-size: 16px;
            line-height: 1.6;
          }
          .support {
            margin-top: 30px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 10px;
            color: #4a5568;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">💥</div>
          <h1>Errore Imprevisto</h1>
          <p>Si è verificato un errore imprevisto durante l'elaborazione della richiesta.</p>
          <div class="support">
            <strong>Necessiti assistenza?</strong><br>
            Contatta il supporto tecnico per risolvere il problema.
          </div>
        </div>
      </body>
      </html>
    `);
  }
}