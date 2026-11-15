import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (res.status === 403 || res.status === 401) {
      return NextResponse.json({ 
        error: 'Passline o Redtickets bloqueó la solicitud automática (Protección anti-bot Cloudflare 403). Podés completar los datos manualmente o pegar el link en contacto.' 
      }, { status: 400 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: `No se pudo acceder a la URL (Status ${res.status})` }, { status: 400 });
    }

    const html = await res.text();

    const getMetaContent = (property: string) => {
      const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
      const match = html.match(regex);
      if (match && match[1]) return match[1];
      const regexName = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
      const matchName = html.match(regexName);
      return matchName ? matchName[1] : '';
    };

    const ogTitle = getMetaContent('og:title') || getMetaContent('twitter:title') || '';
    const ogDescription = getMetaContent('og:description') || getMetaContent('twitter:description') || '';
    const ogImage = getMetaContent('og:image') || getMetaContent('twitter:image') || '';

    let bandName = ogTitle;
    if (bandName.includes(' - Passline')) bandName = bandName.split(' - Passline')[0];
    if (bandName.includes(' | Redtickets')) bandName = bandName.split(' | Redtickets')[0];
    if (bandName.includes(' - Redtickets')) bandName = bandName.split(' - Redtickets')[0];

    let description = ogDescription;
    let flyerUrl = ogImage;
    let date = '';
    let time = '21:00';
    let venue = '';
    let address = '';
    let city = '';
    let department = 'MONTEVIDEO';
    let priceMin: number | null = null;
    let priceMax: number | null = null;
    let priceType = 'range';

    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1].trim());
        const events = Array.isArray(json) ? json : [json];
        for (const ev of events) {
          if (ev['@type'] === 'Event' || ev['@type']?.includes('Event') || ev.name || ev.startDate) {
            if (ev.name) bandName = ev.name;
            if (ev.description) description = ev.description;
            if (ev.image) {
              flyerUrl = typeof ev.image === 'string' ? ev.image : (ev.image.url || flyerUrl);
            }
            if (ev.startDate) {
              const dt = new Date(ev.startDate);
              if (!isNaN(dt.getTime())) {
                date = dt.toISOString().split('T')[0];
                const hours = String(dt.getHours()).padStart(2, '0');
                const minutes = String(dt.getMinutes()).padStart(2, '0');
                time = `${hours}:${minutes}`;
              }
            }
            if (ev.location) {
              if (typeof ev.location === 'string') {
                venue = ev.location;
              } else {
                if (ev.location.name) venue = ev.location.name;
                if (ev.location.address) {
                  if (typeof ev.location.address === 'string') {
                    address = ev.location.address;
                  } else {
                    address = ev.location.address.streetAddress || '';
                    city = ev.location.address.addressLocality || '';
                    if (ev.location.address.addressRegion) {
                      department = ev.location.address.addressRegion.toUpperCase();
                    }
                  }
                }
              }
            }
            if (ev.offers) {
              const offers = Array.isArray(ev.offers) ? ev.offers : [ev.offers];
              const prices: number[] = [];
              for (const offer of offers) {
                if (offer.price !== undefined) {
                  const p = Number(offer.price);
                  if (!isNaN(p)) prices.push(p);
                }
                if (offer.lowPrice !== undefined) {
                  const p = Number(offer.lowPrice);
                  if (!isNaN(p)) prices.push(p);
                }
                if (offer.highPrice !== undefined) {
                  const p = Number(offer.highPrice);
                  if (!isNaN(p)) prices.push(p);
                }
              }
              if (prices.length > 0) {
                priceMin = Math.min(...prices);
                priceMax = Math.max(...prices);
                if (priceMin === 0 && (priceMax === 0 || priceMax === null)) {
                  priceType = 'free';
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignorar
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        band_name: bandName.trim(),
        description: description.trim(),
        flyer_url: flyerUrl.trim(),
        date: date,
        time: time,
        venue: venue.trim(),
        address: address.trim(),
        city: city.trim(),
        department: department,
        price_type: priceType,
        price_min: priceMin,
        price_max: priceMax,
        ticket_type: 'link',
        ticket_contact: url.trim(),
      },
    });
  } catch (error: any) {
    console.error('Error scraping event URL:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar la URL' }, { status: 500 });
  }
}
