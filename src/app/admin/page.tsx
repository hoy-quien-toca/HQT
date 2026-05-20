'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full border-8 border-yellow-400 p-8 bg-zinc-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
        <h1 className="text-4xl font-black uppercase italic text-center mb-8 tracking-tighter">
          Acceso Admin
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-black uppercase text-sm tracking-widest text-yellow-400">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border-2 border-white p-3 outline-none focus:border-yellow-400 font-bold"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block font-black uppercase text-sm tracking-widest text-yellow-400">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border-2 border-white p-3 outline-none focus:border-yellow-400 font-bold"
            />
          </div>

          {error && <p className="text-red-500 font-bold uppercase text-xs">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-400 text-black font-black uppercase py-4 text-xl hover:bg-white transition-colors"
          >
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
