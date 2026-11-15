import { NextResponse } from 'next/server';
import { parseEventText } from '@/lib/parseEventText';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
    }

    const parsedData = parseEventText(text);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Error in local parse event:', error);
    return NextResponse.json({ error: error.message || 'Error procesando texto' }, { status: 500 });
  }
}
