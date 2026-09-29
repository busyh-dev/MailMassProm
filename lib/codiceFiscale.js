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
