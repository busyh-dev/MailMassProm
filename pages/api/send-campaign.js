import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function prepareTrackableHtml(html, campaignId, recipient, baseUrl) {
  if (!html) return html;

  let trackableHtml = html;

  // 1. Sostituzione dei link per il tracciamento dei click
  if (campaignId) {
    const hrefRegex = /href=(["'])(http[s]?:\/\/[^"']+)\1/gi;
    trackableHtml = trackableHtml.replace(hrefRegex, (match, quote, originalUrl) => {
      if (originalUrl.includes('/api/track/')) {
        return match;
      }
      const trackingClickUrl = `${baseUrl}/api/track/click?campaign_id=${encodeURIComponent(campaignId)}&recipient=${encodeURIComponent(recipient)}&url=${encodeURIComponent(originalUrl)}`;
      return `href=${quote}${trackingClickUrl}${quote}`;
    });
  }

  // 2. Iniezione del Pixel di Tracciamento per le Aperture (Open Rate)
  if (campaignId) {
    const openPixelUrl = `${baseUrl}/api/track/open?campaign_id=${encodeURIComponent(campaignId)}&recipient=${encodeURIComponent(recipient)}`;
    const pixelTag = `<img src="${openPixelUrl}" width="1" height="1" style="display:none !important; min-height:1px !important; width:1px !important; border:0; margin:0;" alt="" />`;

    if (trackableHtml.includes('</body>')) {
      trackableHtml = trackableHtml.replace('</body>', `${pixelTag}</body>`);
    } else {
      trackableHtml += pixelTag;
    }
  }

  return trackableHtml;
}

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

    // ✅ 1. Crea il record della campagna nel DB per generare l'ID di tracciamento
    let campaignId = null;
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
            status: "sending",
            sent_at: new Date().toISOString(),
            sent_count: 0,
            failed_count: 0,
            opened_count: 0,
            clicked_count: 0,
            bounced_count: 0,
          },
        ])
        .select();

      if (dbError) {
        console.error("⚠️ Errore creazione iniziale campagna nel DB:", dbError);
      } else if (campaignData && campaignData.length > 0) {
        campaignId = campaignData[0].id;
        console.log("✅ Campagna creata nel DB con ID:", campaignId);
      }
    } catch (createErr) {
      console.error("⚠️ Eccezione creazione campagna:", createErr);
    }

    // Calcola il Base URL per il tracciamento
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // Conta successi e fallimenti
    let sent = 0;
    let failed = 0;
    const errors = [];

    console.log('📨 Inizio invio a', to.length, 'destinatari con tracciamento attivo');

    // Invia a ogni destinatario
    for (const recipient of to) {
      try {
        console.log(`📤 Invio a ${recipient}...`);
        
        const trackableHtml = prepareTrackableHtml(html, campaignId, recipient, baseUrl);

        await transporter.sendMail({
          from,
          to: recipient,
          cc: cc || [],
          bcc: bcc || [],
          subject,
          html: trackableHtml,
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

    // ✅ 2. Aggiorna lo stato e i conteggi finali della campagna nel DB
    if (campaignId) {
      try {
        await supabase
          .from("campaigns")
          .update({
            status: "sent",
            sent_count: sent,
            failed_count: failed,
            bounced_count: failed,
          })
          .eq("id", campaignId);

        // ✅ Salva ANCHE in email_logs
        await supabase
          .from("email_logs")
          .insert([
            {
              user_id: user_id,
              campaign_id: campaignId,
              subject: subject,
              sent_at: new Date().toISOString(),
              status: "sent",
              opened_count: 0,
              total_recipients: to.length,
              recipients: to,
              cc: cc || [],
              bcc: bcc || [],
              failed_recipients: errors.length > 0 ? errors : null,
            },
          ]);
      } catch (updateErr) {
        console.error("⚠️ Errore aggiornamento finale campagna:", updateErr);
      }
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