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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch the page' }, { status: 500 });
    }

    const html = await response.text();

    // --- EXTRACCIÓN MEJORADA ---

    // 1. Imagen (OpenGraph es lo más fiable para flyers)
    const imgMatch = html.match(/property="og:image" content="(.*?)"/i) || html.match(/name="twitter:image" content="(.*?)"/i);
    const image_url = imgMatch ? imgMatch[1] : '';

    // 2. Título (Banda/Show)
    const titleMatch = html.match(/property="og:title" content="(.*?)"/i) || html.match(/<title>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : '';
    title = title.replace(/\|.*?$/, '').replace(/ - RedTickets/i, '').replace(/ - Entraste/i, '').trim();

    // 3. Descripción / Reseña
    const descMatch = html.match(/property="og:description" content="(.*?)"/i) || html.match(/name="description" content="(.*?)"/i);
    let description = descMatch ? descMatch[1] : '';
    if (description.length < 50) {
        // Si la meta desc es muy corta, intentamos buscar bloques de texto grandes (experimental)
        const bodyTextMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (bodyTextMatch) description = bodyTextMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // 4. Datos Estructurados (JSON-LD) - La mina de oro
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    let date = '';
    let time = '21:00';
    let venue = '';
    let address = '';
    let price = '';

    for (const match of jsonLdMatches) {
      try {
        const jsonLd = JSON.parse(match[1]);
        const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
        const eventData = items.find(i => i['@type'] === 'Event' || i['@type'] === 'MusicEvent');
        
        if (eventData) {
          if (eventData.startDate) {
            const dt = new Date(eventData.startDate);
            date = dt.toISOString().split('T')[0];
            time = dt.toTimeString().substring(0, 5);
          }
          if (eventData.location) {
            venue = eventData.location.name || venue;
            if (eventData.location.address) {
                if (typeof eventData.location.address === 'string') {
                    address = eventData.location.address;
                } else if (eventData.location.address.streetAddress) {
                    address = eventData.location.address.streetAddress;
                }
            }
          }
          if (eventData.offers) {
            const offers = Array.isArray(eventData.offers) ? eventData.offers[0] : eventData.offers;
            price = offers.price || offers.lowPrice || price;
          }
          if (!description && eventData.description) description = eventData.description;
        }
      } catch (e) {}
    }

    // 5. Fallbacks específicos para Ticketeras si JSON-LD falló
    if (!venue) {
        const vMatch = html.match(/Lugar:?\s*<\/strong>\s*([^<]+)/i) || html.match(/venue["']:\s*["']([^"']+)["']/i);
        venue = vMatch ? vMatch[1].trim() : '';
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        date,
        time,
        venue,
        address,
        price,
        image_url
      }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
