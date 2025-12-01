'use client';

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const supabaseUrl = 'https://mqnjtbtcmwjfuuyqipsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmp0YnRjbXdqZnV1eXFpcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk2OTcsImV4cCI6MjA3OTc2NTY5N30.kO6KfC_17AuF_SYpOQmF8VKnUzabnusDOXq4CrQsC_s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-16">
        
        {/* LOGO TIPO EMPRESA */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-lg shadow-sm group-hover:bg-blue-600 transition">📅</div>
          <span className="font-bold text-slate-800 tracking-tight text-lg">Resource<span className="text-slate-400">Manager</span></span>
        </Link>

        {/* NAVEGACIÓN CENTRAL */}
        <div className="hidden md:flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
          <Link href="/" className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isActive('/') ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Dashboard
          </Link>
          {isLoggedIn && (
            <Link href="/portal" className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isActive('/portal') ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Mi Portal
            </Link>
          )}
          {isLoggedIn && isAdmin && (
            <Link href="/admin" className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isActive('/admin') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Admin
            </Link>
          )}
        </div>

        {/* USUARIO / SALIR */}
        <div className="flex items-center">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="text-slate-500 hover:text-rose-600 text-sm font-bold px-3 py-1 transition border border-transparent hover:border-slate-200 rounded-md">
              Cerrar Sesión
            </button>
          ) : (
            <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm">
              Acceder
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}