# 🎯 GUÍA PASO A PASO - Sistema Tecnocell Conectado a Base de Datos

## ✅ ¿QUÉ SE LOGRÓ?

El sistema ahora está **100% conectado a MySQL** con autenticación real:

- ✅ Base de datos MySQL creada y configurada
- ✅ Usuarios almacenados en base de datos real
- ✅ Login funcional con JWT
- ✅ Frontend y Backend comunicándose correctamente
- ✅ Sesión persistente (no se pierde al recargar)

---

## 🚀 INICIAR EL SISTEMA (Paso a Paso)

### Paso 1: Verificar XAMPP

1. Abre **XAMPP Control Panel**
2. Asegúrate que **MySQL** esté corriendo (botón verde "Running")
3. Si no está corriendo, haz clic en "Start" junto a MySQL

### Paso 2: Verificar la Base de Datos

```bash
cd Tecnocell_backend
npm run verify
```

Deberías ver algo como:

```
✅ VERIFICACIÓN COMPLETADA
🔑 Credenciales de acceso:
   Usuario: admin
   Contraseña: admin123
```

### Paso 3: Iniciar el Backend

**En la primera terminal:**

```bash
cd Tecnocell_backend
npm run dev
```

Deberías ver:

```
✅ Conectado a MySQL correctamente
🚀 Servidor corriendo en http://localhost:3000
```

### Paso 4: Iniciar el Frontend

**En una SEGUNDA terminal (nueva):**

```bash
npm run dev
```

Deberías ver:

```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Paso 5: Acceder al Sistema

1. Abre tu navegador
2. Ve a: `http://localhost:5173`
3. Verás la página de login
4. Ingresa:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
5. Haz clic en "Ingresar"
6. ¡Listo! Deberías ver el dashboard

---

## 🔑 USUARIOS DISPONIBLES

| Usuario    | Contraseña | Rol           | Descripción                             |
| ---------- | ---------- | ------------- | --------------------------------------- |
| `admin`    | `admin123` | Administrador | Acceso completo a todo el sistema       |
| `empleado` | `admin123` | Empleado      | Acceso limitado (sin usuarios, compras) |

---

## 📋 COMANDOS ÚTILES

### Backend (Terminal 1)

```bash
# Ver estado de la base de datos
npm run verify

# Recrear la base de datos (borra todo y vuelve a crear)
npm run setup-db

# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start
```

### Frontend (Terminal 2)

```bash
# Iniciar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "Cannot connect to MySQL"

**Problema:** El backend no puede conectarse a MySQL

**Solución:**

1. Abre XAMPP Control Panel
2. Verifica que MySQL esté corriendo (botón verde)
3. Si no está corriendo, haz clic en "Start"
4. Reinicia el backend: `Ctrl+C` y luego `npm run dev`

---

### ❌ Error: "404 Not Found" al hacer login

**Problema:** El frontend no encuentra el backend

**Solución:**

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. En la terminal del backend deberías ver: "Servidor corriendo"
3. Si no está corriendo, inicia el backend: `npm run dev`

---

### ❌ Error: "Credenciales inválidas"

**Problema:** Usuario o contraseña incorrectos

**Solución:**

1. Usa exactamente: `admin` y `admin123`
2. Verifica que no haya espacios extras
3. Si el problema persiste, ejecuta: `npm run setup-db`

---

### ❌ Error: "CORS error" en la consola del navegador

**Problema:** Configuración de CORS

**Solución:**

1. Verifica que el backend esté corriendo en puerto 3000
2. Verifica que el frontend esté en puerto 5173
3. Reinicia ambos servidores

---

### ❌ El login funciona pero no redirige al dashboard

**Problema:** El token no se está guardando

**Solución:**

1. Abre las DevTools del navegador (F12)
2. Ve a "Console" y busca errores
3. Ve a "Application" > "Local Storage" y verifica que exista el token
4. Si no hay token, limpia el Local Storage y vuelve a intentar

---

## 🔄 FLUJO COMPLETO DEL LOGIN

1. **Usuario ingresa credenciales** → Frontend
2. **Frontend envía POST** → `http://localhost:3000/api/auth/login`
3. **Backend busca usuario** → MySQL (tabla `users`)
4. **Backend verifica contraseña** → bcrypt
5. **Backend genera token** → JWT
6. **Backend responde** → Token + datos del usuario
7. **Frontend guarda** → localStorage (token + user)
8. **Frontend redirige** → Dashboard
9. **Al recargar** → Frontend restaura sesión desde localStorage

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

### Tabla: `users`

| Campo      | Tipo         | Descripción                    |
| ---------- | ------------ | ------------------------------ |
| id         | INT          | ID único del usuario           |
| username   | VARCHAR(50)  | Nombre de usuario (único)      |
| email      | VARCHAR(100) | Email del usuario (único)      |
| password   | VARCHAR(255) | Contraseña hasheada con bcrypt |
| name       | VARCHAR(100) | Nombre completo                |
| role       | ENUM         | 'admin' o 'employee'           |
| active     | BOOLEAN      | Usuario activo/inactivo        |
| created_at | TIMESTAMP    | Fecha de creación              |
| updated_at | TIMESTAMP    | Última actualización           |

### Tabla: `customers`

| Campo      | Tipo         | Descripción          |
| ---------- | ------------ | -------------------- |
| id         | INT          | ID único del cliente |
| name       | VARCHAR(100) | Nombre del cliente   |
| phone      | VARCHAR(20)  | Teléfono             |
| email      | VARCHAR(100) | Email                |
| address    | TEXT         | Dirección            |
| nit        | VARCHAR(20)  | NIT del cliente      |
| created_at | TIMESTAMP    | Fecha de creación    |
| updated_at | TIMESTAMP    | Última actualización |

---

## 🎉 PRÓXIMOS PASOS

Ahora que el sistema está funcionando con base de datos real, los siguientes pasos serían:

1. ✅ **Productos:** Crear endpoints para productos
2. ✅ **Repuestos:** Crear endpoints para repuestos
3. ✅ **Cotizaciones:** Conectar cotizaciones a la BD
4. ✅ **Ventas:** Conectar ventas a la BD
5. ✅ **Reparaciones:** Conectar reparaciones a la BD

---

## 📞 SOPORTE

Si tienes problemas:

1. Verifica que XAMPP esté corriendo
2. Ejecuta `npm run verify` en el backend
3. Revisa los errores en la consola del navegador (F12)
4. Revisa los errores en la terminal del backend

---

## ✨ RESUMEN

**Antes:**

- ❌ Datos mock (se perdían al recargar)
- ❌ No había autenticación real
- ❌ No había persistencia

**Ahora:**

- ✅ Base de datos MySQL real
- ✅ Autenticación con JWT
- ✅ Sesión persistente
- ✅ Usuarios reales
- ✅ Clientes almacenados

---

**Sistema Tecnocell by EMPRENDE360** 🚀
**Fecha de configuración:** 18 de diciembre de 2025
