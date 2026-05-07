import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Inietta pixel apertura e traccia i link
const injectTracking = (html, campaignId, recipientEmail) => {
  if (!campaignId || !html) {
    console.log('⚠️ injectTracking: campaignId o html mancante', { campaignId });
    return html;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const encodedEmail = encodeURIComponent(recipientEmail);

  // ✅ Pixel apertura 1x1
  const trackingPixel = `<img src="${baseUrl}/api/track/open?campaign_id=${campaignId}&recipient=${encodedEmail}" width="1" height="1" style="display:none;border:0;" alt="" />`;

  // ✅ Riscrivi i link per tracciare i click (escludi tracking e unsubscribe)
  let trackedHtml = html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      if (url.includes('/api/track') || url.includes('unsubscribe')) return match;
      const encodedUrl = encodeURIComponent(url);
      return `href="${baseUrl}/api/track/click?campaign_id=${campaignId}&recipient=${encodedEmail}&url=${encodedUrl}"`;
    }
  );

  // ✅ Aggiungi pixel prima di </body> o alla fine
  if (trackedHtml.includes('</body>')) {
    trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`);
  } else {
    trackedHtml += trackingPixel;
  }

  return trackedHtml;
};

// ✅ Genera token disiscrizione e sostituisce i placeholder nell'HTML
const injectUnsubscribeLinks = async (html, contactId, contactEmail, campaignId) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  // Genera token univoco per questo contatto
  const token = crypto.randomUUID();

  // Salva il token nel database
  const { error } = await supabase.from('unsubscribe_tokens').insert({
    contact_id: contactId,
    campaign_id: campaignId || null,
    token: token,
  });

  if (error) {
    console.error('❌ Errore salvataggio token disiscrizione:', error);
  }

  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${token}`;
  const browserUrl = `${baseUrl}/api/view-in-browser?campaign_id=${campaignId}&email=${encodeURIComponent(contactEmail)}`;
  const preferencesUrl = `${baseUrl}/preferences?email=${encodeURIComponent(contactEmail)}&token=${token}`;

  // Sostituisce i placeholder nell'HTML
  let finalHtml = html;
  finalHtml = finalHtml.replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, unsubscribeUrl);
  finalHtml = finalHtml.replace(/\{\{BROWSER_LINK\}\}/g, browserUrl);
  finalHtml = finalHtml.replace(/\{\{PREFERENCES_LINK\}\}/g, preferencesUrl);

  // Sostituisce anche nome e email del contatto se presenti
  finalHtml = finalHtml.replace(/\{\{EMAIL\}\}/g, contactEmail);

  return finalHtml;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const {
    apiKey,
    user_id,
    from,
    to,
    subject,
    html,
    cc,
    bcc,
    attachments,
    campaign_id,
    // ✅ Nuovo: lista contatti con ID per generare token univoci
    // Se presente, invia una email per contatto con token personalizzato
    contacts, // Array di { id, email } — opzionale
  } = req.body;

  if (!apiKey || !from || !to || !subject || !html) {
    return res.status(400).json({
      success: false,
      message: "Parametri mancanti: apiKey, from, to, subject, html sono obbligatori",
    });
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];

    // ✅ Se abbiamo la lista contatti con ID, invia email personalizzate per ognuno
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      let sentCount = 0;
      let errors = [];

      for (const contact of contacts) {
        try {
          // 1. Inietta link disiscrizione personalizzati
          let personalizedHtml = await injectUnsubscribeLinks(
            html,
            contact.id,
            contact.email,
            campaign_id
          );

          // 2. Inietta tracking
          personalizedHtml = injectTracking(personalizedHtml, campaign_id, contact.email);

          // 3. Invia email
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from,
              to: [contact.email],
              subject,
              html: personalizedHtml,
              cc: cc || [],
              bcc: bcc || [],
              attachments: attachments || [],
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            console.error(`❌ Errore invio a ${contact.email}:`, data);
            errors.push({ email: contact.email, error: data.message });
          } else {
            sentCount++;
          }

          // ✅ Piccola pausa per evitare rate limiting (50ms tra un invio e l'altro)
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (contactError) {
          console.error(`❌ Errore contatto ${contact.email}:`, contactError);
          errors.push({ email: contact.email, error: contactError.message });
        }
      }

      return res.status(200).json({
        success: true,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
        total: contacts.length,
      });
    }

    // ✅ Fallback: invio normale senza token personalizzati (comportamento precedente)
    const recipientForTracking = recipients.length === 1 ? recipients[0] : 'bulk';
    
    // Per invio bulk senza contatti, sostituisce i placeholder con link generici
    let finalHtml = html;
    if (recipients.length === 1) {
      // Se c'è un solo destinatario, cerca il contatto nel DB per generare il token
      const { data: contactData } = await supabase
        .from('contacts')
        .select('id, email')
        .eq('email', recipients[0])
        .single();

      if (contactData) {
        finalHtml = await injectUnsubscribeLinks(
          html,
          contactData.id,
          contactData.email,
          campaign_id
        );
      } else {
        // Rimuovi i placeholder se non troviamo il contatto
        finalHtml = html
          .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, '#')
          .replace(/\{\{BROWSER_LINK\}\}/g, '#')
          .replace(/\{\{PREFERENCES_LINK\}\}/g, '#');
      }
    } else {
      // Invio bulk — rimuovi placeholder
      finalHtml = html
        .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, '#')
        .replace(/\{\{BROWSER_LINK\}\}/g, '#')
        .replace(/\{\{PREFERENCES_LINK\}\}/g, '#');
    }

    const trackedHtml = injectTracking(finalHtml, campaign_id, recipientForTracking);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html: trackedHtml,
        cc: cc || [],
        bcc: bcc || [],
        attachments: attachments || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Errore Resend:", data);
      return res.status(response.status).json({
        success: false,
        message: data.message || "Errore durante l'invio con Resend",
        error: data,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      sent: recipients.length,
    });

  } catch (error) {
    console.error("❌ Errore send Resend:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Errore durante l'invio",
    });
  }
}
