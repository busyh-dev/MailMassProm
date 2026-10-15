import { createClient } from "@supabase/supabase-js";
import { getPublicBaseUrl } from "../../../lib/trackingUrl";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Inietta pixel apertura e traccia i link
const injectTracking = (html, campaignId, recipientEmail) => {
  if (!campaignId || !html) { // <--- Aggiungi parentesi
    console.log('⚠️ injectTracking: campaignId o html mancante', { campaignId });
    return html;
  }

  const baseUrl = getPublicBaseUrl().replace(/\/+$/, '');

  console.log('✅ Tracking iniettato:', { 
    campaignId, 
    recipientEmail, 
    baseUrl 
  });
  
  const encodedEmail = encodeURIComponent(recipientEmail);

  // ✅ Pixel apertura 1x1 trasparente con fallback compatibilità client di posta
  const openPixelUrl = `${baseUrl}/api/track/open?campaign_id=${encodeURIComponent(campaignId)}&recipient=${encodedEmail}`;
  const trackingPixel = `<img src="${openPixelUrl}" width="1" height="1" border="0" style="width:1px !important; min-width:1px !important; height:1px !important; min-height:1px !important; border:0 !important; margin:0 !important; padding:0 !important; opacity:0.01 !important;" alt="" />`;

  // ✅ Riscrivi i link per tracciare i click
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { apiKey, user_id, from, to, subject, html, cc, bcc, attachments, campaign_id } = req.body;

  if (!apiKey || !from || !to || !subject || !html) {
    return res.status(400).json({
      success: false,
      message: "Parametri mancanti: apiKey, from, to, subject, html sono obbligatori",
    });
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];

    // ✅ Inietta tracking per ogni destinatario
    // Per invio bulk usa il primo destinatario come riferimento
    const recipientForTracking = recipients.length === 1 ? recipients[0] : 'bulk';
    const trackedHtml = injectTracking(html, campaign_id, recipientForTracking);

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
        html: trackedHtml, // ✅ usa HTML con tracking
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