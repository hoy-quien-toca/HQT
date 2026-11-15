import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No se encontró la clave de API de Gemini (GEMINI_API_KEY o GOOGLE_API_KEY) en las variables de entorno (.env.local).' 
      }, { status: 500 });
    }

    const prompt = `Analiza el siguiente texto copiado de una página de venta de entradas (Passline o Redtickets) de Uruguay y extrae la información del evento en formato JSON estricto con las siguientes claves exactas:
{
  "band_name": "Nombre de la banda, artista o evento principal (string, limpio sin fechas ni lugares)",
  "venue": "Nombre del lugar, teatro, sala o bar (string)",
  "address": "Dirección exacta si aparece (string o vacío)",
  "city": "Ciudad, por defecto Montevideo o la que figure (string)",
  "department": "Departamento en MAYÚSCULAS entre: MONTEVIDEO, CANELONES, MALDONADO, COLONIA, SAN JOSE, FLORIDA, FLORES, LAVALLEJA, ROCHA, TREINTA Y TRES, CERRO LARGO, RIVERA, TACUAREMBÓ, DURAZNO, SORIANO, RIO NEGRO, PAYSANDU, SALTO, ARTIGAS, ARGENTINA",
  "date": "Fecha del evento en formato YYYY-MM-DD (string)",
  "time": "Hora del evento en formato HH:MM (string, ej: 21:00)",
  "description": "Reseña o descripción del evento (string)",
  "price_type": "range o free",
  "price_min": número entero del precio mínimo en pesos uruguayos o null si no hay,
  "price_max": número entero del precio máximo en pesos uruguayos o null si no hay
}

Texto a analizar:
"""
${text}
"""

Responde ÚNICAMENTE con el objeto JSON válido, sin markdown ni texto adicional.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Error en la API de Gemini: ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return NextResponse.json({ error: 'La IA no devolvió respuesta' }, { status: 500 });
    }

    const parsedData = JSON.parse(candidateText);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Error in AI parse event:', error);
    return NextResponse.json({ error: error.message || 'Error procesando con IA' }, { status: 500 });
  }
}
