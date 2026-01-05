# Sistema de Marcas y Modelos de Equipos

## Descripción General

Se ha implementado un sistema dinámico para gestionar marcas y modelos de equipos en el módulo de reparaciones. Los usuarios ahora pueden:

- **Ver marcas y modelos desde la base de datos** en lugar de usar datos estáticos
- **Crear nuevas marcas** directamente desde el formulario de reparaciones
- **Crear nuevos modelos** para una marca existente
- **Filtrar por tipo de equipo** (Teléfono, Laptop, Tablet, Consola, Otro)

## Estructura de Base de Datos

### Tabla: `equipos_marcas`

Almacena las marcas de equipos organizadas por tipo.

```sql
CREATE TABLE equipos_marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  tipo_equipo ENUM('Telefono', 'Laptop', 'Tablet', 'Consola', 'Otro') NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único
- `nombre`: Nombre de la marca (ej: "Apple", "Samsung", "Huawei")
- `tipo_equipo`: Tipo de dispositivo asociado
- `activo`: Si la marca está activa (1) o desactivada (0)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última modificación

### Tabla: `equipos_modelos`

Almacena los modelos asociados a cada marca.

```sql
CREATE TABLE equipos_modelos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  marca_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (marca_id) REFERENCES equipos_marcas(id) ON DELETE CASCADE
);
```

**Campos:**
- `id`: Identificador único
- `marca_id`: Referencia a la marca (FK)
- `nombre`: Nombre del modelo (ej: "iPhone 15 Pro Max", "Galaxy S24 Ultra")
- `activo`: Si el modelo está activo
- Relación: **Cascada** - Si se elimina una marca, se eliminan sus modelos

### Datos Iniciales

El script crea automáticamente:

**Marcas de Teléfonos:**
- Apple (19 modelos: iPhone 11-15, SE)
- Samsung (10 modelos: Galaxy S23-S24, A-series, Z Fold/Flip)
- Xiaomi (7 modelos: Xiaomi 13-14, Redmi Note, POCO)
- Huawei (sin modelos iniciales)
- Motorola (sin modelos iniciales)
- OnePlus (sin modelos iniciales)

**Total:** 6 marcas, 36 modelos precargados

## API Endpoints

### Marcas

**GET** `/api/equipos/marcas`
- Obtener todas las marcas activas
- Query params: `tipo_equipo` (opcional) - Filtrar por tipo
- Response: `{ success: true, data: [marcas] }`

**POST** `/api/equipos/marcas`
- Crear nueva marca
- Body: `{ nombre: string, tipo_equipo: TipoEquipo }`
- Response: `{ success: true, data: marca }`

**PUT** `/api/equipos/marcas/:id`
- Actualizar marca existente
- Body: `{ nombre?, tipo_equipo?, activo? }`

**DELETE** `/api/equipos/marcas/:id`
- Desactivar marca (soft delete)
- Cambia `activo` a 0

### Modelos

**GET** `/api/equipos/modelos`
- Obtener todos los modelos activos
- Response: Incluye `marca_nombre` y `tipo_equipo`

**GET** `/api/equipos/marcas/:marca_id/modelos`
- Obtener modelos de una marca específica
- Response: `{ success: true, data: [modelos] }`

**POST** `/api/equipos/modelos`
- Crear nuevo modelo
- Body: `{ marca_id: number, nombre: string }`
- Response: `{ success: true, data: modelo }`

**PUT** `/api/equipos/modelos/:id`
- Actualizar modelo existente
- Body: `{ nombre?, activo? }`

**DELETE** `/api/equipos/modelos/:id`
- Desactivar modelo (soft delete)

## Frontend

### Archivos Creados/Modificados

1. **Tipos:** `src/types/equipo.ts`
   - `EquipoMarca` - Interface para marcas
   - `EquipoModelo` - Interface para modelos
   - `TipoEquipo` - Type union para tipos
   - `CreateMarcaRequest`, `CreateModeloRequest`

2. **Servicio:** `src/services/equipoService.ts`
   - `getAllMarcas(tipoEquipo?)` - Lista marcas
   - `createMarca(marca)` - Crea marca
   - `getModelosByMarca(marcaId)` - Lista modelos de marca
   - `createModelo(modelo)` - Crea modelo
   - Funciones update y delete

3. **Componente:** `src/pages/Repairs/RepairFormSimple.tsx`
   - Eliminado objeto estático `EQUIPMENT_DATA`
   - Agregados estados: `marcas`, `modelos`, `loadingMarcas`, `loadingModelos`
   - Agregados estados para crear: `showNuevaMarcaInput`, `showNuevoModeloInput`
   - useEffect para cargar marcas al cambiar tipo
   - useEffect para cargar modelos al cambiar marca
   - Funciones: `handleCrearNuevaMarca()`, `handleCrearNuevoModelo()`

### Flujo de Usuario

#### 1. Seleccionar Tipo de Equipo
```tsx
<Select value={equipmentData.tipo} onChange={...}>
  <option value="Telefono">Teléfono</option>
  <option value="Laptop">Laptop</option>
  <option value="Tablet">Tablet</option>
  <option value="Consola">Consola</option>
  <option value="Otro">Otro</option>
</Select>
```
- Al cambiar tipo → Carga marcas del tipo seleccionado
- Resetea marca y modelo

#### 2. Seleccionar o Crear Marca
```tsx
<Select value={equipmentData.marca} onChange={...}>
  <option value="">Seleccionar marca...</option>
  {marcas.map(m => <option>{m.nombre}</option>)}
  <option value="__nueva__">+ Crear nueva marca</option>
</Select>
```
- Si selecciona marca existente → Carga modelos de esa marca
- Si selecciona "+ Crear nueva marca" → Muestra input para nombre
- Al crear marca → POST a API → Recarga lista → Selecciona automáticamente

#### 3. Seleccionar o Crear Modelo
```tsx
<Select value={equipmentData.modelo} onChange={...}>
  <option value="">Seleccionar modelo...</option>
  {modelos.map(m => <option>{m.nombre}</option>)}
  <option value="__nuevo__">+ Crear nuevo modelo</option>
</Select>
```
- Deshabilitado hasta que se seleccione marca
- Si selecciona "+ Crear nuevo modelo" → Muestra input
- Al crear modelo → POST a API → Recarga lista → Selecciona automáticamente

## Validaciones

### Backend
- **Marca:**
  - `nombre` y `tipo_equipo` requeridos
  - Nombre único (constraint DB)
  - Error 400 si duplicado: "Ya existe una marca con ese nombre"

- **Modelo:**
  - `marca_id` y `nombre` requeridos
  - Unique key: `(marca_id, nombre)` - No duplicados por marca
  - Error 400 si duplicado: "Ya existe un modelo con ese nombre para esta marca"
  - CASCADE DELETE: Si se elimina marca, se eliminan modelos

### Frontend
- Botón "Crear" deshabilitado si input vacío
- Validación de campos requeridos antes de continuar paso
- Mensajes de error via `alert()` en catch
- Loading states durante fetch

## Ejemplos de Uso

### Crear marca "Huawei" para Teléfonos
```typescript
await equipoService.createMarca({
  nombre: 'Huawei',
  tipo_equipo: 'Telefono'
});
```

### Crear modelo "P60 Pro" para Huawei
```typescript
// 1. Obtener ID de marca Huawei
const marcas = await equipoService.getAllMarcas('Telefono');
const huawei = marcas.find(m => m.nombre === 'Huawei');

// 2. Crear modelo
await equipoService.createModelo({
  marca_id: huawei.id,
  nombre: 'P60 Pro'
});
```

### Listar modelos de Apple
```typescript
const marcas = await equipoService.getAllMarcas('Telefono');
const apple = marcas.find(m => m.nombre === 'Apple');
const modelos = await equipoService.getModelosByMarca(apple.id);
// Retorna: iPhone 15 Pro Max, iPhone 15 Pro, iPhone 15, etc.
```

## Agregar Más Marcas/Modelos

### Vía Frontend
1. Abrir formulario de reparación
2. Seleccionar tipo de equipo
3. En marca, seleccionar "+ Crear nueva marca"
4. Ingresar nombre y crear
5. En modelo, seleccionar "+ Crear nuevo modelo"
6. Ingresar nombre y crear

### Vía SQL
```sql
-- Agregar marca
INSERT INTO equipos_marcas (nombre, tipo_equipo) 
VALUES ('Google', 'Telefono');

-- Agregar modelos
SET @marca_id = LAST_INSERT_ID();
INSERT INTO equipos_modelos (marca_id, nombre) VALUES
(@marca_id, 'Pixel 8 Pro'),
(@marca_id, 'Pixel 8'),
(@marca_id, 'Pixel 7a');
```

### Vía API (Postman/Insomnia)
```bash
# Crear marca
POST http://localhost:3000/api/equipos/marcas
Content-Type: application/json
{
  "nombre": "Google",
  "tipo_equipo": "Telefono"
}

# Crear modelo (usando marca_id de response)
POST http://localhost:3000/api/equipos/modelos
Content-Type: application/json
{
  "marca_id": 7,
  "nombre": "Pixel 8 Pro"
}
```

## Ventajas del Nuevo Sistema

✅ **Datos centralizados** - Una sola fuente de verdad en BD
✅ **Escalable** - Agregar marcas/modelos sin modificar código
✅ **Flexible** - Soporta cualquier tipo de equipo
✅ **Usuario-friendly** - Crear desde formulario sin acceso a BD
✅ **Consistente** - Mismos datos en toda la aplicación
✅ **Mantenible** - No más arrays hardcodeados de 100+ líneas

## Migraciones Futuras

### Agregar más tipos de equipo
1. Modificar ENUM en tabla:
```sql
ALTER TABLE equipos_marcas 
MODIFY tipo_equipo ENUM('Telefono','Laptop','Tablet','Consola','Otro','SmartWatch','Auriculares');
```

2. Actualizar frontend `TipoEquipo` type

### Agregar campos adicionales
```sql
ALTER TABLE equipos_marcas ADD COLUMN logo_url VARCHAR(255);
ALTER TABLE equipos_modelos ADD COLUMN specs JSON;
```

### Reportes comunes
```sql
-- Marcas con más modelos
SELECT m.nombre, COUNT(mo.id) as total
FROM equipos_marcas m
LEFT JOIN equipos_modelos mo ON m.id = mo.marca_id
GROUP BY m.id
ORDER BY total DESC;

-- Modelos más usados en reparaciones
SELECT mo.nombre, m.nombre as marca, COUNT(r.id) as reparaciones
FROM equipos_modelos mo
INNER JOIN equipos_marcas m ON mo.marca_id = m.id
LEFT JOIN reparaciones r ON r.equipo_modelo = mo.nombre
GROUP BY mo.id
ORDER BY reparaciones DESC
LIMIT 10;
```

## Troubleshooting

### Error: "Ya existe una marca con ese nombre"
- La marca ya existe en la BD
- Verificar: `SELECT * FROM equipos_marcas WHERE nombre = 'NombreMarca';`
- Solución: Usar marca existente o elegir otro nombre

### No se cargan modelos
- Verificar que marca tenga modelos: `SELECT * FROM equipos_modelos WHERE marca_id = X;`
- Revisar consola del navegador para errores de API
- Verificar que backend esté corriendo en puerto 3000

### Marca aparece pero sin modelos
- Normal si es nueva marca creada por usuario
- Crear modelos usando "+ Crear nuevo modelo"

### Error 500 al crear
- Revisar logs del backend: `console.error` en controller
- Verificar conexión a base de datos
- Verificar que tablas existan: `SHOW TABLES LIKE 'equipos%';`

## Script de Instalación

Para instalar/reinstalar las tablas y datos:

```bash
# Desde PowerShell en root del proyecto
Get-Content "Tecnocell_backend\scripts\create-equipos-marcas-modelos.sql" | & "C:\xampp\mysql\bin\mysql.exe" -u root
```

Esto creará las tablas y cargará los datos iniciales.
