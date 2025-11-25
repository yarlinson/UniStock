// Configuración de la API
export const API_BASE_URL = 'https://unistock-api.azurewebsites.net';

// Tipos de datos
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  usuario?: Usuario;
  user?: Usuario;
  [key: string]: unknown; // Permitir propiedades adicionales
}

export interface Implemento {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  imagenUrl: string;
  estado: 'Disponible' | 'Prestado' | 'Mantenimiento';
}

export interface Prestamo {
  id: number;
  usuarioId: number;
  implementoId: number;
  fechaPrestamo: string;
  fechaDevolucionProgramada: string;
  fechaDevolucionReal: string | null;
  estado: 'Activo' | 'Devuelto' | 'Retrasado';
  implemento: Implemento;
}

export interface RegistrarPrestamoRequest {
  usuarioId: number;
  implementoId: number;
  fechaDevolucionProgramada: string;
}

