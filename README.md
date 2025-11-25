# UNISTOCK - Sistema de Gestión Deportiva

Sistema de gestión de implementos deportivos para instituciones educativas, desarrollado con Next.js y .NET.

## 🚀 Características

- **Login moderno** con autenticación basada en JSON
- **Dashboard responsivo** con estadísticas en tiempo real
- **Gestión de inventario** de implementos deportivos
- **Sistema de préstamos** y devoluciones
- **Reportes detallados** y analytics
- **Diseño moderno** con colores corporativos

## 🛠 Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: .NET (en desarrollo)
- **Base de datos**: JSON (temporal)

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd unistock-bienestar/frontend-unistock
```

2. **Instalar dependencias**
```bash
npm install
# o
pnpm install
```

3. **Ejecutar en modo desarrollo**
```bash
npm run dev
# o
pnpm dev
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

## 🔐 Credenciales de Prueba

El sistema incluye usuarios de prueba configurados en `public/data/users.json`:

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@unistock.com | admin123 | Administrador |
| profesor@unistock.com | prof123 | Profesor |
| estudiante@unistock.com | est123 | Estudiante |

## 📁 Estructura del Proyecto

```
frontend-unistock/
├── app/
│   ├── login/           # Página de login
│   ├── dashboard/       # Dashboard principal
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página de inicio
├── public/
│   └── data/
│       └── users.json  # Datos de usuarios
└── README.md
```

## 🎨 Diseño

El sistema utiliza una paleta de colores basada en el logo UNISTOCK:
- **Rojo principal**: #DC2626 (red-600)
- **Verde secundario**: #059669 (green-600)
- **Grises**: Para textos y fondos

## 🔄 Flujo de la Aplicación

1. **Página de inicio** → Redirige automáticamente al login
2. **Login** → Autenticación con datos JSON
3. **Dashboard** → Panel principal con estadísticas
4. **Logout** → Cierre de sesión y redirección

## 🚧 Próximas Funcionalidades

- [ ] Gestión completa de inventario
- [ ] Sistema de préstamos
- [ ] Reportes avanzados
- [ ] Integración con backend .NET
- [ ] Base de datos real
- [ ] Autenticación JWT
- [ ] Roles y permisos

## 📝 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construir para producción
npm run start    # Servidor de producción
npm run lint     # Verificar código
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
