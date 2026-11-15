const IGNORED_WORDS = [
  'iniciar sesión', 'registrarse', 'comprar', 'entradas', 'ticket', 'tickets', 'carrito', 
  'ayuda', 'términos', 'condiciones', 'política', 'privacidad', 'passline', 'redtickets',
  'compartir', 'whatsapp', 'facebook', 'instagram', 'copiar link', 'ver mapa', 'ubicación',
  'seleccionar', 'asientos', 'continuar', 'volver', 'filtrar', 'buscar', 'todos los derechos'
];

export function parseEventText(rawText: string) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2 && !IGNORED_WORDS.some(w => l.toLowerCase().includes(w)));

  let bandName = '';
  let venue = '';
  let address = '';
  let date = '';
  let time = '21:00';
  let priceMin: number | null = null;
  let priceMax: number | null = null;
  let priceType = 'range';
  let description = '';

  // 1. Detectar Banda / Título (línea más relevante al principio)
  for (const line of lines) {
    if (line.length > 3 && line.length < 80 && !bandName) {
      // Ignorar si parece fecha o precio
      if (!/\d{1,2}[\/\-]\d{1,2}/.test(line) && !line.startsWith('$')) {
        bandName = line;
        break;
      }
    }
  }
  if (!bandName && lines.length > 0) bandName = lines[0];

  // 2. Detectar Fecha (Formatos: DD/MM/YYYY, DD de mes de YYYY, etc.)
  const monthsMap: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
    'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
    'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
  };

  const textLower = rawText.toLowerCase();

  // Buscar formato "DD de mes [de YYYY]"
  const spanishDateRegex = /(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?/i;
  const spanishMatch = textLower.match(spanishDateRegex);
  if (spanishMatch) {
    const day = spanishMatch[1].padStart(2, '0');
    const monthName = spanishMatch[2].toLowerCase();
    const month = monthsMap[monthName] || '01';
    const year = spanishMatch[3] || new Date().getFullYear().toString();
    date = `${year}-${month}-${day}`;
  } else {
    // Buscar formato numérico DD/MM/YYYY o DD-MM-YYYY
    const numDateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const numMatch = rawText.match(numDateRegex);
    if (numMatch) {
      const day = numMatch[1].padStart(2, '0');
      const month = numMatch[2].padStart(2, '0');
      let year = numMatch[3];
      if (year.length === 2) year = '20' + year;
      date = `${year}-${month}-${day}`;
    }
  }

  // 3. Detectar Hora (HH:MM o XX:XX hs)
  const timeRegex = /(\d{1,2}):(\d{2})\s*(?:hs)?/i;
  const timeMatch = rawText.match(timeRegex);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // 4. Detectar Lugar / Venue
  const venueKeywords = ['teatro', 'sala', 'bar', 'club', 'auditorio', 'centro', 'estadio', 'anfiteatro', 'pub', 'hall', 'espacio', 'plaza', 'parque'];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (venueKeywords.some(kw => lower.includes(kw)) && line.length < 60) {
      venue = line;
      break;
    }
  }

  // 5. Detectar Precios ($XXXX)
  const priceRegex = /\$\s*(\d{2,6}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g;
  const prices: number[] = [];
  let pMatch;
  while ((pMatch = priceRegex.exec(rawText)) !== null) {
    const cleanNum = parseInt(pMatch[1].replace(/[.,]/g, ''), 10);
    // Filtrar números extraños (ej: años 2026, códigos postales, etc.)
    if (!isNaN(cleanNum) && cleanNum > 50 && cleanNum < 500000) {
      prices.push(cleanNum);
    }
  }

  if (prices.length > 0) {
    priceMin = Math.min(...prices);
    priceMax = Math.max(...prices);
  } else if (textLower.includes('gratis') || textLower.includes('libre') || textLower.includes('entrada libre')) {
    priceType = 'free';
    priceMin = 0;
    priceMax = 0;
  }

  // 6. Construir Descripción limpia (tomar párrafos relevantes)
  const descLines = lines.filter(l => l !== bandName && l !== venue && !l.includes('$'));
  description = descLines.slice(0, 10).join('. ').substring(0, 1500);

  return {
    band_name: bandName.substring(0, 100),
    venue: venue || '',
    address: address || '',
    date: date || '',
    time: time || '21:00',
    description: description || rawText.substring(0, 1000),
    price_type: priceType,
    price_min: priceMin,
    price_max: priceMax,
    ticket_type: 'link',
  };
}
