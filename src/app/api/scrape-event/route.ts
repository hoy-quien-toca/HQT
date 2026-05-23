import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'No URL provided' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch the page' }, { status: 500 });
    }

    const html = await response.text();

    // EXTRACCIÓN SIMPLE POR REGEX (Metadatos estándar)
    // 1. Título (Banda/Show)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/property="og:title" content="(.*?)"/i);
    let title = titleMatch ? titleMatch[1] : '';

    // Limpiar títulos comunes de ticketeras
    title = title.replace(/\|.*?$/, '').replace(/ - RedTickets/i, '').replace(/ - Entraste/i, '').trim();

    // 2. Descripción
    const descMatch = html.match(/property="og:description" content="(.*?)"/i) || html.match(/name="description" content="(.*?)"/i);
    const description = descMatch ? descMatch[1] : '';

    // 3. Fecha (Buscamos formatos comunes como YYYY-MM-DD o DD/MM/YYYY)
    // Muchas ticketeras usan JSON-LD (Schema.org)
    // Usamos [\s\S] en lugar del flag 's' para máxima compatibilidad
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    let date = '';
    let venue = '';
    let price = '';

    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        // Manejar tanto objeto simple como array
        const eventData = Array.isArray(jsonLd) ? jsonLd.find(i => i['@type'] === 'Event') : (jsonLd['@type'] === 'Event' ? jsonLd : null);
        
        if (eventData) {
          if (eventData.startDate) {
            date = eventData.startDate.split('T')[0];
          }
          if (eventData.location && eventData.location.name) {
            venue = eventData.location.name;
          }
          if (eventData.offers && eventData.offers.price) {
            price = eventData.offers.price;
          }
        }
      } catch (e) {}
    }

    // Fallback si JSON-LD no tiene datos o no existe
    if (!venue) {
        const venueMatch = html.match(/Lugar: (.*?)[\r\n|<]/i) || html.match(/Lugar<\/span>.*?<span>(.*?)<\/span>/i);
        venue = venueMatch ? venueMatch[1].trim() : '';
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        date,
        venue,
        price
      }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
