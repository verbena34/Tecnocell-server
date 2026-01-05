# 🚀 Guía de Inicio Rápido - Sistema Tecnocell

## ✅ Base de Datos Configurada

La base de datos ha sido creada exitosamente con:

- ✅ Base de datos: `tecnocell_db`
- ✅ Tabla: `users` (usuarios del sistema)
- ✅ Tabla: `customers` (clientes)
- ✅ Usuarios de prueba creados

## 🔑 Credenciales de Acceso

### Usuario Administrador

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** Administrador (acceso completo)

### Usuario Empleado

- **Usuario:** `empleado`
- **Contraseña:** `admin123`
- **Rol:** Empleado (acceso limitado)

## 📋 Requisitos

1. ✅ XAMPP instalado y corriendo
2. ✅ MySQL activo en puerto 3306
3. ✅ Node.js instalado
4. ✅ npm o yarn

## 🚀 Iniciar el Sistema

### 1️⃣ Iniciar el Backend

```bash
cd Tecnocell_backend
npm run dev
```

El backend se ejecutará en: `http://localhost:3000`

### 2️⃣ Iniciar el Frontend

En otra terminal:

```bash
npm run dev
```

El frontend se ejecutará en: `http://localhost:5173`

### 3️⃣ Acceder al Sistema

1. Abre tu navegador en `http://localhost:5173`
2. Ingresa con las credenciales:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. ¡Listo! Ya puedes usar el sistema

## 🔧 Comandos Útiles

### Backend

```bash
# Iniciar servidor en desarrollo (con auto-reload)
npm run dev

# Iniciar servidor en producción
npm start

# Recrear la base de datos
npm run setup-db
```

### Frontend

```bash
# Iniciar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## 📊 Estado del Sistema

### Implementado ✅

- ✅ Base de datos MySQL conectada
- ✅ Autenticación con JWT
- ✅ Login con usuarios reales
- ✅ CRUD de usuarios
- ✅ CRUD de clientes
- ✅ Dashboard funcional
- ✅ Interfaz completa de frontend

### Pendiente ⏳

- ⏳ Endpoints de productos
- ⏳ Endpoints de repuestos
- ⏳ Endpoints de cotizaciones
- ⏳ Endpoints de ventas
- ⏳ Endpoints de reparaciones

## 🗄️ Estructura de la Base de Datos

### Tabla: users

- `id`: INT (Primary Key)
- `username`: VARCHAR(50) UNIQUE
- `email`: VARCHAR(100) UNIQUE
- `password`: VARCHAR(255) (hasheada con bcrypt)
- `name`: VARCHAR(100)
- `role`: ENUM('admin', 'employee')
- `active`: BOOLEAN
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Tabla: customers

- `id`: INT (Primary Key)
- `name`: VARCHAR(100)
- `phone`: VARCHAR(20)
- `email`: VARCHAR(100)
- `address`: TEXT
- `nit`: VARCHAR(20)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- Se usa JWT para autenticación
- Los tokens se almacenan en localStorage
- CORS habilitado para desarrollo

## ⚠️ Notas Importantes

1. **XAMPP debe estar corriendo** antes de iniciar el backend
2. El backend debe estar corriendo antes de usar el frontend
3. Las credenciales de prueba están en el formulario de login
4. Los datos de ejemplo (clientes) ya están insertados

## 🆘 Solución de Problemas

### Error: "Cannot connect to MySQL"

- Verifica que XAMPP esté corriendo
- Verifica que MySQL esté activo en el puerto 3306
- Revisa el archivo `.env` en `Tecnocell_backend`

### Error: "404 Not Found" en las APIs

- Asegúrate de que el backend esté corriendo en el puerto 3000
- Verifica la URL en el archivo `.env` del frontend

### Error: "Invalid credentials"

- Usa las credenciales exactas: `admin` / `admin123`
- Verifica que la tabla `users` tenga los datos correctos

## 📱 Contacto y Soporte

Para problemas o dudas sobre el sistema, contacta al desarrollador.

---

**Sistema desarrollado para TECNOCELL by EMPRENDE360** 🚀
