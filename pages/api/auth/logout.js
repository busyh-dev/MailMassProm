// ===========================================
// API ROUTE: pages/api/auth/logout.js
// ===========================================

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }
  
    // In un sistema JWT stateless, il logout è principalmente lato client
    // Il client deve semplicemente rimuovere il token dal localStorage
    
    // Opzionalmente, potresti implementare una blacklist dei token
    // o ridurre la durata dei token per maggiore sicurezza
  
    res.status(200).json({
      success: true,
      message: 'Logout effettuato con successo'
    });
  }