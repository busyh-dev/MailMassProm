// pages/api/resend/send.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { apiKey, user_id, from, to, subject, html, cc, bcc, attachments } = req.body;

  if (!apiKey || !from || !to || !subject || !html) {
    return res.status(400).json({
      success: false,
      message: "Parametri mancanti: apiKey, from, to, subject, html sono obbligatori",
    });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
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

    // ✅ Salva nel database se user_id è presente
    if (user_id) {
      try {
        console.log('💾 Salvataggio dati nel database...');
        console.log('  - user_id:', user_id);
        console.log('  - recipients:', to);

        // Salva in campaigns
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .insert([
            {
              user_id: user_id,
              name: subject,
              subject,
              html_content: html,
              sender_email: from,
              recipients: Array.isArray(to) ? to : [to],
              cc: cc || [],
              bcc: bcc || [],
              status: "sent",
              sent_at: new Date().toISOString(),
              sent_count: Array.isArray(to) ? to.length : 1,
              failed_count: 0,
            },
          ])
          .select();

        if (campaignError) {
          console.error("⚠️ Errore salvataggio campaign:", campaignError);
        } else {
          console.log("✅ Campaign salvata:", campaignData);

          if (campaignData && campaignData.length > 0) {
            const campaignId = campaignData[0].id;

            // Salva in email_logs
            const { error: logError } = await supabase
              .from("email_logs")
              .insert([
                {
                  user_id: user_id,
                  campaign_id: campaignId,
                  subject: subject,
                  sent_at: new Date().toISOString(),
                  status: "sent",
                  opened_count: 0,
                  total_recipients: Array.isArray(to) ? to.length : 1,
                  recipients: Array.isArray(to) ? to : [to],
                  cc: cc || [],
                  bcc: bcc || [],
                  failed_recipients: null,
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
    }

    return res.status(200).json({
      success: true,
      data,
      sent: Array.isArray(to) ? to.length : 1,
    });
  } catch (error) {
    console.error("❌ Errore send Resend:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Errore durante l'invio",
    });
  }
}