// Utilidades de autenticación y autorización

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const ROLES = {
  ESTUDIANTE: 'Estudiante',
  ADMIN: 'Admin'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Obtiene el usuario actual desde localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Normaliza un rol a formato estándar (primera letra mayúscula)
 */
export function normalizeRole(role: string): Role {
  if (!role) return ROLES.ESTUDIANTE;
  const normalized = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  return (normalized === ROLES.ADMIN || normalized === ROLES.ESTUDIANTE) 
    ? normalized as Role 
    : ROLES.ESTUDIANTE;
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(user: User | null, role: Role): boolean {
  if (!user) return false;
  const userRole = normalizeRole(user.role);
  return userRole === role;
}

/**
 * Verifica si el usuario es Admin
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  const userRole = normalizeRole(user.role);
  return userRole === ROLES.ADMIN;
}

/**
 * Verifica si el usuario es Estudiante
 */
export function isEstudiante(user: User | null): boolean {
  if (!user) return false;
  const userRole = normalizeRole(user.role);
  return userRole === ROLES.ESTUDIANTE;
}

/**
 * Verifica si el usuario tiene acceso a una ruta específica
 */
export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false;
  
  // Rutas públicas (después de login)
  const publicRoutes = ['/dashboard', '/inventario', '/prestamos'];
  
  // Rutas solo para Admin
  const adminOnlyRoutes: string[] = [];
  
  // Si la ruta requiere Admin y el usuario no es Admin
  if (adminOnlyRoutes.includes(route) && !isAdmin(user)) {
    return false;
  }
  
  return publicRoutes.includes(route) || adminOnlyRoutes.includes(route);
}

/**
 * Obtiene el token de autenticación
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return getToken() !== null && getCurrentUser() !== null;
}

