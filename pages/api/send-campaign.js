import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { matchAttachmentsForContact } from "../../lib/matchAttachments";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
};

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

  const {
    from,
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,
    smtp,
    user_id,
    contacts,
    dynamicAttachments,
    matchMode,
    campaign_id
  } = req.body;

  console.log('📥 Payload ricevuto:', {
    from,
    to: to?.length || 0,
    cc: cc?.length || 0,
    bcc: bcc?.length || 0,
    subject,
    smtp: smtp ? 'presente' : 'mancante',
    attachments: attachments?.length || 0,
    dynamicAttachments: !!dynamicAttachments,
    matchMode: matchMode || 'auto',
    campaign_id: campaign_id || 'mancante',
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

    // Recupera allegati: dal payload o direttamente dal DB se campaign_id è specificato
    let rawAttachments = Array.isArray(attachments) ? attachments : [];
    let isDynamic = dynamicAttachments;
    let effectiveMatchMode = matchMode || 'auto';

    if (rawAttachments.length === 0 && campaign_id) {
      try {
        console.log(`🔍 Recupero allegati per campagna ${campaign_id} da database...`);
        const { data: dbCamp, error: campErr } = await supabase
          .from('campaigns')
          .select('attachments, tags')
          .eq('id', campaign_id)
          .maybeSingle();
        
        if (!campErr && dbCamp?.attachments) {
          rawAttachments = Array.isArray(dbCamp.attachments)
            ? dbCamp.attachments
            : JSON.parse(dbCamp.attachments || '[]');
          console.log(`📎 Recuperati ${rawAttachments.length} allegati dal database.`);
          
          let dbTags = dbCamp.tags;
          if (typeof dbTags === 'string') {
            try { dbTags = JSON.parse(dbTags); } catch { dbTags = dbTags ? [dbTags] : []; }
          }
          if (Array.isArray(dbTags)) {
            if (isDynamic === undefined && (dbTags.includes('dyn_att:true') || dbTags.includes('dynamic_attachments'))) {
              isDynamic = true;
            }
            const mm = dbTags.find(t => String(t).startsWith('match_mode:'));
            if (mm) {
              effectiveMatchMode = mm.replace('match_mode:', '');
            }
          }
        }
      } catch (dbAttErr) {
        console.warn('⚠️ Impossibile recuperare allegati dal DB:', dbAttErr.message);
      }
    }

    // Prepara gli allegati validi (esclude oggetti senza content o path)
    const emailAttachments = (rawAttachments || [])
      .filter((att) => att && ((att.content && typeof att.content === 'string' && att.content.length > 0) || att.path || att.url))
      .map((att) => {
        const item = { filename: att.filename || att.name || 'allegato' };
        if (att.content) {
          item.content = att.content;
          item.encoding = att.encoding || "base64";
        } else if (att.path || att.url) {
          item.path = att.path || att.url;
        }
        return item;
      });

    console.log('📎 Allegati totali preparati:', emailAttachments.length);

    // Gestione ID Campagna (usa esistente o crea)
    let campaignId = campaign_id || null;
    if (!campaignId) {
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
    } else {
      // Aggiorna stato in sending
      try {
        await supabase
          .from("campaigns")
          .update({
            status: "sending",
            sent_at: new Date().toISOString()
          })
          .eq("id", campaignId);
      } catch (_) {}
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

        // ✅ Smistamento Allegati Dinamici (Attestati Nominativi)
        let recipientAttachments = emailAttachments;
        const hasCfNamedAttachments = emailAttachments.some(att => {
          const fname = (att.filename || att.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          return /[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]/i.test(fname) || fname.length >= 11;
        });

        const shouldMatchDynamically = isDynamic || (emailAttachments.length > 1 && hasCfNamedAttachments);

        if (shouldMatchDynamically && emailAttachments.length > 0) {
          let contactObj = contacts?.find(c => (c.email || '').toLowerCase() === recipient.toLowerCase());
          if (!contactObj || (!contactObj.codiceFiscale && !contactObj.codice_fiscale)) {
            try {
              const { data: dbContact } = await supabase
                .from('contacts')
                .select('*')
                .eq('user_id', user_id)
                .ilike('email', recipient)
                .maybeSingle();
              if (dbContact) {
                contactObj = { ...(contactObj || {}), ...dbContact };
              }
            } catch (_) {}
          }
          if (!contactObj) contactObj = { email: recipient };

          recipientAttachments = matchAttachmentsForContact(contactObj, emailAttachments, { matchMode: effectiveMatchMode });
          console.log(`📎 [Dynamic Match] per ${recipient}: ${recipientAttachments.length} allegati trovati (${recipientAttachments.map(a => a.filename).join(', ') || 'Nessuno'})`);
        }

        await transporter.sendMail({
          from,
          to: recipient,
          cc: cc || [],
          bcc: bcc || [],
          subject,
          html: trackableHtml,
          attachments: recipientAttachments,
        });

        sent++;
        console.log(`✅ Inviata a ${recipient}`);

        // ✅ Salva lo stato in campaign_recipients per il tracciamento avvenuta lettura
        if (campaignId) {
          try {
            const contactObj = contacts?.find(c => (c.email || '').toLowerCase() === recipient.toLowerCase()) || {};
            let cf = contactObj.codiceFiscale || contactObj.codice_fiscale || '';
            if (!cf && contactObj.customFields) {
              let custom = contactObj.customFields;
              if (typeof custom === 'string') { try { custom = JSON.parse(custom); } catch {} }
              if (typeof custom === 'object' && custom) cf = custom.codiceFiscale || custom.cf || '';
            }

            await supabase.from("campaign_recipients").upsert({
              id: crypto.randomUUID(),
              campaign_id: campaignId,
              email: recipient,
              name: contactObj.name || contactObj.nominativo || recipient.split('@')[0],
              codice_fiscale: cf,
              status: 'sent',
              opened: false,
              read: false,
              sent_at: new Date().toISOString()
            }, { onConflict: 'campaign_id,email' });
          } catch (rErr) {
            console.warn('⚠️ Log recipient:', rErr.message);
          }
        }
      } catch (err) {
        failed++;
        console.error(`❌ Errore invio a ${recipient}:`, err.message);
        errors.push({ email: recipient, error: err.message });
      }
    }

    // ✅ Aggiorna il record della campagna con i risultati finali
    if (campaignId) {
      try {
        await supabase
          .from("campaigns")
          .update({
            status: failed === to.length ? "failed" : "sent",
            sent_count: sent,
            failed_count: failed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaignId);

        console.log(`📊 Campagna ${campaignId} aggiornata: ${sent} inviate, ${failed} fallite`);
      } catch (updateErr) {
        console.error("⚠️ Errore aggiornamento finale campagna:", updateErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Invio completato: ${sent} inviate, ${failed} fallite`,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      campaign_id: campaignId,
    });
  } catch (error) {
    console.error("❌ Errore generale durante l'invio:", error);
    return res.status(500).json({
      success: false,
      message: `Errore durante l'invio: ${error.message}`,
      error: error.message,
    });
  }
}