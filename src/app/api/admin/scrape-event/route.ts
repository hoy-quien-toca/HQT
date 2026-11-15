import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `No se pudo acceder a la URL (Status ${res.status})` }, { status: 400 });
    }

    const html = await res.text();

    // Extraer OpenGraph meta tags
    const getMetaContent = (property: string) => {
      const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
      const match = html.match(regex);
      if (match && match[1]) return match[1];
      // Intentar también con name en vez de property
      const regexName = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
      const matchName = html.match(regexName);
      return matchName ? matchName[1] : '';
    };

    const title = getMetaContent('og:title') || getMetaContent('twitter:title') || '';
    const description = getMetaContent('og:description') || getMetaContent('twitter:description') || '';
    const image = getMetaContent('og:image') || getMetaContent('twitter:image') || '';

    // Limpiar título (ej: "Banda X en Sala Z - Passline" -> "Banda X")
    let bandName = title;
    if (bandName.includes(' - Passline')) bandName = bandName.split(' - Passline')[0];
    if (bandName.includes(' | Redtickets')) bandName = bandName.split(' | Redtickets')[0];
    if (bandName.includes(' - Redtickets')) bandName = bandName.split(' - Redtickets')[0];

    return NextResponse.json({
      success: true,
      data: {
        band_name: bandName.trim(),
        description: description.trim(),
        flyer_url: image.trim(),
        ticket_type: 'link',
        ticket_contact: url.trim(),
      },
    });
  } catch (error: any) {
    console.error('Error scraping event URL:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar la URL' }, { status: 500 });
  }
}
