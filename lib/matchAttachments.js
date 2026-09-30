/**
 * Utility per lo smistamento e l'abbinamento automatico degli attestati PDF (allegati nominativi)
 * ai contatti/discenti della campagna.
 */

/**
 * Normalizza una stringa per il matching (rimuove accenti, caratteri speciali, spazi multipli, in minuscolo)
 */
export function normalizeString(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/[^a-z0-9]/g, ' ')      // sostituisce caratteri speciali con spazio
    .replace(/\s+/g, ' ')            // compatta spazi
    .trim();
}

/**
 * Estrae il Codice Fiscale da un contatto (controlla vari campi possibili)
 */
export function extractCodiceFiscale(contact) {
  if (!contact) return '';
  let cf = contact.codiceFiscale || contact.codice_fiscale || contact.cf || contact.taxCode || contact.tax_code || '';
  
  if (!cf && contact.customFields) {
    let custom = contact.customFields;
    if (typeof custom === 'string') {
      try { custom = JSON.parse(custom); } catch (_) { custom = {}; }
    }
    if (typeof custom === 'object' && custom !== null) {
      cf = custom.codiceFiscale || custom.codice_fiscale || custom.cf || custom.taxCode || custom.tax_code || '';
    }
  }

  if (!cf && contact.custom_fields) {
    let custom = contact.custom_fields;
    if (typeof custom === 'string') {
      try { custom = JSON.parse(custom); } catch (_) { custom = {}; }
    }
    if (typeof custom === 'object' && custom !== null) {
      cf = custom.codiceFiscale || custom.codice_fiscale || custom.cf || custom.taxCode || custom.tax_code || '';
    }
  }

  if (!cf && contact.note && typeof contact.note === 'string' && contact.note.includes('<!--ANAGRAFICA:')) {
    try {
      const match = contact.note.match(/<!--ANAGRAFICA:([\s\S]*?)-->/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        cf = parsed.codiceFiscale || parsed.cf || parsed.codice_fiscale || '';
      }
    } catch (_) {}
  }
  
  return cf.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Trova gli allegati abbinati a un singolo contatto/discente
 * 
 * @param {Object} contact - Oggetto contatto (contiene email, name, firstName, lastName, codiceFiscale, customFields)
 * @param {Array} attachments - Lista allegati [{ filename, content, ... }]
 * @param {Object} options - { matchMode: 'auto'|'cf'|'name'|'email', fallbackToAll: false }
 * @returns {Array} Array di allegati abbinati a questo contatto
 */
export function matchAttachmentsForContact(contact, attachments = [], options = {}) {
  if (!attachments || attachments.length === 0) return [];
  if (!contact) return [];

  const matchMode = options.matchMode || 'auto'; // 'auto', 'cf', 'name', 'email'

  const cf = extractCodiceFiscale(contact);
  const email = (contact.email || '').toLowerCase().trim();
  const emailUsername = email.split('@')[0];

  const firstName = contact.firstName || contact.first_name || '';
  const lastName = contact.lastName || contact.last_name || '';
  const name = contact.name || `${firstName} ${lastName}`.trim();

  const normFirstName = normalizeString(firstName);
  const normLastName = normalizeString(lastName);
  const normFullName = normalizeString(name);

  const matched = attachments.filter((att) => {
    const origFilename = att.filename || att.name || '';
    const normFilename = normalizeString(origFilename);
    const upperFilename = origFilename.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. MATCH PER CODICE FISCALE
    if ((matchMode === 'auto' || matchMode === 'cf') && cf.length >= 6) {
      if (upperFilename.includes(cf)) {
        return true;
      }
    }

    // 2. MATCH PER NOME E COGNOME
    if (matchMode === 'auto' || matchMode === 'name') {
      // Se abbiamo sia Nome che Cognome separati
      if (normFirstName && normLastName && normFirstName.length >= 2 && normLastName.length >= 2) {
        if (normFilename.includes(normFirstName) && normFilename.includes(normLastName)) {
          return true;
        }
      }
      // Se abbiamo un nome completo unico di almeno 4 caratteri
      if (normFullName && normFullName.length >= 4) {
        const words = normFullName.split(' ').filter(w => w.length >= 2);
        if (words.length >= 2 && words.every(w => normFilename.includes(w))) {
          return true;
        }
      }
    }

    // 3. MATCH PER EMAIL / USERNAME
    if (matchMode === 'auto' || matchMode === 'email') {
      if (email && normFilename.includes(email)) {
        return true;
      }
      if (emailUsername && emailUsername.length >= 3 && normFilename.includes(normalizeString(emailUsername))) {
        return true;
      }
    }

    return false;
  });

  return matched;
}

/**
 * Esegue il matching massivo su tutti i contatti e restituisce una mappa / report
 */
export function buildMatchingReport(contacts = [], attachments = [], options = {}) {
  const report = contacts.map((contact) => {
    const matched = matchAttachmentsForContact(contact, attachments, options);
    return {
      contact,
      email: contact.email,
      name: contact.name || `${contact.firstName || contact.first_name || ''} ${contact.lastName || contact.last_name || ''}`.trim() || contact.email,
      codiceFiscale: extractCodiceFiscale(contact),
      matchedAttachments: matched,
      hasMatch: matched.length > 0,
      matchedFilenames: matched.map((a) => a.filename || a.name),
    };
  });

  const totalContacts = report.length;
  const matchedCount = report.filter((r) => r.hasMatch).length;
  const unmatchedCount = totalContacts - matchedCount;

  return {
    report,
    summary: {
      totalContacts,
      matchedCount,
      unmatchedCount,
      matchPercentage: totalContacts > 0 ? Math.round((matchedCount / totalContacts) * 100) : 0,
    },
  };
}
