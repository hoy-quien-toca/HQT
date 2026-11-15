export function parseEventText(rawText: string) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let bandName = '';
  let venue = '';
  let date = '';
  let time = '21:00';
  let priceMin: number | null = null;
  let priceMax: number | null = null;
  let priceType = 'range';
  let description = rawText.trim();

  if (lines.length > 0) {
    // La primera línea suele ser el título o banda
    bandName = lines[0];
  }

  // Buscar fecha (ej: DD/MM/YYYY o formatos con mes)
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const dateMatch = rawText.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3];
    if (year.length === 2) year = '20' + year;
    date = `${year}-${month}-${day}`;
  }

  // Buscar hora (ej: 21:00, 21hs)
  const timeRegex = /(\d{1,2}):(\d{2})\s*(hs)?/i;
  const timeMatch = rawText.match(timeRegex);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // Buscar precios (ej: $500, 500 pesos)
  const priceRegex = /\$\s*(\d+([.,]\d+)?)/g;
  const prices: number[] = [];
  let pMatch;
  while ((pMatch = priceRegex.exec(rawText)) !== null) {
    const val = parseInt(pMatch[1].replace(/[.,]/g, ''), 10);
    if (!isNaN(val) && val > 0 && val < 500000) {
      prices.push(val);
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

  // Buscar posibles lugares conocidos o líneas con Teatro / Sala / Bar / Club
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('teatro') || lower.includes('sala') || lower.includes('bar') || lower.includes('club') || lower.includes('centro') || lower.includes('auditorio')) {
      if (!venue && line.length < 50) {
        venue = line;
        break;
      }
    }
  }

  return {
    band_name: bandName.substring(0, 100),
    venue: venue || '',
    date: date || '',
    time: time || '21:00',
    description: description.substring(0, 2000),
    price_type: priceType,
    price_min: priceMin,
    price_max: priceMax,
    ticket_type: 'link',
  };
}
