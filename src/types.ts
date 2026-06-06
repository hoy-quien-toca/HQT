export interface Event {
  id: string;
  band_name: string;
  venue: string;
  address: string;
  city: string;
  department?: string | null;
  date?: string | null;
  time?: string | null;
  age_rating?: string | null;
  description?: string | null;
  is_approved?: boolean;
  price_type?: 'range' | 'free' | 'gorra' | 'sobre' | string;
  genre?: string | null;
  flyer_url?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  ticket_type?: 'link' | 'whatsapp' | string;
  ticket_contact?: string | null;
  is_featured?: boolean;
  is_sold_out?: boolean;
  is_suspended?: boolean;
  suggestion_tag?: string | null;
  created_at?: string | null;
}

export interface Sponsor {
  id: string;
  client_name: string;
  image_url: string;
  link: string;
  position: 'top' | 'bottom' | 'sidebar' | string;
  display_order?: number | null;
  is_active?: boolean;
}

export interface Interview {
  id: string;
  title: string;
  subtitle?: string | null;
  band_name: string;
  content?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  published_at?: string | null;
  author?: string | null;
  photo_credit?: string | null;
  image_position?: string | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  created_at?: string | null;
}
