const fs = require('fs');
const path = require('path');

const filesToFix = [
  'index.html',
  'posts.html',
  'pruebas.html',
  'testimonios.html',
  'posts/expediente-colombia-jean-paul-ramirez.html',
  'posts/investigacion-robert-ramirez-rico.html',
  'posts/red-familiar-estafa-ramirez-rico.html',
  'posts/sentencia-tsj-robert-ramirez.html'
];

// Mapping mojibake to correct UTF-8
// These are the exact sequences caused by Windows-1252 reading UTF-8
const replacements = {
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã\xAD': 'í', // í
  'Ã±': 'ñ',
  'Ã ': 'Á',
  'Ã‰': 'É',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã\x8D': 'Í',
  'Ã‘': 'Ñ',
  'â€”': '—',
  'â€œ': '“',
  'â€\x9D': '”',
  'Â·': '·',
  'PÃºblico': 'Público',
  'JesÃºs': 'Jesús',
  'MedellÃ\xADn': 'Medellín',
  'MedellÃn': 'Medellín',
  'RamÃ\xADrez': 'Ramírez',
  'RamÃrez': 'Ramírez',
  'vÃ\xADctimas': 'víctimas',
  'vÃctimas': 'víctimas',
  'IdentificaciÃ³n': 'Identificación',
  'fotografÃ\xADa': 'fotografía',
  'fotografÃa': 'fotografía',
  // Some emojis / symbols got mangled:
  'ðŸ”aa': '🔍',
  'ðŸ”^': '📈',
  'ðŸ’¥': '💥',
  'ðŸš§': '🚧',
  'ðŸ•µï¸': '🕵️',
  'ðŸ“„': '📄',
  'ðŸ’°': '💰',
  'ðŸ”¥': '🔥',
  'ðŸ›¡ï¸': '🛡️',
  'ðŸ”Ž': '🔎',
  'ðŸš¨': '🚨',
  'ðŸ”§': '🔧',
  'ðŸ“Œ': '📌',
  'âš¡': '⚡',
  'ðŸ“£': '📢',
  'ðŸ”«': '🔫',
  'ðŸš«': '🚫',
  'âš–ï¸': '⚖️',
  'ðŸ’¤': '💤',
  'ðŸŒŽ': '🌎',
  'ðŸ¤\x9D': '🤝',
  'ðŸ‘¥': '👥',
  'ðŸ“œ': '📜',
  'ðŸš\x80': '🚀',
  'ðŸ“Š': '📊',
  'â€¼ï¸': '‼️',
  // Specific words from screenshots
  'Doble Identidad': 'Doble Identidad', // Just context
  'Fraude de InversiÃ³n': 'Fraude de Inversión',
  'Red de Complicidad': 'Red de Complicidad',
  'CaptaciÃ³n en Zonas Premium': 'Captación en Zonas Premium',
  'Amenazas al ser Reclamado': 'Amenazas al ser Reclamado',
  'Censura Digital': 'Censura Digital',
  'actÃºa': 'actúa',
  'GalerÃ\xADa de IdentificaciÃ³n': 'Galería de Identificación',
  'GalerÃa de IdentificaciÃ³n': 'Galería de Identificación',
  'PÃºblica': 'Pública',
  'JesÃºs': 'Jesús',
  'RamÃ\xADrez': 'Ramírez',
  'MedellÃ\xADn': 'Medellín'
};

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Reverse the mangled boundaries
    // Replace "â• " which was the start of the border
    content = content.replace(/â• /g, '═');
    content = content.replace(/â•/g, '═');
    content = content.replace(/â•\x90/g, '═');
    content = content.replace(/ǟ/g, 'í'); // from previous python attempt maybe
    content = content.replace(/ǽ'\?\?/g, '—');
    
    // Run all regular replacements
    for (const [bad, good] of Object.entries(replacements)) {
      content = content.split(bad).join(good);
    }
    
    // Also a catch-all for remaining A-tilde + soft hyphen combinations
    // Since javascript reads them as individual chars, let's fix the common ones manually with RegEx if needed
    // 'Ã' + '\xAD' is í
    content = content.replace(/Ã\xAD/g, 'í');
    // 'Ã' + '\xA1' is á
    content = content.replace(/Ã\xA1/g, 'á');
    // 'Ã' + '\xA9' is é
    content = content.replace(/Ã\xA9/g, 'é');
    // 'Ã' + '\xB3' is ó
    content = content.replace(/Ã\xB3/g, 'ó');
    // 'Ã' + '\xBA' is ú
    content = content.replace(/Ã\xBA/g, 'ú');
    // 'Ã' + '\xB1' is ñ
    content = content.replace(/Ã\xB1/g, 'ñ');

    // And also fix some weird artifacts that might have occurred from double running
    content = content.replace(/Ã³/g, 'ó');
    content = content.replace(/Ãº/g, 'ú');
    content = content.replace(/Ã±/g, 'ñ');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', file);
  }
});
