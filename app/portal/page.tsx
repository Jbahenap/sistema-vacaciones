'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// TUS LLAVES
const supabaseUrl = 'https://mqnjtbtcmwjfuuyqipsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmp0YnRjbXdqZnV1eXFpcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk2OTcsImV4cCI6MjA3OTc2NTY5N30.kO6KfC_17AuF_SYpOQmF8VKnUzabnusDOXq4CrQsC_s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PortalPage() {
  const router = useRouter();
  
  // Datos
  const [myProfile, setMyProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [myAllocations, setMyAllocations] = useState<any[]>([]);
  
  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // UI States
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Formulario Asignación
  const [form, setForm] = useState({
    type: 'project',
    project_id: '',
    start_date: '',
    end_date: ''
  });

  // Formulario Perfil (Cumpleaños)
  const [birthDate, setBirthDate] = useState('');

  // Formulario Nuevo Proyecto
  const [projForm, setProjForm] = useState({ name: '', client: '', color_code: '#3B82F6' });

  // --- CARGA INICIAL ---
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      if (!employee) {
        alert('Correo no registrado en nómina.');
        return;
      }

      setMyProfile(employee);
      setBirthDate(employee.birth_date || '');
      loadProjects();
      loadMyAllocations(employee.id);
    }
    init();
  }, []);

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const loadMyAllocations = async (empId: string) => {
    const { data } = await supabase
      .from('allocations')
      .select('*, projects(name)')
      .eq('employee_id', empId)
      .order('start_date', { ascending: false });
    setMyAllocations(data || []);
  };

  // --- GUARDAR PERFIL ---
  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    setProfileMsg('⏳');
    
    const { error } = await supabase
      .from('employees')
      .update({ birth_date: birthDate })
      .eq('id', myProfile.id);

    if (error) setProfileMsg('❌');
    else setProfileMsg('✅');
  };

  // --- CREAR PROYECTO ---
  const handleCreateProject = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('projects').insert([projForm]).select();
    
    if (error) setMsg('❌ Error al crear');
    else {
      setMsg('✅ Proyecto creado');
      setProjForm({ name: '', client: '', color_code: '#3B82F6' });
      await loadProjects();
      if (data && data.length > 0) setForm(prev => ({ ...prev, project_id: data[0].id }));
      setShowProjectForm(false);
    }
    setLoading(false);
  };

  const handleProjectChange = (e: any) => {
    const value = e.target.value;
    if (value === 'NEW_PROJECT_TRIGGER') {
      setShowProjectForm(true);
      setForm({ ...form, project_id: '' });
    } else {
      setForm({ ...form, project_id: value });
    }
  };

  // --- GUARDAR ASIGNACIÓN ---
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const dataToSave: any = {
      employee_id: myProfile.id,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
    };
    if (form.type === 'project') dataToSave.project_id = form.project_id;

    const { error } = await supabase.from('allocations').insert([dataToSave]);

    if (error) setMsg('❌ Error');
    else {
      setMsg('✅ Guardado');
      loadMyAllocations(myProfile.id);
      setForm({ ...form, start_date: '', end_date: '' });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('¿Borrar?')) return;
    await supabase.from('allocations').delete().eq('id', id);
    loadMyAllocations(myProfile.id);
  };

  if (!myProfile) return <div className="p-10 text-center">Cargando tu ficha... ⏳</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* === COLUMNA IZQUIERDA: FICHA DE PERFIL (CORREGIDA) === */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Encabezado Azul */}
            <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            
            <div className="px-6 pb-6 flex flex-col items-center">
              {/* Avatar CENTRADO y empujado hacia arriba con margen negativo */}
              <div className="-mt-12 w-24 h-24 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-blue-600 z-10">
                {myProfile.name.charAt(0)}
              </div>
              
              <div className="mt-4 text-center w-full">
                <h1 className="text-xl font-bold text-gray-800 break-words">{myProfile.name}</h1>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">{myProfile.role}</p>
                
                <div className="mt-6 text-sm text-gray-600 space-y-3 text-left bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center truncate">
                    <span className="mr-2">📧</span> 
                    <span className="truncate" title={myProfile.email}>{myProfile.email || 'Sin correo'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">🎂</span> 
                      <span>Cumpleaños:</span>
                    </div>
                    {profileMsg && <span className="text-xs">{profileMsg}</span>}
                  </div>
                  
                  {/* Input de Cumpleaños */}
                  <form onSubmit={handleUpdateProfile} className="flex gap-1">
                       <input 
                         type="date" 
                         className="border rounded px-2 py-1 text-xs w-full bg-white"
                         value={birthDate}
                         onChange={(e) => setBirthDate(e.target.value)}
                       />
                       <button className="text-xs bg-blue-600 text-white px-2 rounded hover:bg-blue-700 shadow-sm">
                         💾
                       </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === COLUMNA DERECHA: GESTIÓN === */}
        <div className="md:col-span-2 space-y-6">
          
          {/* PANEL NUEVO PROYECTO */}
          {showProjectForm && (
            <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200 animate-fade-in-down mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-blue-800">🚀 Crear Nuevo Proyecto</h3>
                <button onClick={() => setShowProjectForm(false)} className="text-gray-400 hover:text-red-500">✕</button>
              </div>
              <form onSubmit={handleCreateProject} className="flex gap-2 flex-wrap">
                <input type="text" className="border rounded p-2 flex-1 text-sm min-w-[150px]" placeholder="Nombre Proyecto" value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})} required autoFocus />
                <input type="text" className="border rounded p-2 flex-1 text-sm min-w-[150px]" placeholder="Cliente" value={projForm.client} onChange={e => setProjForm({...projForm, client: e.target.value})} />
                <input type="color" className="border rounded h-9 w-12 p-0 cursor-pointer" value={projForm.color_code} onChange={e => setProjForm({...projForm, color_code: e.target.value})} />
                <button className="bg-blue-600 text-white px-4 rounded text-sm font-bold hover:bg-blue-700">Guardar</button>
              </form>
            </div>
          )}

          {/* FORMULARIO PRINCIPAL */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              📝 Registrar Actividad
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button type="button" 
                  onClick={() => setForm({...form, type: 'project'})}
                  className={`flex-1 py-2 rounded-md text-sm font-bold transition ${form.type === 'project' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  💻 Asignación a Proyecto
                </button>
                <button type="button" 
                  onClick={() => setForm({...form, type: 'vacation'})}
                  className={`flex-1 py-2 rounded-md text-sm font-bold transition ${form.type === 'vacation' ? 'bg-white shadow text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🏖️ Solicitar Vacaciones
                </button>
              </div>

              {/* Selector Proyecto */}
              {form.type === 'project' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-bold text-gray-500 uppercase">Proyecto</label>
                  <select 
                    className="block w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none mt-1" 
                    value={form.project_id} 
                    onChange={handleProjectChange} 
                    required
                  >
                    <option value="">-- Selecciona Proyecto --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    <option disabled>──────────────────</option>
                    <option value="NEW_PROJECT_TRIGGER" className="text-blue-600 font-bold">+ ✨ No aparece en la lista (Crear)</option>
                  </select>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha Inicio</label>
                  <input type="date" className="w-full p-2 border rounded mt-1" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required />
                </div>
                
                <div className="relative group">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    Fecha Fin
                    <span className="cursor-help text-gray-400 hover:text-blue-500">ⓘ</span>
                  </label>
                  
                  <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10">
                    Fecha tentativa. Ajustable según el proyecto.
                    <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                  </div>

                  <input type="date" className="w-full p-2 border rounded mt-1" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required />
                </div>
              </div>

              <button disabled={loading} className={`w-full text-white py-3 rounded-lg font-bold text-lg shadow transition ${form.type === 'project' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {loading ? 'Guardando...' : (form.type === 'project' ? 'Confirmar Asignación' : 'Registrar Vacaciones')}
              </button>
              
              {msg && <div className="text-center font-bold text-green-600 animate-pulse">{msg}</div>}
            </form>
          </div>

          {/* LISTA HISTORIAL */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">📅 Mis Registros Activos</h3>
            {myAllocations.length === 0 ? <p className="text-gray-400 text-sm text-center">No tienes registros.</p> : (
              <ul className="space-y-3">
                {myAllocations.map(item => (
                  <li key={item.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50 px-2 rounded transition">
                    <div>
                      <div className="font-bold text-gray-800 text-sm">
                        {item.type === 'vacation' ? '🏖️ Vacaciones' : `💻 ${item.projects?.name}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.start_date} <span className="text-gray-300">➜</span> {item.end_date}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-2 text-xs border rounded bg-white" title="Eliminar registro">🗑️</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}