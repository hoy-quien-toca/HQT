import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { bandName, dateCount, location } = await request.json();
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('RESEND_API_KEY no configurada');
      return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'HQT Notificaciones <onboarding@resend.dev>',
        to: ['ernestopraxis@gmail.com'], 
        subject: `🔔 Nueva fecha: ${bandName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 4px solid #dc2626; border-radius: 20px;">
            <h1 style="color: #dc2626; text-transform: uppercase;">¡Nuevo evento para revisar!</h1>
            <p><strong>Banda:</strong> ${bandName}</p>
            <p><strong>Lugar:</strong> ${location}</p>
            <p><strong>Cantidad de fechas:</strong> ${dateCount}</p>
            <hr />
            <p>Entra al panel de administración para aprobarlo:</p>
            <a href="https://hoy-quien-toca.vercel.app/admin/dashboard" style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 99px; font-weight: bold; text-transform: uppercase;">Ir al Dashboard</a>
          </div>
        `,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('Error de Resend:', data);
      return NextResponse.json({ error: 'Error en Resend', details: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error enviando mail:', error);
    return NextResponse.json({ error: 'Error enviando mail', details: error.message }, { status: 500 });
  }
}
