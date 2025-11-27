'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { prestamosAPI, implementosAPI, usuariosAPI, type Prestamo, type Implemento, type Usuario } from '../../lib/api';
import { isAdmin } from '../../lib/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function PrestamosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadPrestamos();

    // Recargar préstamos cada 30 segundos para detectar cambios de estado
    const interval = setInterval(() => {
      loadPrestamos();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const loadPrestamos = async () => {
    try {
      setLoading(true);
      setError('');
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      // Si es admin, obtener todos los préstamos; si no, obtener solo los suyos
      const data = isAdmin(user) 
        ? await prestamosAPI.getTodos() 
        : await prestamosAPI.getMisPrestamos();
      setPrestamos(data);
    } catch (err) {
      setError('Error al cargar préstamos. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDevolucion = async (prestamoId: number) => {
    const prestamo = prestamos.find(p => p.id === prestamoId);
    const implementoNombre = prestamo?.implemento.nombre || 'este implemento';
    
    if (!confirm(`¿Estás seguro de registrar la devolución de "${implementoNombre}"?\n\nEl implemento volverá a estar disponible.`)) {
      return;
    }

    const toastId = toast.loading('Registrando devolución...');
    try {
      await prestamosAPI.devolucion(prestamoId);
      toast.success('Devolución registrada correctamente', { id: toastId });
      await loadPrestamos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar devolución', { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    router.push('/login');
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-800';
      case 'Devuelto':
        return 'bg-gray-100 text-gray-800';
      case 'Retrasado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPrestamos = filterEstado === 'Todos' 
    ? prestamos 
    : prestamos.filter(p => p.estado === filterEstado);

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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userIsAdmin ? 'Gestión de Préstamos' : 'Mis Préstamos'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {userIsAdmin 
                    ? 'Administra todos los préstamos del sistema' 
                    : 'Consulta el estado de tus préstamos activos'}
                </p>
              </div>
              {userIsAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  + Nuevo Préstamo
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setFilterEstado('Todos')}
                className={`px-4 py-2 rounded-lg ${
                  filterEstado === 'Todos' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterEstado('Activo')}
                className={`px-4 py-2 rounded-lg ${
                  filterEstado === 'Activo' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFilterEstado('Devuelto')}
                className={`px-4 py-2 rounded-lg ${
                  filterEstado === 'Devuelto' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Devueltos
              </button>
              <button
                onClick={() => setFilterEstado('Retrasado')}
                className={`px-4 py-2 rounded-lg ${
                  filterEstado === 'Retrasado' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Retrasados
              </button>
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
              <div className="space-y-4">
                {filteredPrestamos.map((prestamo) => (
                  <div key={prestamo.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Imagen del implemento */}
                      <div className="relative w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {prestamo.implemento.imagenUrl ? (
                          <Image
                            src={prestamo.implemento.imagenUrl}
                            alt={prestamo.implemento.nombre}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Información del préstamo */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {/* Mostrar usuario si es admin */}
                            {userIsAdmin && (prestamo as any).usuario && (
                              <>
                                <p className="text-sm text-gray-500">Usuario</p>
                                <p className="text-sm font-medium text-gray-900 mb-2">{(prestamo as any).usuario.nombre}</p>
                                <p className="text-xs text-gray-500">{(prestamo as any).usuario.email}</p>
                              </>
                            )}
                            <h3 className="text-xl font-semibold text-gray-900 mt-2">{prestamo.implemento.nombre}</h3>
                            <p className="text-sm text-gray-500">Código: {prestamo.implemento.codigo}</p>
                            <p className="text-sm text-gray-600">{prestamo.implemento.categoria}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(prestamo.estado)}`}>
                            {prestamo.estado}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Fecha de Préstamo</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(prestamo.fechaPrestamo)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Fecha de Devolución Programada</p>
                            <p className={`text-sm font-medium ${
                              prestamo.estado === 'Activo' && new Date(prestamo.fechaDevolucionProgramada) < new Date()
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }`}>
                              {formatDate(prestamo.fechaDevolucionProgramada)}
                            </p>
                          </div>
                          {prestamo.fechaDevolucionReal && (
                            <div>
                              <p className="text-sm text-gray-500">Fecha de Devolución Real</p>
                              <p className="text-sm font-medium text-gray-900">{formatDate(prestamo.fechaDevolucionReal)}</p>
                            </div>
                          )}
                          {prestamo.estado === 'Activo' && (
                            <div>
                              <p className="text-sm text-gray-500">Estado del Implemento</p>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                prestamo.implemento.estado === 'Prestado'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {prestamo.implemento.estado}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Indicador de días restantes para préstamos activos o retrasados */}
                        {(prestamo.estado === 'Activo' || prestamo.estado === 'Retrasado') && (() => {
                          const fechaDevolucion = new Date(prestamo.fechaDevolucionProgramada);
                          const hoy = new Date();
                          const diasRestantes = Math.ceil((fechaDevolucion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                          const estaRetrasado = diasRestantes < 0;
                          
                          return (
                            <div className="mt-4 space-y-2">
                              <div className={`text-sm font-medium ${
                                estaRetrasado 
                                  ? 'text-red-600' 
                                  : diasRestantes <= 3 
                                    ? 'text-yellow-600' 
                                    : 'text-green-600'
                              }`}>
                                {estaRetrasado 
                                  ? `⚠️ Retrasado por ${Math.abs(diasRestantes)} día(s)`
                                  : diasRestantes <= 3
                                    ? `⚠️ Vence en ${diasRestantes} día(s)`
                                    : `✓ Vence en ${diasRestantes} día(s)`
                                }
                              </div>
                              {userIsAdmin && (
                                <button
                                  onClick={() => handleDevolucion(prestamo.id)}
                                  className={`px-4 py-2 rounded-lg transition-colors text-white ${
                                    estaRetrasado
                                      ? 'bg-red-600 hover:bg-red-700'
                                      : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                >
                                  Registrar Devolución
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredPrestamos.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No se encontraron préstamos.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal para crear préstamo (solo Admin) */}
      {showCreateModal && userIsAdmin && (
        <CreatePrestamoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPrestamos();
          }}
        />
      )}
    </div>
  );
}

// Componente Modal para crear préstamo
function CreatePrestamoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  // Estado para el modal
  const [formData, setFormData] = useState({
    usuarioId: '',
    usuarioSeleccionado: null as Usuario | null,
    implementoId: '',
    implementoSeleccionado: null as Implemento | null,
    fechaDevolucionProgramada: ''
  });
  const [implementos, setImplementos] = useState<Implemento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [busquedaImplemento, setBusquedaImplemento] = useState('');
  const [mostrarResultadosUsuario, setMostrarResultadosUsuario] = useState(false);
  const [mostrarResultadosImplemento, setMostrarResultadosImplemento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadImplementos();
  }, []);

  useEffect(() => {
    if (busquedaUsuario.trim().length >= 2) {
      buscarUsuarios(busquedaUsuario);
    } else {
      setUsuarios([]);
      setMostrarResultadosUsuario(false);
    }
  }, [busquedaUsuario]);

  useEffect(() => {
    if (busquedaImplemento.trim().length >= 1) {
      filtrarImplementos(busquedaImplemento);
    } else {
      setMostrarResultadosImplemento(false);
    }
  }, [busquedaImplemento]);

  const loadImplementos = async () => {
    try {
      const data = await implementosAPI.getAll();
      // Solo mostrar implementos disponibles
      setImplementos(data.filter(imp => imp.estado === 'Disponible'));
    } catch (err) {
      console.error('Error al cargar implementos:', err);
    }
  };

  const buscarUsuarios = async (termino: string) => {
    try {
      // Obtener todos los usuarios del endpoint correcto
      const todosUsuarios = await usuariosAPI.getAll();
      const terminoLower = termino.toLowerCase();
      
      // Filtrar usuarios que coincidan
      const resultados = todosUsuarios.filter(usuario => 
        usuario.id.toString().includes(termino) ||
        usuario.nombre.toLowerCase().includes(terminoLower) ||
        usuario.email.toLowerCase().includes(terminoLower)
      );
      
      setUsuarios(resultados);
      setMostrarResultadosUsuario(resultados.length > 0);
    } catch (err) {
      console.error('Error al buscar usuarios:', err);
      setUsuarios([]);
      setMostrarResultadosUsuario(false);
    }
  };

  const filtrarImplementos = (termino: string) => {
    if (termino.trim().length === 0) {
      setMostrarResultadosImplemento(false);
      return;
    }
    const terminoLower = termino.toLowerCase();
    const implementosFiltrados = implementos.filter(imp => 
      imp.nombre.toLowerCase().includes(terminoLower) ||
      imp.codigo.toLowerCase().includes(terminoLower) ||
      imp.categoria.toLowerCase().includes(terminoLower)
    );
    setMostrarResultadosImplemento(implementosFiltrados.length > 0);
  };

  const getImplementosFiltrados = () => {
    if (busquedaImplemento.trim().length === 0) {
      return [];
    }
    const terminoLower = busquedaImplemento.toLowerCase();
    return implementos.filter(imp => 
      imp.nombre.toLowerCase().includes(terminoLower) ||
      imp.codigo.toLowerCase().includes(terminoLower) ||
      imp.categoria.toLowerCase().includes(terminoLower)
    );
  };

  const seleccionarUsuario = (usuario: Usuario) => {
    setFormData({
      ...formData,
      usuarioId: usuario.id.toString(),
      usuarioSeleccionado: usuario
    });
    setBusquedaUsuario(`${usuario.nombre} (${usuario.email})`);
    setMostrarResultadosUsuario(false);
  };

  const seleccionarImplemento = (implemento: Implemento) => {
    setFormData({
      ...formData,
      implementoId: implemento.id.toString(),
      implementoSeleccionado: implemento
    });
    setBusquedaImplemento(`${implemento.nombre} - ${implemento.codigo}`);
    setMostrarResultadosImplemento(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar que se haya seleccionado un usuario
    if (!formData.usuarioId || !formData.usuarioSeleccionado) {
      setError('Por favor, selecciona un usuario de la lista');
      setLoading(false);
      return;
    }

    // Validar que se haya seleccionado un implemento
    if (!formData.implementoId || !formData.implementoSeleccionado) {
      setError('Por favor, selecciona un implemento de la lista');
      setLoading(false);
      return;
    }

    const toastId = toast.loading('Registrando préstamo...');
    try {
      // datetime-local devuelve hora en zona local del cliente: "YYYY-MM-DDTHH:mm"
      // Convertir a UTC para enviar al servidor
      const localDateTime = new Date(formData.fechaDevolucionProgramada);
      
      // Restar el offset de zona horaria para obtener UTC
      const utcDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000);
      const fechaISO = utcDateTime.toISOString();
      
      // Obtener la fecha actual del cliente en UTC también
      const ahora = new Date();
      const fechaPrestamoUTC = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString();
      
      await prestamosAPI.registrar({
        usuarioId: parseInt(formData.usuarioId),
        implementoId: parseInt(formData.implementoId),
        fechaDevolucionProgramada: fechaISO,
        fechaPrestamo: fechaPrestamoUTC
      });
      toast.success('Préstamo registrado correctamente', { id: toastId });
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar préstamo', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Obtener fecha mínima (hoy) en formato para input datetime-local
  const today = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuevo Préstamo</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Búsqueda de Usuario */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario *
            </label>
            <input
              type="text"
              required
              value={busquedaUsuario}
              onChange={(e) => {
                setBusquedaUsuario(e.target.value);
                if (e.target.value === '') {
                  setFormData({ ...formData, usuarioId: '', usuarioSeleccionado: null });
                }
              }}
              onFocus={() => {
                if (busquedaUsuario.trim().length >= 2 && usuarios.length > 0) {
                  setMostrarResultadosUsuario(true);
                }
              }}
              onBlur={() => {
                // Delay para permitir el click en los resultados
                setTimeout(() => setMostrarResultadosUsuario(false), 200);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
              placeholder="Buscar por ID, nombre o correo..."
            />
            <p className="text-xs text-gray-500 mt-1">Busca por ID, nombre o correo electrónico</p>
            
            {/* Indicador de usuario seleccionado */}
            {formData.usuarioSeleccionado && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-medium">✓ Usuario seleccionado:</span> {formData.usuarioSeleccionado.nombre} ({formData.usuarioSeleccionado.email})
                </p>
              </div>
            )}
            
            {/* Resultados de búsqueda de usuarios */}
            {mostrarResultadosUsuario && usuarios.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    onClick={() => seleccionarUsuario(usuario)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{usuario.nombre}</p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">ID: {usuario.id}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                          usuario.rol === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.rol}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {mostrarResultadosUsuario && busquedaUsuario.trim().length >= 2 && usuarios.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-500">No se encontraron usuarios</p>
              </div>
            )}
          </div>

          {/* Búsqueda de Implemento */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Implemento *
            </label>
            <input
              type="text"
              required
              value={busquedaImplemento}
              onChange={(e) => {
                setBusquedaImplemento(e.target.value);
                if (e.target.value === '') {
                  setFormData({ ...formData, implementoId: '', implementoSeleccionado: null });
                }
              }}
              onFocus={() => {
                if (busquedaImplemento.trim().length >= 1) {
                  filtrarImplementos(busquedaImplemento);
                }
              }}
              onBlur={() => {
                setTimeout(() => setMostrarResultadosImplemento(false), 200);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
              placeholder="Buscar implemento disponible..."
            />
            <p className="text-xs text-gray-500 mt-1">Busca por nombre, código o categoría</p>
            
            {/* Indicador de implemento seleccionado */}
            {formData.implementoSeleccionado && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-medium">✓ Implemento seleccionado:</span> {formData.implementoSeleccionado.nombre} - {formData.implementoSeleccionado.codigo}
                </p>
              </div>
            )}
            
            {/* Resultados de búsqueda de implementos */}
            {mostrarResultadosImplemento && getImplementosFiltrados().length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {getImplementosFiltrados().map((implemento) => (
                  <div
                    key={implemento.id}
                    onClick={() => seleccionarImplemento(implemento)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{implemento.nombre}</p>
                        <p className="text-sm text-gray-500">Código: {implemento.codigo} | {implemento.categoria}</p>
                      </div>
                      <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        Disponible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {mostrarResultadosImplemento && busquedaImplemento.trim().length > 0 && getImplementosFiltrados().length === 0 && implementos.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-500">No se encontraron implementos con ese término</p>
              </div>
            )}
            {implementos.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1">⚠️ No hay implementos disponibles para préstamo</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Devolución Programada *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.fechaDevolucionProgramada}
              onChange={(e) => setFormData({ ...formData, fechaDevolucionProgramada: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">Fecha y hora programada para la devolución del implemento</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
