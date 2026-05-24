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

    // 1. Imagen (Flyer)
    const imgMatch = html.match(/property="og:image" content="(.*?)"/i) || 
                   html.match(/name="twitter:image" content="(.*?)"/i) ||
                   html.match(/itemprop="image" content="(.*?)"/i);
    const image_url = imgMatch ? imgMatch[1] : '';

    // 2. Título
    const titleMatch = html.match(/property="og:title" content="(.*?)"/i) || 
                     html.match(/<title>(.*?)<\/title>/i) ||
                     html.match(/<h1>(.*?)<\/h1>/i);
    let title = titleMatch ? titleMatch[1] : '';
    title = title.replace(/\|.*?$/, '').replace(/ - RedTickets/i, '').replace(/ - Entraste/i, '').trim();

    // 3. Descripción
    const descMatch = html.match(/property="og:description" content="(.*?)"/i) || 
                    html.match(/name="description" content="(.*?)"/i);
    let description = descMatch ? descMatch[1] : '';

    // 4. Datos Estructurados (JSON-LD)
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
                } else {
                    address = eventData.location.address.streetAddress || eventData.location.address.addressLocality || '';
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

    // 5. Fallbacks específicos para Ticketeras uruguayas
    if (!venue) {
        // RedTickets suele usar h2 o spans con clases específicas
        const rtVenue = html.match(/class="venue-name">(.*?)<\/h2>/i) || html.match(/Local: (.*?)[\r\n|<]/i);
        if (rtVenue) venue = rtVenue[1].trim();
    }
    
    if (!price) {
        const pMatch = html.match(/Desde \$ ([\d\.,]+)/i) || html.match(/Precio: \$ ([\d\.,]+)/i);
        if (pMatch) price = pMatch[1].replace(/\./g, '');
    }

    if (!description || description.length < 100) {
        // Buscar bloques de texto descriptivos
        const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                           html.match(/<div[^>]*id="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (contentMatch) description = contentMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    return NextResponse.json({
      success: true,
      data: {
        title: title.substring(0, 100),
        description: description.substring(0, 2000),
        date,
        time,
        venue: venue.substring(0, 100),
        address: address.substring(0, 200),
        price,
        image_url
      }
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
