/**
 * Utility per la validazione formale del Codice Fiscale italiano (16 caratteri)
 */

const ODD_VALUES = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

const EVEN_VALUES = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

const CONTROL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Valida la sintassi e il carattere di controllo di un Codice Fiscale.
 * Ritorna { valid: boolean, error?: string }
 */
export function validateCodiceFiscale(cf) {
  if (!cf) return { valid: false, error: 'Codice fiscale vuoto' };

  const cleanCf = cf.toString().trim().toUpperCase();

  if (cleanCf.length !== 16) {
    return { valid: false, error: 'Il codice fiscale deve essere esattamente di 16 caratteri' };
  }

  // Regex formattazione di base (supporta omocodia)
  const regex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{3}[A-Z]{1}$/;
  if (!regex.test(cleanCf)) {
    return { valid: false, error: 'Formato codice fiscale non valido' };
  }

  // Verifica Carattere di Controllo (cin - 16° carattere)
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = cleanCf[i];
    if (i % 2 === 0) { // Posizioni dispari 1-based (0, 2, 4...)
      sum += ODD_VALUES[char] !== undefined ? ODD_VALUES[char] : 0;
    } else { // Posizioni pari 1-based (1, 3, 5...)
      sum += EVEN_VALUES[char] !== undefined ? EVEN_VALUES[char] : 0;
    }
  }

  const expectedCin = CONTROL_CHARS[sum % 26];
  const actualCin = cleanCf[15];

  if (expectedCin !== actualCin) {
    return { 
      valid: false, 
      error: `Carattere di controllo non valido (Atteso: ${expectedCin}, Inserito: ${actualCin})` 
    };
  }

  return { valid: true, cf: cleanCf };
}

const MONTH_CODES = {
  'A': '01', 'B': '02', 'C': '03', 'D': '04', 'E': '05', 'H': '06',
  'L': '07', 'M': '08', 'P': '09', 'R': '10', 'S': '11', 'T': '12'
};

const OMOCODIA_DECODE = {
  'L': '0', 'M': '1', 'N': '2', 'P': '3', 'Q': '4',
  'R': '5', 'S': '6', 'T': '7', 'U': '8', 'V': '9'
};

function decodeChar(c) {
  return OMOCODIA_DECODE[c] !== undefined ? OMOCODIA_DECODE[c] : c;
}

/**
 * Estrae Data di Nascita e Sesso dal Codice Fiscale se valido.
 * Ritorna { dataNascita: 'YYYY-MM-DD', sesso: 'M' | 'F' } o null se non valido.
 */
export function parseCodiceFiscale(cf) {
  const check = validateCodiceFiscale(cf);
  if (!check.valid) return null;

  const cleanCf = check.cf;

  // Anno (caratteri 6 e 7, 0-indexed)
  const y1 = decodeChar(cleanCf[6]);
  const y2 = decodeChar(cleanCf[7]);
  const yearTwoDigits = parseInt(`${y1}${y2}`, 10);
  const currentYearTwoDigits = new Date().getFullYear() % 100;
  const fullYear = yearTwoDigits <= currentYearTwoDigits ? 2000 + yearTwoDigits : 1900 + yearTwoDigits;

  // Mese (carattere 8)
  const monthCode = cleanCf[8];
  const month = MONTH_CODES[monthCode];
  if (!month) return null;

  // Giorno e Sesso (caratteri 9 e 10)
  const d1 = decodeChar(cleanCf[9]);
  const d2 = decodeChar(cleanCf[10]);
  const rawDay = parseInt(`${d1}${d2}`, 10);

  if (isNaN(rawDay)) return null;

  let sesso = 'M';
  let dayNum = rawDay;
  if (rawDay > 40) {
    sesso = 'F';
    dayNum = rawDay - 40;
  }

  if (dayNum < 1 || dayNum > 31) return null;

  const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
  const dataNascita = `${fullYear}-${month}-${formattedDay}`;

  return { dataNascita, sesso, belfiore: cleanCf.substring(11, 15) };
}

/**
 * Verifica la coerenza del Codice Fiscale rispetto a dataNascita e sesso forniti.
 */
export function verifyCodiceFiscaleMatch(cf, { dataNascita, sesso }) {
  const parsed = parseCodiceFiscale(cf);
  if (!parsed) return { match: false, error: 'Codice fiscale non valido o non decodificabile' };

  const mismatches = [];

  if (sesso && parsed.sesso !== sesso.toUpperCase()) {
    mismatches.push(`Sesso (${parsed.sesso} vs ${sesso.toUpperCase()})`);
  }

  if (dataNascita) {
    // Normalizza formato YYYY-MM-DD
    const inputDate = dataNascita.trim();
    if (parsed.dataNascita !== inputDate) {
      mismatches.push(`Data di nascita (${parsed.dataNascita} vs ${inputDate})`);
    }
  }

  if (mismatches.length > 0) {
    return {
      match: false,
      parsed,
      error: `Incongruenza trovata nel Codice Fiscale per: ${mismatches.join(', ')}`
    };
  }

  return { match: true, parsed };
}

