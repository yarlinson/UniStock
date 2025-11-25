'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { implementosAPI, prestamosAPI, type Implemento, type Prestamo } from '../../lib/api';
import { isAdmin } from '../../lib/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function ReportesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [implementos, setImplementos] = useState<Implemento[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [implementosData, prestamosData] = await Promise.all([
        implementosAPI.getAll(),
        prestamosAPI.getMisPrestamos()
      ]);
      setImplementos(implementosData);
      setPrestamos(prestamosData);
    } catch (err) {
      setError('Error al cargar datos para reportes. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    router.push('/login');
  };

  // Estadísticas de implementos
  const statsImplementos = {
    total: implementos.length,
    disponibles: implementos.filter(imp => imp.estado === 'Disponible').length,
    prestados: implementos.filter(imp => imp.estado === 'Prestado').length,
    mantenimiento: implementos.filter(imp => imp.estado === 'Mantenimiento').length,
  };

  // Estadísticas por categoría
  const statsPorCategoria = implementos.reduce((acc, imp) => {
    acc[imp.categoria] = (acc[imp.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Estadísticas de préstamos
  const statsPrestamos = {
    total: prestamos.length,
    activos: prestamos.filter(p => p.estado === 'Activo').length,
    devueltos: prestamos.filter(p => p.estado === 'Devuelto').length,
    retrasados: prestamos.filter(p => p.estado === 'Retrasado').length,
  };

  // Implementos más prestados
  const implementosMasPrestados = prestamos.reduce((acc, prestamo) => {
    const implementoId = prestamo.implementoId;
    acc[implementoId] = {
      nombre: prestamo.implemento.nombre,
      cantidad: (acc[implementoId]?.cantidad || 0) + 1
    };
    return acc;
  }, {} as Record<number, { nombre: string; cantidad: number }>);

  const topImplementos = Object.values(implementosMasPrestados)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // Préstamos por mes (últimos 6 meses)
  const prestamosPorMes = prestamos.reduce((acc, prestamo) => {
    const fecha = new Date(prestamo.fechaPrestamo);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const meses = Object.keys(prestamosPorMes)
    .sort()
    .slice(-6)
    .map(mes => {
      const [año, mesNum] = mes.split('-');
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return { mes: nombresMeses[parseInt(mesNum) - 1], cantidad: prestamosPorMes[mes] };
    });

  const maxPrestamosMes = Math.max(...meses.map(m => m.cantidad), 1);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const userIsAdmin = isAdmin(user);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex-1 flex flex-col h-full">
        <Header user={user} onLogout={handleLogout} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
              <p className="text-sm text-gray-600 mt-1">
                Análisis detallado del inventario y préstamos
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Implementos</p>
                        <p className="text-2xl font-bold text-gray-900">{statsImplementos.total}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Disponibles</p>
                        <p className="text-2xl font-bold text-green-600">{statsImplementos.disponibles}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">En Préstamo</p>
                        <p className="text-2xl font-bold text-yellow-600">{statsImplementos.prestados}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Préstamos</p>
                        <p className="text-2xl font-bold text-purple-600">{statsPrestamos.total}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráficas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfica de estados de implementos */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Estados de Implementos</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Disponibles</span>
                          <span className="text-sm font-medium text-gray-900">
                            {statsImplementos.disponibles} ({statsImplementos.total > 0 ? Math.round((statsImplementos.disponibles / statsImplementos.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-600 h-3 rounded-full transition-all"
                            style={{ width: `${statsImplementos.total > 0 ? (statsImplementos.disponibles / statsImplementos.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Prestados</span>
                          <span className="text-sm font-medium text-gray-900">
                            {statsImplementos.prestados} ({statsImplementos.total > 0 ? Math.round((statsImplementos.prestados / statsImplementos.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-yellow-600 h-3 rounded-full transition-all"
                            style={{ width: `${statsImplementos.total > 0 ? (statsImplementos.prestados / statsImplementos.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Mantenimiento</span>
                          <span className="text-sm font-medium text-gray-900">
                            {statsImplementos.mantenimiento} ({statsImplementos.total > 0 ? Math.round((statsImplementos.mantenimiento / statsImplementos.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-600 h-3 rounded-full transition-all"
                            style={{ width: `${statsImplementos.total > 0 ? (statsImplementos.mantenimiento / statsImplementos.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gráfica de estados de préstamos */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Estados de Préstamos</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Activos</span>
                          <span className="text-sm font-medium text-gray-900">
                            {statsPrestamos.activos} ({statsPrestamos.total > 0 ? Math.round((statsPrestamos.activos / statsPrestamos.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-600 h-3 rounded-full transition-all"
                            style={{ width: `${statsPrestamos.total > 0 ? (statsPrestamos.activos / statsPrestamos.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Devueltos</span>
                          <span className="text-sm font-medium text-gray-900">
                            {statsPrestamos.devueltos} ({statsPrestamos.total > 0 ? Math.round((statsPrestamos.devueltos / statsPrestamos.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gray-600 h-3 rounded-full transition-all"
                            style={{ width: `${statsPrestamos.total > 0 ? (statsPrestamos.devueltos / statsPrestamos.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Retrasados</span>
                          <span className="text-sm font-medium text-gray-900">
                            {statsPrestamos.retrasados} ({statsPrestamos.total > 0 ? Math.round((statsPrestamos.retrasados / statsPrestamos.total) * 100) : 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-600 h-3 rounded-full transition-all"
                            style={{ width: `${statsPrestamos.total > 0 ? (statsPrestamos.retrasados / statsPrestamos.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gráfica de barras - Préstamos por mes */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Préstamos por Mes</h2>
                    <div className="h-64 flex items-end justify-between gap-2">
                      {meses.length > 0 ? (
                        meses.map((item, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col items-center justify-end" style={{ height: '200px' }}>
                              <div
                                className="w-full bg-red-600 rounded-t transition-all hover:bg-red-700"
                                style={{ 
                                  height: `${(item.cantidad / maxPrestamosMes) * 100}%`,
                                  minHeight: item.cantidad > 0 ? '4px' : '0'
                                }}
                                title={`${item.cantidad} préstamos`}
                              ></div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 text-center">
                              <div className="font-medium">{item.mes}</div>
                              <div className="text-gray-500">{item.cantidad}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center text-gray-500 py-8">
                          No hay datos de préstamos por mes
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gráfica circular - Implementos por categoría */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Implementos por Categoría</h2>
                    <div className="space-y-3">
                      {Object.entries(statsPorCategoria).length > 0 ? (
                        Object.entries(statsPorCategoria)
                          .sort(([, a], [, b]) => b - a)
                          .map(([categoria, cantidad], index) => {
                            const porcentaje = (cantidad / statsImplementos.total) * 100;
                            const colores = ['bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600', 'bg-pink-600'];
                            const color = colores[index % colores.length];
                            
                            return (
                              <div key={categoria}>
                                <div className="flex justify-between mb-2">
                                  <span className="text-sm text-gray-600">{categoria}</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {cantidad} ({Math.round(porcentaje)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className={`${color} h-3 rounded-full transition-all`}
                                    style={{ width: `${porcentaje}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          No hay implementos registrados
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top implementos más prestados */}
                {topImplementos.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Implementos Más Prestados</h2>
                    <div className="space-y-3">
                      {topImplementos.map((item, index) => {
                        const maxCantidad = Math.max(...topImplementos.map(i => i.cantidad), 1);
                        const porcentaje = (item.cantidad / maxCantidad) * 100;
                        
                        return (
                          <div key={index}>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{item.nombre}</span>
                              <span className="text-sm text-gray-600">{item.cantidad} préstamo(s)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${porcentaje}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tabla de estadísticas detalladas */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen Detallado</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Inventario</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Total de implementos</span>
                          <span className="font-medium text-gray-900">{statsImplementos.total}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Disponibles</span>
                          <span className="font-medium text-green-600">{statsImplementos.disponibles}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">En préstamo</span>
                          <span className="font-medium text-yellow-600">{statsImplementos.prestados}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">En mantenimiento</span>
                          <span className="font-medium text-red-600">{statsImplementos.mantenimiento}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Préstamos</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Total de préstamos</span>
                          <span className="font-medium text-gray-900">{statsPrestamos.total}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Activos</span>
                          <span className="font-medium text-green-600">{statsPrestamos.activos}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Devueltos</span>
                          <span className="font-medium text-gray-600">{statsPrestamos.devueltos}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Retrasados</span>
                          <span className="font-medium text-red-600">{statsPrestamos.retrasados}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


