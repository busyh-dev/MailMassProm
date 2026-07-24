const fs = require('fs');
const path = 'c:\\mailmassprom\\components\\email\\EmailPlatform.jsx';

let content = fs.readFileSync(path, 'utf8');

// The lines are like `      preview: "✨\r\n` or `      preview: "✨\n`
// Let's replace them safely.
content = content.replace(/preview: "✨\r?\n/g, 'preview: "✨",\n');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed unterminated strings.');
