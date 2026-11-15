const UI_NOISE = [
  'iniciar sesión', 'registrarse', 'comprar', 'entradas', 'ticket', 'tickets', 'carrito', 
  'ayuda', 'términos', 'condiciones', 'política', 'privacidad', 'passline', 'redtickets',
  'compartir', 'whatsapp', 'facebook', 'instagram', 'copiar link', 'ver mapa', 'ubicación',
  'seleccionar', 'asientos', 'continuar', 'volver', 'filtrar', 'buscar', 'todos los derechos',
  'inicio', 'eventos', 'contacto', 'mis entradas', 'ver más', 'siguiente', 'anterior',
  'agregado al carrito', 'resumen de compra', 'métodos de pago', 'servicio', 'costo de servicio',
  'mis tickets', 'mi perfil', 'buscá tu próximo plan', 'crear evento'
];

const MONTHS: Record<string, string> = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
  'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
  'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
};

export function parseEventText(rawText: string) {
  // Limpiar texto general
  const cleanText = rawText.replace(/\r\n/g, '\n');
  const lines = cleanText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1);

  let bandName = '';
  let venue = '';
  let address = '';
  let city = 'Montevideo';
  let department = 'MONTEVIDEO';
  let date = '';
  let time = '21:00';
  let priceMin: number | null = null;
  let priceMax: number | null = null;
  let priceType = 'range';
  let description = '';

  // 1. Detectar Banda / Título (ej: con comillas o primera línea relevante)
  const quoteMatch = cleanText.match(/"([^"]+)"\s*([^\.]+)/);
  if (quoteMatch) {
    bandName = `${quoteMatch[1]} ${quoteMatch[2]}`.trim();
  } else {
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!UI_NOISE.some(n => lower.includes(n)) && line.length > 3 && line.length < 80) {
        if (!/\d{1,2}\s+de\s+[a-z]+/i.test(line) && !line.includes('$')) {
          bandName = line.replace(/\.$/, '');
          break;
        }
      }
    }
  }
  if (!bandName && lines.length > 0) bandName = lines[0];

  // 2. Detectar Fecha (ej: "Domingo 9 de Mayo" o "9 de Mayo")
  const spanishDateRegex = /(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)?[\s,]*(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?/i;
  const spanishMatch = cleanText.match(spanishDateRegex);
  if (spanishMatch) {
    const day = spanishMatch[1].padStart(2, '0');
    const monthName = spanishMatch[2].toLowerCase();
    const month = MONTHS[monthName] || '05';
    const year = spanishMatch[3] || new Date().getFullYear().toString();
    date = `${year}-${month}-${day}`;
  }

  // 3. Detectar Hora (ej: "21 hs", "21:00")
  const timeRegex = /(\d{1,2})\s*(?:hs|h|:(\d{2}))/i;
  const timeMatch = cleanText.match(timeRegex);
  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, '0');
    const minute = timeMatch[2] ? timeMatch[2] : '00';
    time = `${hour}:${minute}`;
  }

  // 4. Detectar Lugar y Dirección (ej: "Radisson Montevideo Victoria Plaza Hotel - Pl. Independencia 759")
  const parts = cleanText.split(/[-–—•]/);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    const lower = part.toLowerCase();
    if (
      lower.includes('hotel') || lower.includes('teatro') || lower.includes('sala') || 
      lower.includes('hotel') || lower.includes('club') || lower.includes('auditorio') ||
      lower.includes('radisson') || lower.includes('plaza')
    ) {
      venue = part;
      // Si hay una parte siguiente, suele ser la dirección
      if (parts[i + 1]) {
        address = parts[i + 1].trim();
      }
      break;
    }
  }

  // 5. Detectar Precios
  const priceRegex = /\$\s*(\d{2,6})/g;
  const prices: number[] = [];
  let pMatch;
  while ((pMatch = priceRegex.exec(cleanText)) !== null) {
    const val = parseInt(pMatch[1], 10);
    if (!isNaN(val) && val > 50 && val < 500000) {
      prices.push(val);
    }
  }

  if (prices.length > 0) {
    priceMin = Math.min(...prices);
    priceMax = Math.max(...prices);
  } else if (cleanText.toLowerCase().includes('gratis') || cleanText.toLowerCase().includes('libre')) {
    priceType = 'free';
    priceMin = 0;
    priceMax = 0;
  }

  // 6. Descripción
  description = cleanText.substring(0, 1000);

  return {
    band_name: bandName.replace(/\.$/, '').substring(0, 100),
    venue: venue.substring(0, 100),
    address: address.substring(0, 150),
    city: 'Montevideo',
    department: 'MONTEVIDEO',
    date: date || '',
    time: time || '21:00',
    description: description,
    price_type: priceType,
    price_min: priceMin,
    price_max: priceMax,
    ticket_type: 'link',
  };
}
