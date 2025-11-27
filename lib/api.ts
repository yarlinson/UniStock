import { API_BASE_URL, type LoginResponse, type Implemento, type Prestamo, type RegistrarPrestamoRequest, type Usuario } from './config';

// Re-exportar tipos para facilitar las importaciones
export type { Implemento, Prestamo, RegistrarPrestamoRequest, Usuario, LoginResponse } from './config';

// Función auxiliar para obtener el token
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Función auxiliar para hacer peticiones con autenticación
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Si el token es inválido o expiró, redirigir al login
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  return response;
};

// API de Autenticación
export const authAPI = {
  // Login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let errorMessage = 'Error al iniciar sesión';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.title || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Manejar respuesta que puede ser JSON o texto plano
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Si es texto plano, intentar parsearlo como JSON
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }
    }

    // Log para debug - ver qué está devolviendo el backend
    console.log('Respuesta del login:', JSON.stringify(data, null, 2));

    // Validar estructura básica
    if (!data || !data.token) {
      console.error('La respuesta no contiene token:', data);
      throw new Error('La respuesta del servidor no contiene un token válido');
    }

    return data;
  },

  // Registro
  registro: async (nombre: string, email: string, password: string, rol: string = 'Estudiante'): Promise<{ message: string }> => {
    // El backend espera 'PasswordHash' según el error de validación
    const response = await fetch(`${API_BASE_URL}/api/Auth/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        nombre, 
        email, 
        PasswordHash: password,  // El backend espera PasswordHash en lugar de password
        rol 
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Error al registrar usuario';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          // Si el error tiene detalles de validación, mostrarlos
          if (errorData.errors) {
            const errorDetails = Object.entries(errorData.errors)
              .map(([field, messages]: [string, unknown]) => {
                const msgArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${msgArray.join(', ')}`;
              })
              .join('\n');
            errorMessage = errorDetails || errorData.title || errorMessage;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Manejar respuesta que puede ser JSON o texto plano
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    } else {
      // Si es texto plano, devolverlo como mensaje
      const text = await response.text();
      return { message: text || 'Usuario registrado exitosamente' };
    }
  },
};

// API de Implementos
export const implementosAPI = {
  // Obtener todos los implementos
  getAll: async (): Promise<Implemento[]> => {
    const response = await fetchWithAuth('/api/Implementos');

    if (!response.ok) {
      throw new Error('Error al obtener implementos');
    }

    return response.json();
  },

  // Crear un implemento (solo Admin)
  create: async (formData: FormData): Promise<Implemento> => {
    const response = await fetchWithAuth('/api/Implementos', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al crear implemento');
    }

    return response.json();
  },

  // Actualizar un implemento (solo Admin)
  update: async (id: number, formData: FormData): Promise<Implemento> => {
    const response = await fetchWithAuth(`/api/Implementos/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al actualizar implemento');
    }

    return response.json();
  },

  // Eliminar un implemento (solo Admin)
  delete: async (id: number): Promise<void> => {
    const response = await fetchWithAuth(`/api/Implementos/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al eliminar implemento');
    }
  },
};

// API de Usuarios
export const usuariosAPI = {
  // Obtener todos los usuarios (solo Admin)
  getAll: async (): Promise<Usuario[]> => {
    const response = await fetchWithAuth('/api/Auth/usuarios');
    
    if (!response.ok) {
      throw new Error('Error al obtener usuarios');
    }
    
    return response.json();
  },

  // Obtener un usuario específico (solo Admin)
  getById: async (id: number): Promise<Usuario> => {
    const response = await fetchWithAuth(`/api/Auth/usuarios/${id}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener usuario');
    }
    
    return response.json();
  },

  // Actualizar un usuario (solo Admin)
  update: async (id: number, usuario: Partial<Usuario>): Promise<string> => {
    const response = await fetchWithAuth(`/api/Auth/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuario),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al actualizar usuario');
    }

    return response.text();
  },

  // Eliminar un usuario (solo Admin)
  delete: async (id: number): Promise<string> => {
    const response = await fetchWithAuth(`/api/Auth/usuarios/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al eliminar usuario');
    }

    return response.text();
  },

  // Buscar usuarios por término (ID, nombre o email)
  buscar: async (termino: string): Promise<Usuario[]> => {
    try {
      const todosUsuarios = await usuariosAPI.getAll();
      const terminoLower = termino.toLowerCase();
      return todosUsuarios.filter(usuario => 
        usuario.id.toString().includes(termino) ||
        usuario.nombre.toLowerCase().includes(terminoLower) ||
        usuario.email.toLowerCase().includes(terminoLower)
      );
    } catch (err) {
      console.warn('No se pudo buscar usuarios:', err);
      return [];
    }
  },
};

// API de Préstamos
export const prestamosAPI = {
  // Registrar un préstamo (solo Admin)
  registrar: async (data: RegistrarPrestamoRequest): Promise<string> => {
    const response = await fetchWithAuth('/api/Prestamos/registrar', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar préstamo');
    }

    return response.text();
  },

  // Registrar devolución (solo Admin)
  devolucion: async (id: number): Promise<string> => {
    const response = await fetchWithAuth(`/api/Prestamos/devolucion/${id}`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar devolución');
    }

    return response.text();
  },

  // Obtener mis préstamos
  getMisPrestamos: async (): Promise<Prestamo[]> => {
    const response = await fetchWithAuth('/api/Prestamos/mis-prestamos');

    if (!response.ok) {
      throw new Error('Error al obtener préstamos');
    }

    return response.json();
  },

  // Obtener todos los préstamos (solo Admin)
  getTodos: async (): Promise<Prestamo[]> => {
    const response = await fetchWithAuth('/api/Prestamos/todos');

    if (!response.ok) {
      throw new Error('Error al obtener préstamos');
    }

    return response.json();
  },
};

