import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { campaign_id, recipient, url } = req.query;

  if (campaign_id) {
    try {
      // ✅ Incrementa clicked_count nella campagna
      await supabase.rpc('increment_clicked_count', { p_campaign_id: campaign_id });

      // ✅ Aggiorna campaign_logs
      if (recipient && recipient !== 'bulk') {
        await supabase
          .from('campaign_logs')
          .update({
            clicked: true,
            clicked_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign_id)
          .eq('recipient_email', decodeURIComponent(recipient));
      }
    } catch (err) {
      console.error('Errore tracking click:', err);
    }
  }

  // ✅ Redirect all'URL originale
  if (url) {
    return res.redirect(302, decodeURIComponent(url));
  }

  res.status(200).end();
}