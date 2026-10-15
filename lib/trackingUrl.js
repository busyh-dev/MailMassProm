/**
 * Determina l'URL pubblico principale per pixel di tracciamento e link di disiscrizione.
 * Assicura che anche se l'invio avviene da localhost/test, il pixel inviato ai destinatari
 * esterni punti a un dominio pubblico raggiungibile e non a localhost:3000.
 */
export function getPublicBaseUrl(req = null) {
  // 1. Se configurato esplicitamente un URL pubblico in ambiente
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Se in esecuzione su Vercel (dominio di produzione o preview)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  }

  // 3. Da header della richiesta HTTP se è un dominio pubblico reale
  if (req && req.headers) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.headers['x-forwarded-proto'] || 'https';
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }

  // 4. Default pubblico dell'applicazione di produzione
  return 'https://app.promotergroup.eu';
}
