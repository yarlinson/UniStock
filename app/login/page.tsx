'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../lib/api';

// Componente que usa useSearchParams - debe estar envuelto en Suspense
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Mostrar mensaje de éxito si viene de registro
    if (searchParams.get('registro') === 'exitoso') {
      setSuccess('Registro exitoso. Por favor, inicia sesión con tus credenciales.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);
      
      // Validar que la respuesta tenga la estructura esperada
      if (!response || !response.token) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Función auxiliar para decodificar JWT
      const decodeJWT = (token: string) => {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          return JSON.parse(jsonPayload);
        } catch (e) {
          console.error('Error decodificando JWT:', e);
          return null;
        }
      };

      // Log completo de la respuesta para depuración
      console.log('=== DEBUG: Respuesta completa del login ===');
      console.log('Respuesta:', JSON.stringify(response, null, 2));
      console.log('Tiene usuario?:', !!response.usuario);
      console.log('Tiene user?:', !!response.user);
      console.log('Tiene token?:', !!response.token);
      console.log('===========================================');

      // Verificar si la respuesta tiene usuario o si viene en otro formato
      let usuarioData;
      if (response.usuario) {
        // Estructura esperada según documentación de Swagger
        console.log('Usando información de response.usuario');
        // Normalizar el rol
        const rawRole = response.usuario.rol || 'Estudiante';
        const normalizedRole = typeof rawRole === 'string' 
          ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
          : 'Estudiante';
        
        usuarioData = {
          id: response.usuario.id || 0,
          name: response.usuario.nombre || email.split('@')[0],
          email: response.usuario.email || email,
          role: normalizedRole
        };
        
        // Validar que al menos tengamos un email
        if (!usuarioData.email) {
          console.warn('No se encontró email en response.usuario, usando email del formulario');
          usuarioData.email = email;
        }
      } else if (response.user) {
        // Por si el backend devuelve 'user' en lugar de 'usuario'
        console.log('Usando información de response.user');
        // Normalizar el rol
        const rawRole = response.user.rol || 'Estudiante';
        const normalizedRole = typeof rawRole === 'string' 
          ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
          : 'Estudiante';
        
        usuarioData = {
          id: response.user.id || 0,
          name: response.user.nombre || email.split('@')[0],
          email: response.user.email || email,
          role: normalizedRole
        };
        
        if (!usuarioData.email) {
          console.warn('No se encontró email en response.user, usando email del formulario');
          usuarioData.email = email;
        }
      } else {
        // Si no viene la información del usuario, intentar decodificarla del JWT
        console.log('⚠️ No se encontró información del usuario en la respuesta, intentando decodificar del JWT...');
        
        const decodedToken = decodeJWT(response.token);
        if (decodedToken) {
          console.log('✅ Token decodificado exitosamente:', decodedToken);
          
          // Intentar extraer información del usuario del token
          // Los claims comunes en JWT pueden ser: sub, email, name, role, nombre, rol, etc.
          const rawRole = decodedToken.rol || decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'Estudiante';
          // Normalizar el rol: convertir a formato con primera letra mayúscula
          const normalizedRole = typeof rawRole === 'string' 
            ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
            : 'Estudiante';
          
          usuarioData = {
            id: decodedToken.id || decodedToken.sub || decodedToken.userId || decodedToken.nameid || 0,
            name: decodedToken.nombre || decodedToken.name || decodedToken.unique_name || decodedToken.given_name || email.split('@')[0],
            email: decodedToken.email || decodedToken.unique_name || decodedToken.upn || email,
            role: normalizedRole
          };
          
          console.log('📋 Datos extraídos del JWT:', usuarioData);
          
          // Si no se pudo obtener un ID válido, usar el email como identificador temporal
          if (!usuarioData.id || usuarioData.id === 0) {
            console.warn('⚠️ No se pudo obtener ID del token, usando 0 como ID temporal');
          }
        } else {
          // Si no se puede decodificar el token, crear datos básicos con la información disponible
          console.warn('⚠️ No se pudo decodificar el token, usando información básica del formulario');
          usuarioData = {
            id: 0,
            name: email.split('@')[0],
            email: email,
            role: 'Estudiante'
          };
        }
      }
      
      // Validación final - asegurarse de que tenemos al menos email
      if (!usuarioData.email) {
        console.error('❌ Error crítico: No se pudo obtener el email del usuario');
        throw new Error('No se pudo obtener la información del usuario. Por favor, contacta al administrador.');
      }
      
      console.log('✅ Datos finales del usuario que se guardarán:', usuarioData);
      
      // Guardar token y datos del usuario
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(usuarioData));
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión. Por favor, intenta de nuevo.';
      setError(errorMessage);
      console.error('Error en login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Formulario de Login Centrado */}
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Logo y Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 flex items-center justify-center">
                <Image
                  src="/LogoSinFondo.png"
                  alt="UNISTOCK Logo"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="mt-2 text-sm text-gray-600">
              Bienvenido de vuelta! Por favor ingresa tus datos
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                  placeholder="Ingresa tu email"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showPassword ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      ) : (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Opciones adicionales */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordar por 30 días
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-red-600 hover:text-red-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Success message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Botón de login */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>

            {/* Link de registro */}
            <div className="text-center">
              <span className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link href="/registro" className="font-medium text-red-600 hover:text-red-500">
                  Regístrate
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Componente principal que envuelve LoginForm en Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
