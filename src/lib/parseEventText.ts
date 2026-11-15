const UI_NOISE = [
  'iniciar sesión', 'registrarse', 'comprar', 'entradas', 'ticket', 'tickets', 'carrito', 
  'ayuda', 'términos', 'condiciones', 'política', 'privacidad', 'passline', 'redtickets',
  'compartir', 'whatsapp', 'facebook', 'instagram', 'copiar link', 'ver mapa', 'ubicación',
  'seleccionar', 'asientos', 'continuar', 'volver', 'filtrar', 'buscar', 'todos los derechos',
  'inicio', 'eventos', 'contacto', 'mis entradas', 'ver más', 'siguiente', 'anterior',
  'agregado al carrito', 'resumen de compra', 'métodos de pago', 'servicio', 'costo de servicio'
];

const VENUE_KEYWORDS = [
  'teatro', 'sala', 'bar', 'club', 'auditorio', 'centro', 'estadio', 'anfiteatro', 
  'pub', 'hall', 'espacio', 'plaza', 'parque', 'antel arena', 'sodre', 'bluzz', 
  'live', 'complejo', 'zitarrosa', 'movie', 'metropolitan', 'trillas', 'makala',
  'bunker', 'BJ', 'agadu', 'canelones', 'montevideo music box', 'la trastienda'
];

const MONTHS: Record<string, string> = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
  'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
  'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
};

export function parseEventText(rawText: string) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1);

  // Filtrar líneas que son ruido evidente de UI
  const cleanLines = lines.filter(l => {
    const lower = l.toLowerCase();
    return !UI_NOISE.some(noise => lower === noise || lower.startsWith(noise + ' '));
  });

  let bandName = '';
  let venue = '';
  let date = '';
  let time = '21:00';
  let priceMin: number | null = null;
  let priceMax: number | null = null;
  let priceType = 'range';
  let description = '';

  // 1. Detectar Lugar (Venue)
  for (const line of cleanLines) {
    const lower = line.toLowerCase();
    if (VENUE_KEYWORDS.some(kw => lower.includes(kw)) && line.length < 50) {
      venue = line;
      break;
    }
  }

  // 2. Detectar Fecha (ej: "15 de noviembre de 2026" o "15/11/2026")
  const spanishDateRegex = /(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?/i;
  const spanishMatch = rawText.match(spanishDateRegex);
  if (spanishMatch) {
    const day = spanishMatch[1].padStart(2, '0');
    const monthName = spanishMatch[2].toLowerCase();
    const month = MONTHS[monthName] || '01';
    const year = spanishMatch[3] || new Date().getFullYear().toString();
    date = `${year}-${month}-${day}`;
  } else {
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

  // 3. Detectar Hora
  const timeRegex = /(\d{1,2}):(\d{2})\s*(?:hs)?/i;
  const timeMatch = rawText.match(timeRegex);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // 4. Detectar Precios ($...)
  const priceRegex = /\$\s*(\d{2,6}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g;
  const prices: number[] = [];
  let pMatch;
  while ((pMatch = priceRegex.exec(rawText)) !== null) {
    const cleanNum = parseInt(pMatch[1].replace(/[.,]/g, ''), 10);
    if (!isNaN(cleanNum) && cleanNum > 50 && cleanNum < 500000) {
      prices.push(cleanNum);
    }
  }

  if (prices.length > 0) {
    priceMin = Math.min(...prices);
    priceMax = Math.max(...prices);
  } else if (rawText.toLowerCase().includes('gratis') || rawText.toLowerCase().includes('libre')) {
    priceType = 'free';
    priceMin = 0;
    priceMax = 0;
  }

  // 5. Detectar Banda / Título (la línea limpia más prominente que no sea fecha, hora, lugar ni precio)
  for (const line of cleanLines) {
    if (
      line.length > 3 && 
      line.length < 85 && 
      line !== venue && 
      !line.includes('$') &&
      !/\d{1,2}:\d{2}/.test(line) &&
      !/\d{1,2}[\/\-]\d{1,2}/.test(line) &&
      !Object.keys(MONTHS).some(m => line.toLowerCase().includes(m))
    ) {
      bandName = line;
      break;
    }
  }
  if (!bandName && cleanLines.length > 0) bandName = cleanLines[0];

  // 6. Descripción
  const descLines = cleanLines.filter(l => l !== bandName && l !== venue && !l.includes('$'));
  description = descLines.slice(0, 8).join('. ').substring(0, 1500);

  return {
    band_name: bandName.substring(0, 100),
    venue: venue || '',
    address: '',
    city: 'Montevideo',
    department: 'MONTEVIDEO',
    date: date || '',
    time: time || '21:00',
    description: description || rawText.substring(0, 1000),
    price_type: priceType,
    price_min: priceMin,
    price_max: priceMax,
    ticket_type: 'link',
  };
}
