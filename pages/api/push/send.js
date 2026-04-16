import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, title, body, icon } = req.body;

  try {
    // Carica tutte le subscription dell'utente
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id);

    if (error) throw error;
    if (!subscriptions?.length) {
      return res.json({ success: true, message: 'Nessuna subscription trovata' });
    }

    const payload = JSON.stringify({ title, body, icon: icon || '/icon.png' });

    // Manda push a tutti i dispositivi dell'utente
    const results = await Promise.allSettled(
      subscriptions.map(({ subscription }) =>
        webpush.sendNotification(subscription, payload)
      )
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn('⚠️ Alcune push fallite:', failed);
    }

    res.json({ success: true, sent: results.length - failed.length });
  } catch (error) {
    console.error('❌ Errore push:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}