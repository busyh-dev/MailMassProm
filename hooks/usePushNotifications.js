import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);

  const subscribe = async () => {
    try {
      // Chiedi permesso
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') return { success: false, message: 'Permesso negato' };

      // Registra service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Crea subscription
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);

      // Salva nel DB
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          subscription: sub.toJSON(),
        }),
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Errore subscribe push:', error);
      return { success: false, error: error.message };
    }
  };

  return { permission, subscription, subscribe };
};