'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { implementosAPI, type Implemento } from '../../lib/api';
import { isAdmin } from '../../lib/auth';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function InventarioPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [implementos, setImplementos] = useState<Implemento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [implementoToEdit, setImplementoToEdit] = useState<Implemento | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    loadImplementos();
  }, [router]);

  const loadImplementos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await implementosAPI.getAll();
      setImplementos(data);
    } catch (err) {
      setError('Error al cargar implementos. Por favor, intenta de nuevo.');
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

  const handleDelete = async (id: number) => {
    const implemento = implementos.find(imp => imp.id === id);
    const nombre = implemento?.nombre || 'este implemento';
    
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?\n\nEsta acción no se puede deshacer y el implemento será eliminado permanentemente.`)) {
      return;
    }

    const toastId = toast.loading('Eliminando implemento...');
    try {
      await implementosAPI.delete(id);
      toast.success('Implemento eliminado correctamente', { id: toastId });
      await loadImplementos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar implemento', { id: toastId });
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800';
      case 'Prestado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Mantenimiento':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredImplementos = filterEstado === 'Todos' 
    ? implementos 
    : implementos.filter(imp => imp.estado === filterEstado);

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
                  {userIsAdmin ? 'Gestión de Inventario' : 'Inventario'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {userIsAdmin 
                    ? 'Administra el inventario de implementos deportivos' 
                    : 'Explora los implementos disponibles para préstamo'}
                </p>
              </div>
              {userIsAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  + Nuevo Implemento
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
                onClick={() => setFilterEstado('Disponible')}
                className={`px-4 py-2 rounded-lg ${
                  filterEstado === 'Disponible' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Disponibles
              </button>
              <button
                onClick={() => setFilterEstado('Prestado')}
                className={`px-4 py-2 rounded-lg ${
                  filterEstado === 'Prestado' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Prestados
              </button>
              <button
                onClick={() => setFilterEstado('Mantenimiento')}
                className={`px-4 py-2 rounded-lg ${
                  filterEstado === 'Mantenimiento' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mantenimiento
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredImplementos.map((implemento) => (
                  <div key={implemento.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 bg-gray-200">
                      {implemento.imagenUrl ? (
                        <Image
                          src={implemento.imagenUrl}
                          alt={implemento.nombre}
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
                      <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(implemento.estado)}`}>
                        {implemento.estado}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{implemento.nombre}</h3>
                      <p className="text-sm text-gray-500 mb-2">Código: {implemento.codigo}</p>
                      <p className="text-sm text-gray-600 mb-2">{implemento.categoria}</p>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">{implemento.descripcion}</p>
                      
                      {/* Botones de acción solo para Admin */}
                      {isAdmin(user) && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setImplementoToEdit(implemento);
                              setShowEditModal(true);
                            }}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(implemento.id)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredImplementos.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No se encontraron implementos.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal para crear implemento (solo Admin) */}
      {showCreateModal && isAdmin(user) && (
        <CreateImplementoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadImplementos();
          }}
        />
      )}

      {/* Modal para editar implemento (solo Admin) */}
      {showEditModal && isAdmin(user) && implementoToEdit && (
        <EditImplementoModal
          implemento={implementoToEdit}
          onClose={() => {
            setShowEditModal(false);
            setImplementoToEdit(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setImplementoToEdit(null);
            loadImplementos();
          }}
        />
      )}
    </div>
  );
}

// Componente Modal para crear implemento
function CreateImplementoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    imagen: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('descripcion', formData.descripcion);
      if (formData.imagen) {
        formDataToSend.append('imagen', formData.imagen);
      }

      const toastId = toast.loading('Creando implemento...');
      await implementosAPI.create(formDataToSend);
      toast.success('Implemento creado correctamente', { id: toastId });
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear implemento';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuevo Implemento</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <input
              type="text"
              required
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              required
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imagen: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
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
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal para editar implemento
function EditImplementoModal({ 
  implemento, 
  onClose, 
  onSuccess 
}: { 
  implemento: Implemento; 
  onClose: () => void; 
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    nombre: implemento.nombre,
    categoria: implemento.categoria,
    descripcion: implemento.descripcion,
    estado: implemento.estado,
    imagen: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('estado', formData.estado);
      if (formData.imagen) {
        formDataToSend.append('imagen', formData.imagen);
      }

      const toastId = toast.loading('Actualizando implemento...');
      await implementosAPI.update(implemento.id, formDataToSend);
      toast.success('Implemento actualizado correctamente', { id: toastId });
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar implemento';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Editar Implemento</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <input
              type="text"
              required
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              required
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <select
              required
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Disponible' | 'Prestado' | 'Mantenimiento' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
            >
              <option value="Disponible">Disponible</option>
              <option value="Prestado">Prestado</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen (opcional - dejar vacío para mantener la actual)
            </label>
            {implemento.imagenUrl && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Imagen actual:</p>
                <Image
                  src={implemento.imagenUrl}
                  alt={implemento.nombre}
                  width={100}
                  height={100}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imagen: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
