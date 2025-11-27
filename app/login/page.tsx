'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// TUS LLAVES
const supabaseUrl = 'https://mqnjtbtcmwjfuuyqipsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmp0YnRjbXdqZnV1eXFpcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk2OTcsImV4cCI6MjA3OTc2NTY5N30.kO6KfC_17AuF_SYpOQmF8VKnUzabnusDOXq4CrQsC_s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError('❌ Credenciales incorrectas');
      setLoading(false);
      return;
    }

    // 2. Si el login es correcto, buscamos qué rol tiene el usuario en la tabla employees
    // Importante: Usamos maybeSingle() por si el usuario existe en Auth pero no en la tabla employees
    const { data: emp } = await supabase
      .from('employees')
      .select('app_role')
      .eq('email', email)
      .maybeSingle();

    const userRole = emp?.app_role || 'viewer';
    
    // 3. Guardamos el rol para usarlo en el menú
    localStorage.setItem('userRole', userRole);

    // 4. Redirigir
    // Forzamos un refresh del router para que el Navbar se actualice y muestre "Admin"
    router.refresh(); 
    
    if (userRole === 'admin' || userRole === 'editor') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-8 rounded shadow-md w-96 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">🔐 Iniciar Sesión</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo</label>
            <input 
              type="email" 
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded">{error}</div>}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold transition-colors"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-400">
           Sistema de Gestión de Recursos
        </div>
      </div>
    </div>
  );
}