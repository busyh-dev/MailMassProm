// pages/api/email-accounts.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true, 
        accounts: data || [] 
      });
    }

    if (method === 'POST') {
      const accountData = req.body;

      const { data, error } = await supabase
        .from('email_accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(201).json({ 
        success: true, 
        account: data 
      });
    }

    if (method === 'DELETE') {
      const { id } = req.query;

      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase error:', error);
        return res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({ 
        success: true 
      });
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
