'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// TUS LLAVES
const supabaseUrl = 'https://mqnjtbtcmwjfuuyqipsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbmp0YnRjbXdqZnV1eXFpcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODk2OTcsImV4cCI6MjA3OTc2NTY5N30.kO6KfC_17AuF_SYpOQmF8VKnUzabnusDOXq4CrQsC_s';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Traer empleados
    const { data: emps } = await supabase.from('employees').select('*').order('name');
    
    // Traer asignaciones y proyectos
    const { data: allocs } = await supabase
      .from('allocations')
      .select('*, projects(name, color_code)');
      
    setEmployees(emps || []);
    setAllocations(allocs || []);
    setLoading(false);
  };

  // --- LÓGICA DE CALENDARIO ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const today = new Date();

  // Función clave: ¿Qué pintamos en esta celda?
  const getStatusForDay = (empId: string, day: Date) => {
    return allocations.find(alloc => {
      if (alloc.employee_id !== empId) return false;

      // Comparar fechas como texto YYYY-MM-DD para evitar errores de zona horaria
      const checkDate = day.toISOString().split('T')[0]; 
      const start = alloc.start_date; 
      const end = alloc.end_date;

      return checkDate >= start && checkDate <= end;
    });
  };

  // Controles de navegación
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando el tablero... ⏳</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* CABECERA DE CONTROLES */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📅 Cronograma Global
        </h1>
        
        <div className="flex items-center space-x-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-xl" title="Mes Anterior">⬅️</button>
          <div className="text-lg font-bold text-gray-700 w-40 text-center capitalize">
            {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-xl" title="Mes Siguiente">➡️</button>
          
          <button onClick={goToToday} className="ml-4 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold hover:bg-blue-200 transition">
            Ir a Hoy
          </button>
        </div>
      </div>

      {/* EL TABLERO (SCROLLABLE) */}
      <div className="flex-1 overflow-auto p-4">
        <div className="inline-block min-w-full align-middle">
          <div className="border rounded-lg overflow-hidden bg-white shadow">
            
            {/* ENCABEZADO DE DÍAS */}
            <div className="flex">
              {/* Esquina vacía (Nombre) */}
              <div className="w-56 flex-shrink-0 bg-gray-100 border-r border-b p-3 font-bold text-gray-500 sticky left-0 z-20">
                Colaborador
              </div>
              
              {/* Días */}
              {daysInMonth.map(day => {
                const isToday = day.toISOString().split('T')[0] === today.toISOString().split('T')[0];
                const isWeekend = day.getDay() === 0 || day.getDay() === 6; 

                return (
                  <div key={day.toISOString()} 
                    className={`w-10 flex-shrink-0 text-center border-r border-b p-1 flex flex-col justify-center h-12
                      ${isToday ? 'bg-yellow-100' : 'bg-white'}
                      ${isWeekend ? 'bg-gray-50' : ''}
                    `}
                  >
                    <span className="text-[10px] text-gray-400 uppercase">
                      {day.toLocaleDateString('es-ES', { weekday: 'narrow' })}
                    </span>
                    <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* FILAS DE EMPLEADOS */}
            {employees.map(emp => (
              <div key={emp.id} className="flex hover:bg-gray-50 transition-colors">
                
                {/* Columna Nombre (Sticky a la izquierda) */}
                <div className="w-56 flex-shrink-0 bg-white border-r border-b p-3 flex flex-col justify-center sticky left-0 z-10">
                  <div className="font-bold text-sm text-gray-800 truncate" title={emp.name}>{emp.name}</div>
                  <div className="text-xs text-gray-400 truncate">{emp.role}</div>
                </div>

                {/* Celdas del Calendario */}
                {daysInMonth.map(day => {
                  const status = getStatusForDay(emp.id, day);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  
                  // Definir estilos
                  let cellStyle = {};
                  let title = "";

                  if (status) {
                    if (status.type === 'vacation') {
                      cellStyle = { backgroundColor: '#F87171' }; // Rojo
                      title = "Vacaciones";
                    } else if (status.type === 'project') {
                      cellStyle = { backgroundColor: status.projects?.color_code || '#3B82F6' }; // Color del proyecto
                      title = status.projects?.name;
                    }
                  }

                  return (
                    <div key={day.toISOString()} 
                      className="w-10 flex-shrink-0 h-12 border-r border-b relative"
                      style={!status ? {backgroundColor: isWeekend ? '#f9fafb' : 'white'} : undefined}
                    >
                      {/* EL BLOQUE DE COLOR */}
                      {status && (
                        <div 
                          className="absolute inset-px rounded-sm shadow-sm cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                          style={cellStyle}
                          title={`${title} (${status.start_date} al ${status.end_date})`}
                        >
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            ))}

            {employees.length === 0 && (
              <div className="p-10 text-center text-gray-400">
                No hay empleados registrados.
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* LEYENDA */}
      <div className="bg-white p-2 border-t flex justify-center space-x-6 text-xs text-gray-500">
        <div className="flex items-center"><div className="w-3 h-3 bg-red-400 rounded mr-2"></div> Vacaciones</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div> Proyecto</div>
        <div className="flex items-center"><div className="w-3 h-3 bg-gray-100 border rounded mr-2"></div> Fin de Semana</div>
      </div>

    </div>
  );
}