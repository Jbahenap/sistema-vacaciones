'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabaseUrl = 'https://mqnjtbtcmwjfuuyqipsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmp0YnRjbXdqZnV1eXFpcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk2OTcsImV4cCI6MjA3OTc2NTY5N30.kO6KfC_17AuF_SYpOQmF8VKnUzabnusDOXq4CrQsC_s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  // --- NUEVO: ESTADO DEL BUSCADOR ---
  const [searchTerm, setSearchTerm] = useState('');

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeProjects: 0,
    peopleOnVacation: 0,
    peopleBench: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: emps } = await supabase.from('employees').select('*').order('name');
    const { data: allocs } = await supabase.from('allocations').select('*, projects(name, client, color_code)');
    const { data: projs } = await supabase.from('projects').select('*');
    
    setEmployees(emps || []);
    setAllocations(allocs || []);
    setProjects(projs || []);
    calculateStats(emps || [], allocs || [], projs || []);
    setLoading(false);
  };

  const calculateStats = (emps: any[], allocs: any[], projs: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    const onVacation = emps.filter(e => allocs.some(a => a.employee_id === e.id && a.type === 'vacation' && a.start_date <= today && a.end_date >= today)).length;
    const assigned = emps.filter(e => allocs.some(a => a.employee_id === e.id && a.type === 'project' && a.start_date <= today && a.end_date >= today)).length;

    setStats({
      totalEmployees: emps.length,
      activeProjects: projs.length,
      peopleOnVacation: onVacation,
      peopleBench: emps.length - (onVacation + assigned)
    });
  };

  // --- FILTRADO DE EMPLEADOS ---
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const lastDay = new Date(year, month + 1, 0);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const today = new Date();

  const getStatusForDay = (empId: string, day: Date) => {
    return allocations.find(alloc => {
      if (alloc.employee_id !== empId) return false;
      const checkDate = day.toISOString().split('T')[0]; 
      return checkDate >= alloc.start_date && checkDate <= alloc.end_date;
    });
  };

  const getActiveAllocation = (empId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return allocations.find(alloc => alloc.employee_id === empId && alloc.end_date >= todayStr);
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // --- SKELETON LOADER (MEJORA VISUAL) ---
  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      <div className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-slate-200 rounded-xl animate-pulse"></div>
    </div>
  );

  const activeAlloc = selectedEmp ? getActiveAllocation(selectedEmp.id) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      
      {/* HEADER + KPIs */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Operativo</h1>
              <p className="text-slate-500 mt-1 text-sm">Vista general de recursos y disponibilidad.</p>
            </div>
            
            {/* BARRA DE NAVEGACIÓN MES */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
               <button onClick={prevMonth} className="px-3 py-1 hover:bg-white rounded-md shadow-sm transition text-slate-600">◀</button>
               <span className="px-4 py-1 font-bold text-slate-700 min-w-[140px] text-center uppercase text-sm flex items-center justify-center">
                 {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
               </span>
               <button onClick={nextMonth} className="px-3 py-1 hover:bg-white rounded-md shadow-sm transition text-slate-600">▶</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Total Headcount" value={stats.totalEmployees} icon="👥" color="blue" />
            <KpiCard title="Proyectos Activos" value={stats.activeProjects} icon="🚀" color="indigo" />
            <KpiCard title="Ausencias Hoy" value={stats.peopleOnVacation} icon="🏖️" color="rose" />
            <KpiCard title="En Bench (Disp)" value={stats.peopleBench} icon="🟢" color="emerald" />
          </div>
        </div>
      </div>

      {/* --- BARRA DE HERRAMIENTAS (NUEVO) --- */}
      <div className="max-w-7xl mx-auto px-4 mt-8 mb-4 flex justify-between items-center">
        
        {/* BUSCADOR */}
        <div className="relative group w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-slate-400">🔍</span>
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
            placeholder="Buscar por nombre o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button onClick={goToToday} className="text-xs bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm">
            Hoy: {today.toLocaleDateString('es-ES')}
        </button>
      </div>

      {/* --- TABLERO --- */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              
              <div className="flex border-b border-slate-200">
                <div className="w-64 flex-shrink-0 bg-slate-50 p-4 font-bold text-slate-500 text-xs uppercase tracking-wider sticky left-0 z-20 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Colaborador
                </div>
                {daysInMonth.map(day => {
                  const isToday = day.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6; 
                  return (
                    <div key={day.toISOString()} className={`w-10 flex-shrink-0 text-center border-r border-slate-100 py-3 flex flex-col items-center justify-center ${isToday ? 'bg-blue-50' : 'bg-white'} ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                      <span className="text-[10px] text-slate-400 font-bold mb-1">{day.toLocaleDateString('es-ES', { weekday: 'narrow' }).charAt(0)}</span>
                      <span className={`text-sm font-bold ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-700'}`}>{day.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic">No se encontraron colaboradores con "{searchTerm}"</div>
              ) : (
                filteredEmployees.map(emp => (
                  <div key={emp.id} className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <div 
                      onClick={() => setSelectedEmp(emp)}
                      className="w-64 flex-shrink-0 bg-white p-3 flex items-center gap-3 sticky left-0 z-10 cursor-pointer border-r border-slate-200 group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate">{emp.name}</div>
                        <div className="text-xs text-slate-400 truncate">{emp.role}</div>
                      </div>
                    </div>

                    {daysInMonth.map(day => {
                      const status = getStatusForDay(emp.id, day);
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      
                      return (
                        <div key={day.toISOString()} className={`w-10 flex-shrink-0 border-r border-slate-100 relative h-14 ${isWeekend ? 'bg-slate-50/30' : ''}`}>
                          {status && (
                            <div 
                              className="absolute inset-y-1 inset-x-0 mx-0.5 rounded-md shadow-sm opacity-90 hover:opacity-100 transition-all cursor-pointer"
                              style={{ backgroundColor: status.type === 'vacation' ? '#f43f5e' : (status.projects?.color_code || '#3b82f6') }}
                              title={status.type === 'vacation' ? 'Vacaciones' : status.projects?.name}
                            ></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POP-UP (Mismo código de antes) */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="relative h-24 bg-slate-800">
               <button onClick={() => setSelectedEmp(null)} className="absolute top-3 right-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
            </div>
            <div className="px-8 pb-8 -mt-12 flex flex-col items-center">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-800 z-10">
                {selectedEmp.name.charAt(0)}
              </div>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{selectedEmp.name}</h2>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{selectedEmp.role}</p>

              <div className="w-full mt-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <span className="p-2 bg-white rounded-lg shadow-sm text-lg">📧</span>
                     <div className="text-sm">
                       <p className="text-slate-400 text-xs font-bold uppercase">Email</p>
                       <p className="text-slate-700 font-medium">{selectedEmp.email || '-'}</p>
                     </div>
                   </div>
                </div>

                <div className={`p-4 rounded-xl border-l-4 shadow-sm ${activeAlloc?.type === 'vacation' ? 'bg-rose-50 border-rose-500' : 'bg-blue-50 border-blue-600'}`}>
                  <p className="text-xs font-bold uppercase mb-1 opacity-70">
                    {activeAlloc ? (activeAlloc.type === 'vacation' ? '🔴 Estado Actual' : '🔵 Proyecto Actual') : '⚪ Disponibilidad'}
                  </p>
                  {activeAlloc ? (
                    <>
                      <p className="text-lg font-bold text-slate-800">
                        {activeAlloc.type === 'vacation' ? 'Ausente (Vacaciones)' : activeAlloc.projects?.name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{activeAlloc.projects?.client}</p>
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/60 rounded-lg text-xs font-mono font-bold text-slate-600">
                        📅 {activeAlloc.start_date} ➜ {activeAlloc.end_date}
                      </div>
                    </>
                  ) : (
                     <div className="flex items-center gap-2 text-emerald-600 font-bold">
                       <span>🟢</span> Disponible / En Bench
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para Tarjetas KPI (para que el código quede limpio)
function KpiCard({ title, value, icon, color }: any) {
  const colorClasses: any = {
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50",
    rose: "text-rose-600 bg-rose-50",
    emerald: "text-emerald-600 bg-emerald-50",
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg text-xl ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
}