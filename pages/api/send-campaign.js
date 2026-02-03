import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('🟢 API /send-campaign called');
  
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      message: "Metodo non consentito" 
    });
  }

  const { from, to, cc, bcc, subject, html, attachments, smtp, user_id } = req.body;

  console.log('📥 Payload ricevuto:', {
    from,
    to: to?.length || 0,
    cc: cc?.length || 0,
    bcc: bcc?.length || 0,
    subject,
    smtp: smtp ? 'presente' : 'mancante',
    attachments: attachments?.length || 0,
    user_id: user_id || 'mancante'
  });

  // Validazione
  if (!from || !to || to.length === 0 || !subject || !html) {
    return res.status(400).json({
      success: false,
      message: "Parametri mancanti: from, to, subject, html sono obbligatori",
    });
  }

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id mancante",
    });
  }

  if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
    return res.status(400).json({
      success: false,
      message: "Configurazione SMTP mancante o incompleta",
    });
  }

  try {
    console.log('🔧 Configurazione transporter...');
    
    // Crea transporter con le credenziali SMTP fornite
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port || 587,
      secure: smtp.secure || false,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    console.log('✅ Transporter creato');

    // Prepara gli allegati
    const emailAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      encoding: "base64",
    })) || [];

    console.log('📎 Allegati preparati:', emailAttachments.length);

    // Conta successi e fallimenti
    let sent = 0;
    let failed = 0;
    const errors = [];

    console.log('📨 Inizio invio a', to.length, 'destinatari');

    // Invia a ogni destinatario
    for (const recipient of to) {
      try {
        console.log(`📤 Invio a ${recipient}...`);
        
        await transporter.sendMail({
          from,
          to: recipient,
          cc: cc || [],
          bcc: bcc || [],
          subject,
          html,
          attachments: emailAttachments,
        });

        sent++;
        console.log(`✅ Inviata a ${recipient}`);
      } catch (err) {
        failed++;
        console.error(`❌ Errore invio a ${recipient}:`, err.message);
        errors.push({ email: recipient, error: err.message });
      }
    }

    console.log('📊 Risultato finale:', { sent, failed });

    // ✅ Salva la campagna nel database
    try {
      const { data: campaignData, error: dbError } = await supabase
        .from("campaigns")
        .insert([
          {
            user_id: user_id,
            name: subject,
            subject,
            html_content: html,
            sender_email: from,
            recipients: to,
            cc: cc || [],
            bcc: bcc || [],
            status: "sent",
            sent_at: new Date().toISOString(),
            sent_count: sent,
            failed_count: failed,
          },
        ])
        .select();

      if (dbError) {
        console.error("⚠️ Errore salvataggio campagna:", dbError);
      } else {
        console.log("✅ Campagna salvata nel DB:", campaignData);
        
        // ✅ Salva ANCHE in email_logs per avere una tabella dedicata ai log
        if (campaignData && campaignData.length > 0) {
          const campaignId = campaignData[0].id;
          
          const { error: logError } = await supabase
            .from("email_logs")
            .insert([
              {
                user_id: user_id,
                campaign_id: campaignId,
                subject: subject,
                sent_at: new Date().toISOString(),
                status: "sent",
                opened_count: 0, // Da aggiornare con tracking aperture
                total_recipients: to.length,
                recipients: to,
                cc: cc || [],
                bcc: bcc || [],
                failed_recipients: errors.length > 0 ? errors : null,
              },
            ]);
          
          if (logError) {
            console.error("⚠️ Errore salvataggio log:", logError);
          } else {
            console.log("✅ Log salvato in email_logs");
          }
        }
      }
    } catch (dbErr) {
      console.error("⚠️ Errore database:", dbErr);
    }

    return res.status(200).json({
      success: true,
      message: `Email inviate: ${sent}/${to.length}`,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err) {
    console.error("💥 Errore generale:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Errore durante l'invio delle email",
    });
  }
}