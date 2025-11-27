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
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // UI States
  const [showProjectForm, setShowProjectForm] = useState(false); // <--- NUEVO: Controla el panel

  // Formulario Registro
  const [form, setForm] = useState({
    type: 'project',
    project_id: '',
    start_date: '',
    end_date: ''
  });

  // Formulario Nuevo Proyecto (NUEVO)
  const [projForm, setProjForm] = useState({
    name: '',
    client: '',
    color_code: '#3B82F6'
  });

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
        alert('Tu correo no está registrado como empleado.');
        return;
      }

      setMyProfile(employee);
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

  // --- CREAR PROYECTO (LÓGICA NUEVA) ---
  const handleCreateProject = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    // Creamos el proyecto y pedimos que nos devuelva el dato creado (.select())
    const { data, error } = await supabase.from('projects').insert([projForm]).select();
    
    if (error) setMsg('❌ Error al crear proyecto');
    else {
      setMsg('✅ Proyecto creado con éxito');
      setProjForm({ name: '', client: '', color_code: '#3B82F6' });
      await loadProjects(); // Recargamos la lista
      
      // Magia: Seleccionamos el proyecto nuevo automáticamente
      if (data && data.length > 0) {
        setForm(prev => ({ ...prev, project_id: data[0].id }));
      }
      setShowProjectForm(false); // Cerramos el panel
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

  // --- CREAR ASIGNACIÓN ---
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

    if (error) setMsg('❌ Error al guardar');
    else {
      setMsg('✅ ¡Agenda actualizada!');
      loadMyAllocations(myProfile.id);
      setForm({ ...form, start_date: '', end_date: '' });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('¿Borrar este registro?')) return;
    await supabase.from('allocations').delete().eq('id', id);
    loadMyAllocations(myProfile.id);
  };

  if (!myProfile) return <div className="p-10 text-center text-gray-500">Cargando... ⏳</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-400">
          <h1 className="text-2xl font-bold text-gray-800">Hola, {myProfile.name} 👋</h1>
          <p className="text-gray-500">Gestiona tus tiempos desde aquí.</p>
        </div>

        {/* --- PANEL OCULTO: NUEVO PROYECTO --- */}
        {showProjectForm && (
          <div className="bg-blue-50 p-6 rounded-lg shadow border-2 border-blue-200 animate-fade-in-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-blue-800">🚀 Nuevo Proyecto</h2>
              <button onClick={() => setShowProjectForm(false)} className="text-gray-500 hover:text-red-500 font-bold">✕ Cancelar</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">Nombre del Proyecto</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Ej. Migración Cloud" value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})} required autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500">Cliente</label>
                    <input type="text" className="w-full p-2 border rounded" placeholder="Ej. Interno" value={projForm.client} onChange={e => setProjForm({...projForm, client: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500">Color</label>
                    <input type="color" className="w-full h-10 p-0 border rounded" value={projForm.color_code} onChange={e => setProjForm({...projForm, color_code: e.target.value})} />
                </div>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">
                Guardar Proyecto
              </button>
            </form>
          </div>
        )}

        {/* --- FORMULARIO PRINCIPAL --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4 text-gray-800">📝 Registrar Actividad</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">Voy a registrar:</label>
              <div className="flex space-x-4">
                <label className={`flex-1 border p-3 rounded cursor-pointer text-center font-bold transition ${form.type === 'project' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="radio" name="type" value="project" className="hidden" checked={form.type === 'project'} onChange={() => setForm({...form, type: 'project'})} />
                  💻 Proyecto
                </label>
                <label className={`flex-1 border p-3 rounded cursor-pointer text-center font-bold transition ${form.type === 'vacation' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="radio" name="type" value="vacation" className="hidden" checked={form.type === 'vacation'} onChange={() => setForm({...form, type: 'vacation'})} />
                  🏖️ Vacaciones
                </label>
              </div>
            </div>

            {form.type === 'project' && (
              <div className="animate-fade-in">
                <label className="text-sm font-bold text-gray-700 block mb-1">Selecciona el Proyecto</label>
                <select 
                  className="block w-full p-3 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.project_id} 
                  onChange={handleProjectChange} 
                  required
                >
                  <option value="">-- Elige uno --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  <option disabled>──────────────────</option>
                  <option value="NEW_PROJECT_TRIGGER" className="text-blue-600 font-bold bg-blue-50">+ ✨ Crear Nuevo Proyecto</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Desde</label>
                <input type="date" className="w-full p-2 border rounded" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Hasta</label>
                <input type="date" className="w-full p-2 border rounded" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required />
              </div>
            </div>

            <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold text-lg shadow transition">
              {loading ? 'Guardando...' : 'Confirmar Agenda'}
            </button>
            
            {msg && <div className="text-center font-bold text-green-600 animate-pulse">{msg}</div>}
          </form>
        </div>

        {/* LISTA DE MIS COSAS */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4 text-gray-800">📅 Mis Registros Activos</h2>
          {myAllocations.length === 0 ? (
            <p className="text-gray-400 text-center py-4 border-2 border-dashed rounded">No tienes nada agendado.</p>
          ) : (
            <ul className="space-y-3">
              {myAllocations.map(item => (
                <li key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition">
                  <div>
                    <div className="font-bold text-gray-800">
                      {item.type === 'vacation' ? '🏖️ Vacaciones' : `💻 ${item.projects?.name}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.start_date} al {item.end_date}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 p-2 text-sm border rounded hover:bg-white transition" title="Borrar">
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}