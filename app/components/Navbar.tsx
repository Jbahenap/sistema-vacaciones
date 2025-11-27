'use client';

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation'; // <--- Importamos usePathname
import { useEffect, useState } from 'react';

// TUS LLAVES
const supabaseUrl = 'https://mqnjtbtcmwjfuuyqipsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmp0YnRjbXdqZnV1eXFpcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk2OTcsImV4cCI6MjA3OTc2NTY5N30.kO6KfC_17AuF_SYpOQmF8VKnUzabnusDOXq4CrQsC_s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // <--- Esto nos dice la URL actual
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      const role = localStorage.getItem('userRole');
      setIsAdmin(role === 'admin' || role === 'editor');
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      const role = localStorage.getItem('userRole');
      setIsAdmin(role === 'admin' || role === 'editor');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push('/login');
    router.refresh();
  };

  // Función para saber si un link está activo
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
        
        {/* LOGO */}
        <Link href="/" className="text-xl font-bold hover:text-blue-400 transition flex items-center gap-2">
          📅 <span className="hidden sm:inline">Gestión de Recursos</span>
        </Link>

        {/* BOTONES DERECHA */}
        <div className="flex items-center space-x-6">
          
          {/* 1. Calendario */}
          <Link 
            href="/" 
            className={`text-sm font-medium transition-colors border-b-2 pb-1 ${
              isActive('/') ? 'text-white border-blue-500' : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            Calendario Global
          </Link>

          {/* 2. Mi Portal */}
          {isLoggedIn && (
            <Link 
              href="/portal" 
              className={`text-sm font-medium transition-colors border-b-2 pb-1 ${
                isActive('/portal') ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-yellow-200'
              }`}
            >
              ★ Mi Portal
            </Link>
          )}

          {/* 3. Administrar */}
          {isLoggedIn && isAdmin && (
            <Link 
              href="/admin" 
              className={`text-sm font-medium transition-colors border-b-2 pb-1 ${
                isActive('/admin') ? 'text-purple-400 border-purple-400' : 'text-gray-400 border-transparent hover:text-purple-200'
              }`}
            >
              Administrar
            </Link>
          )}

          {/* 4. Salir / Entrar */}
          <div className="border-l border-gray-700 pl-6">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-xs font-bold transition">
                Salir
              </button>
            ) : (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-xs font-bold transition">
                Entrar
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}