'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// TUS LLAVES
const supabaseUrl = 'https://mqnjtbtcmwjfuuyqipsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmp0YnRjbXdqZnV1eXFpcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk2OTcsImV4cCI6MjA3OTc2NTY5N30.kO6KfC_17AuF_SYpOQmF8VKnUzabnusDOXq4CrQsC_s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPage() {
  const router = useRouter();
  
  // --- ESTADOS ---
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  // VISIBILIDAD DE PANELES
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false); // <--- NUEVO

  // Formularios
  const [allocForm, setAllocForm] = useState({
    employee_id: '',
    type: 'project',
    project_id: '',
    start_date: '',
    end_date: ''
  });

  const [projForm, setProjForm] = useState({
    name: '',
    client: '',
    color_code: '#3B82F6'
  });

  const [empForm, setEmpForm] = useState({ // <--- NUEVO
    name: '',
    role: '',
    email: ''
  });

  // --- INICIO ---
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      refreshAll();
    }
    init();
  }, []);

  const refreshAll = () => {
    loadCatalogs();
    loadAllocations();
  };

  const loadCatalogs = async () => {
    const { data: emps } = await supabase.from('employees').select('*').order('name');
    const { data: projs } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setEmployees(emps || []);
    setProjects(projs || []);
  };

  const loadAllocations = async () => {
    const { data } = await supabase
      .from('allocations')
      .select('*, employees(name), projects(name)')
      .order('created_at', { ascending: false });
    setAllocations(data || []);
  };

  // --- LOGICA EMPLEADOS (ALTA Y BAJA) ---
  const handleCreateEmployee = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('employees').insert([empForm]).select();
    
    if (error) setMsg('❌ Error al crear empleado');
    else {
      setMsg('✅ Empleado registrado');
      setEmpForm({ name: '', role: '', email: '' });
      await loadCatalogs();
      // Auto-seleccionar y cerrar panel
      if (data && data.length > 0) setAllocForm(prev => ({ ...prev, employee_id: data[0].id }));
      setShowEmployeeForm(false);
    }
    setLoading(false);
  };

  const handleDeleteEmployee = async (id: string) => {
    if(!confirm('⚠️ ¿DAR DE BAJA? \nSe borrará el empleado y TODO su historial de vacaciones/proyectos.\nEsta acción no se puede deshacer.')) return;
    
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if(error) setMsg('❌ Error al borrar (¿Tiene datos vinculados?)');
    else {
      setMsg('🗑️ Empleado dado de baja');
      loadCatalogs();
      loadAllocations(); // Refrescar historial por si se borraron asignaciones
    }
  };

  // --- LOGICA PROYECTOS ---
  const handleCreateProject = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('projects').insert([projForm]).select();
    
    if (error) setMsg('❌ Error al crear proyecto');
    else {
      setMsg('✅ Proyecto creado');
      setProjForm({ name: '', client: '', color_code: '#3B82F6' });
      await loadCatalogs();
      if (data && data.length > 0) setAllocForm(prev => ({ ...prev, project_id: data[0].id }));
      setShowProjectForm(false);
    }
    setLoading(false);
  };

  // --- LOGICA ASIGNACIONES ---
  const handleCreateAlloc = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    const dataToSave: any = {
      employee_id: allocForm.employee_id,
      type: allocForm.type,
      start_date: allocForm.start_date,
      end_date: allocForm.end_date,
    };
    if (allocForm.type === 'project') dataToSave.project_id = allocForm.project_id;

    const { error } = await supabase.from('allocations').insert([dataToSave]);
    if (error) setMsg('❌ Error al asignar');
    else {
      setMsg('✅ Asignación guardada');
      loadAllocations();
    }
    setLoading(false);
  };

  const handleDeleteAlloc = async (id: string) => {
    if(!confirm('¿Borrar asignación?')) return;
    const { error } = await supabase.from('allocations').delete().eq('id', id);
    if(!error) loadAllocations();
  };

  // --- HANDLERS MENU MAGICO ---
  const handleEmployeeChange = (e: any) => {
    const value = e.target.value;
    if (value === 'NEW_EMPLOYEE_TRIGGER') {
      setShowEmployeeForm(true);
      setShowProjectForm(false); // Cierra el otro si estaba abierto
      setAllocForm({ ...allocForm, employee_id: '' });
    } else {
      setAllocForm({ ...allocForm, employee_id: value });
    }
  };

  const handleProjectChange = (e: any) => {
    const value = e.target.value;
    if (value === 'NEW_PROJECT_TRIGGER') {
      setShowProjectForm(true);
      setShowEmployeeForm(false); // Cierra el otro si estaba abierto
      setAllocForm({ ...allocForm, project_id: '' });
    } else {
      setAllocForm({ ...allocForm, project_id: value });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>

        {/* --- PANEL OCULTO: NUEVO EMPLEADO --- */}
        {showEmployeeForm && (
          <div className="bg-purple-50 p-6 rounded-lg shadow border-2 border-purple-200 animate-fade-in-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-800">👤 Gestión de Personal</h2>
              <button onClick={() => setShowEmployeeForm(false)} className="text-gray-500 hover:text-red-500 font-bold">✕ Cancelar</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Formulario Alta */}
              <form onSubmit={handleCreateEmployee} className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Nombre Completo</label>
                    <input type="text" className="w-full p-2 border rounded" placeholder="Ej. Luisa Lane" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} required autoFocus />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Rol / Puesto</label>
                    <input type="text" className="w-full p-2 border rounded" placeholder="Ej. Designer" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Email (Opcional)</label>
                    <input type="email" className="w-full p-2 border rounded" placeholder="correo@ntt.com" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} />
                  </div>
                </div>
                <button disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-bold">
                  + Dar de Alta
                </button>
              </form>

              {/* Lista para Bajas */}
              <div className="bg-white p-3 rounded border h-40 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">Plantilla Actual</h3>
                <ul>
                  {employees.map(emp => (
                    <li key={emp.id} className="flex justify-between items-center text-sm py-1 border-b">
                      <span>{emp.name}</span>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="text-gray-300 hover:text-red-500" title="Dar de baja">🗑️</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* --- PANEL OCULTO: NUEVO PROYECTO --- */}
        {showProjectForm && (
          <div className="bg-blue-50 p-6 rounded-lg shadow border-2 border-blue-200 animate-fade-in-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800">🚀 Gestión de Proyectos</h2>
              <button onClick={() => setShowProjectForm(false)} className="text-gray-500 hover:text-red-500 font-bold">✕ Cancelar</button>
            </div>
            <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-bold text-gray-500">Nombre</label>
                <input type="text" className="w-full p-2 border rounded" value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})} required autoFocus />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Cliente</label>
                <input type="text" className="w-full p-2 border rounded" value={projForm.client} onChange={e => setProjForm({...projForm, client: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Color</label>
                <div className="flex items-center space-x-2">
                  <input type="color" className="h-10 w-full p-0 border rounded" value={projForm.color_code} onChange={e => setProjForm({...projForm, color_code: e.target.value})} />
                </div>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold h-10">Guardar Proyecto</button>
            </form>
          </div>
        )}

        {/* --- PANEL PRINCIPAL --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🛠️ Asignar Recursos</h2>
            <form onSubmit={handleCreateAlloc} className="space-y-5">
              
              {/* SELECTOR DE EMPLEADO (AHORA CON MAGIA) */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Empleado</label>
                <select className="block w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none" 
                  value={allocForm.employee_id} 
                  onChange={handleEmployeeChange} 
                  required
                >
                  <option value="">-- Selecciona --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  <option disabled>──────────────────</option>
                  <option value="NEW_EMPLOYEE_TRIGGER" className="text-purple-600 font-bold bg-purple-50">+ ✨ Nuevo Empleado / Baja</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Tipo</label>
                    <select className="block w-full p-2 border border-gray-300 rounded" value={allocForm.type} onChange={e => setAllocForm({...allocForm, type: e.target.value})}>
                      <option value="project">💻 Proyecto</option>
                      <option value="vacation">🏖️ Vacaciones</option>
                    </select>
                 </div>

                 {allocForm.type === 'project' && (
                  <div className="animate-fade-in">
                    <label className="text-sm font-bold text-gray-700 block mb-1">Proyecto</label>
                    <select className="block w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={allocForm.project_id} 
                      onChange={handleProjectChange} 
                      required
                    >
                      <option value="">-- Selecciona --</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      <option disabled>──────────────────</option>
                      <option value="NEW_PROJECT_TRIGGER" className="text-blue-600 font-bold bg-blue-50">+ ✨ Crear Nuevo Proyecto</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Inicio</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded" value={allocForm.start_date} onChange={e => setAllocForm({...allocForm, start_date: e.target.value})} required />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Fin</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded" value={allocForm.end_date} onChange={e => setAllocForm({...allocForm, end_date: e.target.value})} required />
                </div>
              </div>

              <button disabled={loading} className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 font-bold transition shadow-sm">
                Guardar Asignación
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow h-[500px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📋 Historial Reciente</h2>
            <div className="overflow-y-auto flex-1 pr-2">
                <ul className="space-y-3">
                  {allocations.map(item => (
                    <li key={item.id} className="border-l-4 border-gray-300 pl-3 py-2 flex justify-between items-center hover:bg-gray-50 transition group" 
                        style={{borderColor: item.type==='project' ? (item.projects?.color_code || '#ddd') : '#ef4444'}}>
                      <div>
                        <div className="font-bold text-gray-800">{item.employees?.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.type === 'vacation' ? '🏖️ Vacaciones' : `💻 ${item.projects?.name}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {item.start_date} → {item.end_date}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAlloc(item.id)} className="text-gray-300 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition">🗑️</button>
                    </li>
                  ))}
                </ul>
            </div>
          </div>
        </div>

        {msg && (
          <div className="fixed bottom-5 right-5 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl animate-bounce font-bold flex items-center">
            {msg}
          </div>
        )}

      </div>
    </div>
  );
}