const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');

// Cargar variables de entorno si existe .env
dotenv.config();

async function init() {
  console.log('⏳ Iniciando creación de tablas en Vercel Postgres...');
  
  try {
    // Tabla de Eventos
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        band_name text NOT NULL,
        venue text,
        address text,
        city text,
        department text DEFAULT 'MONTEVIDEO',
        date date NOT NULL,
        time time,
        age_rating text DEFAULT 'ATP',
        description text,
        is_approved boolean DEFAULT false,
        is_sold_out boolean DEFAULT false,
        is_suspended boolean DEFAULT false,
        is_featured boolean DEFAULT false,
        suggestion_tag text,
        price_type text DEFAULT 'range',
        price_min integer,
        price_max integer,
        ticket_type text DEFAULT 'link',
        ticket_contact text,
        flyer_url text,
        genre text DEFAULT 'ROCK'
      );
    `;
    console.log('✅ Tabla "events" lista.');

    // Tabla de Entrevistas
    await sql`
      CREATE TABLE IF NOT EXISTS interviews (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        published_at timestamp with time zone DEFAULT now() NOT NULL,
        title text NOT NULL,
        subtitle text,
        band_name text NOT NULL,
        content text NOT NULL,
        image_url text,
        is_active boolean DEFAULT true,
        is_featured boolean DEFAULT false,
        author text,
        photo_credit text,
        image_position text DEFAULT 'center'
      );
    `;
    console.log('✅ Tabla "interviews" lista.');

    // Tabla de Sponsors
    await sql`
      CREATE TABLE IF NOT EXISTS sponsors (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        client_name text NOT NULL,
        image_url text NOT NULL,
        link text,
        position text DEFAULT 'sidebar',
        display_order integer DEFAULT 0,
        is_active boolean DEFAULT true
      );
    `;
    console.log('✅ Tabla "sponsors" lista.');

    // Tabla de Mensajes
    await sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        name text NOT NULL,
        email text,
        phone text,
        message text NOT NULL
      );
    `;
    console.log('✅ Tabla "contact_messages" lista.');

    console.log('🚀 ¡Base de datos configurada con éxito!');
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    process.exit(1);
  }
}

init();
