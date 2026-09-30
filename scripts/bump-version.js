const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');

try {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = pkg.version || '1.0.0';
  const parts = currentVersion.split('.');

  if (parts.length === 3) {
    const patch = parseInt(parts[2], 10) + 1;
    const newVersion = `${parts[0]}.${parts[1]}.${patch}`;
    pkg.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`🚀 Version bumped from v${currentVersion} -> v${newVersion}`);
  } else {
    console.warn(`⚠️ Formato versione non riconosciuto: ${currentVersion}`);
  }
} catch (err) {
  console.error('❌ Errore durante l\'aggiornamento della versione:', err);
}
