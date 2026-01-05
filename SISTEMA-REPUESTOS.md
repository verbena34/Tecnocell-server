# Sistema de Repuestos - TECNOCELL

## Descripción General

Sistema completo para gestión de repuestos de dispositivos móviles. Los precios se almacenan en **centavos (enteros)** en la base de datos para evitar problemas de redondeo con decimales.

Por ejemplo:
- Q125.00 → se guarda como 12500 centavos
- Q45.50 → se guarda como 4550 centavos

## Base de Datos

### Tabla: `repuestos`

```sql
CREATE TABLE repuestos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  tipo ENUM('Pantalla', 'Batería', 'Cámara', 'Flex', 'Placa', 'Back Cover', 'Altavoz', 'Conector', 'Otro'),
  marca ENUM('Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Otra'),
  linea VARCHAR(100),  -- iPhone 12, Galaxy S21, etc.
  modelo VARCHAR(100),  -- A2407, SM-S911B, etc.
  compatibilidad JSON,  -- ["iPhone 12", "iPhone 12 Pro"]
  condicion ENUM('Original', 'OEM', 'Genérico', 'Usado'),
  color VARCHAR(50),
  notas TEXT,
  
  -- PRECIOS EN CENTAVOS (ENTEROS)
  precio_publico INT NOT NULL DEFAULT 0 COMMENT 'Precio de venta al público en centavos',
  precio_costo INT NOT NULL DEFAULT 0 COMMENT 'Precio de costo en centavos',
  
  proveedor VARCHAR(100),
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT DEFAULT 1,
  imagenes JSON,  -- ["url1.jpg", "url2.jpg"]
  tags JSON,  -- ["OLED", "Incell"]
  activo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla: `repuestos_movimientos`

Historial de entradas, salidas y ajustes de stock.

```sql
CREATE TABLE repuestos_movimientos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  repuesto_id INT NOT NULL,
  tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA', 'REPARACION', 'DEVOLUCION'),
  cantidad INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo INT NOT NULL,
  precio_unitario INT DEFAULT 0 COMMENT 'Precio en centavos al momento del movimiento',
  referencia_tipo ENUM('COMPRA', 'VENTA', 'REPARACION', 'AJUSTE_MANUAL'),
  referencia_id INT,  -- ID de la compra, venta o reparación relacionada
  usuario_id INT,
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (repuesto_id) REFERENCES repuestos(id) ON DELETE CASCADE
);
```

### Vistas

**v_repuestos_stock_bajo**: Repuestos con stock menor al mínimo
**v_estadisticas_repuestos**: Estadísticas por tipo y marca

### Stored Procedure

**sp_registrar_movimiento_repuesto**: Registra movimiento de stock y actualiza inventario automáticamente.

```sql
CALL sp_registrar_movimiento_repuesto(
  repuesto_id, tipo_movimiento, cantidad, precio_unitario,
  referencia_tipo, referencia_id, usuario_id, notas
);
```

## API Backend

**Base URL**: `http://localhost:3000/api/repuestos`

Todas las rutas requieren JWT token en header: `Authorization: Bearer {token}`

### Endpoints

#### 1. Crear Repuesto
```http
POST /api/repuestos
Content-Type: application/json

{
  "nombre": "Pantalla iPhone 12 Original",
  "tipo": "Pantalla",
  "marca": "Apple",
  "linea": "iPhone 12",
  "condicion": "Original",
  "precio_publico": 125000,  // Q125.00 en centavos
  "precio_costo": 95000,     // Q95.00 en centavos
  "stock": 5,
  "compatibilidad": ["iPhone 12", "iPhone 12 Pro"],
  "tags": ["OLED", "Táctil"]
}
```

#### 2. Obtener Todos los Repuestos
```http
GET /api/repuestos?tipo=Pantalla&marca=Apple&page=1&limit=100
```

Query params:
- `tipo`: Filtrar por tipo
- `marca`: Filtrar por marca
- `linea`: Filtrar por línea
- `activo`: true/false
- `soloConStock`: true/false
- `precioMin`: Precio mínimo en centavos
- `precioMax`: Precio máximo en centavos
- `searchTerm`: Búsqueda en nombre, modelo, línea
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 100)

#### 3. Obtener Repuesto por ID
```http
GET /api/repuestos/:id
```

#### 4. Actualizar Repuesto
```http
PUT /api/repuestos/:id
Content-Type: application/json

{
  "precio_publico": 130000,  // Nuevo precio en centavos
  "stock": 10
}
```

#### 5. Eliminar Repuesto
```http
DELETE /api/repuestos/:id
```

#### 6. Repuestos con Stock Bajo
```http
GET /api/repuestos/stock-bajo
```

#### 7. Estadísticas
```http
GET /api/repuestos/estadisticas
```

Respuesta:
```json
{
  "por_tipo_marca": [
    {
      "tipo": "Pantalla",
      "marca": "Apple",
      "total_items": 15,
      "stock_total": 45,
      "items_stock_bajo": 3,
      "valor_inventario_costo": 4275.00,
      "valor_inventario_publico": 5625.00,
      "precio_promedio": 125.00
    }
  ],
  "totales": {
    "total_repuestos": 150,
    "stock_total": 450,
    "valor_total_costo": 42750.00,
    "valor_total_publico": 56250.00
  }
}
```

#### 8. Registrar Movimiento de Stock
```http
POST /api/repuestos/:id/movimiento
Content-Type: application/json

{
  "tipo_movimiento": "ENTRADA",  // ENTRADA, SALIDA, AJUSTE, VENTA, REPARACION, DEVOLUCION
  "cantidad": 10,
  "precio_unitario": 95000,  // En centavos
  "referencia_tipo": "COMPRA",
  "referencia_id": 123,
  "usuario_id": 1,
  "notas": "Compra a proveedor ABC"
}
```

## Frontend

### Servicio: `repuestoService.ts`

```typescript
import * as repuestoService from '../services/repuestoService';

// Convertir precios
const centavos = repuestoService.quetzalesACentavos(125.00);  // 12500
const quetzales = repuestoService.centavosAQuetzales(12500);  // 125.00
const formatted = repuestoService.formatearPrecio(12500);     // "Q125.00"

// Crear repuesto
const repuesto = await repuestoService.createRepuesto({
  nombre: "Batería iPhone 12",
  tipo: "Batería",
  marca: "Apple",
  condicion: "Original",
  precio_publico: repuestoService.quetzalesACentavos(85.00),  // Convertir a centavos
  precio_costo: repuestoService.quetzalesACentavos(60.00),
  stock: 10
});

// Obtener todos
const repuestos = await repuestoService.getAllRepuestos({
  tipo: "Pantalla",
  marca: "Apple",
  soloConStock: true
});

// Actualizar
await repuestoService.updateRepuesto(123, {
  precio_publico: repuestoService.quetzalesACentavos(90.00)
});
```

### Store: `useRepuestosStore.ts`

```typescript
import { useRepuestosStore } from '../store/useRepuestosStore';

const { 
  repuestos,           // Array de repuestos
  loadRepuestos,       // Cargar desde API
  isLoading,           // Estado de carga
  removeRepuesto,      // Eliminar
  duplicateRepuesto    // Duplicar
} = useRepuestosStore();

// Cargar repuestos
useEffect(() => {
  loadRepuestos();
}, [loadRepuestos]);
```

### Componente: `RepuestoForm.tsx`

Formulario para crear/editar repuestos. Convierte automáticamente los precios:
- Frontend: usuario ingresa Q125.00
- Antes de guardar: se convierte a 12500 centavos
- Al cargar desde BD: se convierte de 12500 a Q125.00

### Componente: `RepuestosPage.tsx`

Lista de repuestos con:
- Estadísticas (total, stock bajo, valor inventario)
- Filtros (búsqueda, tipo, marca, stock)
- Tarjetas con información visual
- Acciones: Ver, Editar, Duplicar, Eliminar

## Flujo de Trabajo

### 1. Crear Repuesto

```
Usuario ingresa en formulario:
  Nombre: "Pantalla iPhone 12"
  Precio Público: 125.00
  Precio Costo: 95.00
  Stock: 5
    ↓
Frontend convierte:
  precio_publico: 12500 centavos
  precio_costo: 9500 centavos
    ↓
POST /api/repuestos
    ↓
Base de datos guarda:
  precio_publico: 12500 (INT)
  precio_costo: 9500 (INT)
    ↓
Respuesta devuelve valores en centavos
    ↓
Frontend convierte de vuelta a quetzales para mostrar
```

### 2. Listar Repuestos

```
GET /api/repuestos
    ↓
Base de datos devuelve:
  [{ precio_publico: 12500, precio_costo: 9500, ... }]
    ↓
Store convierte:
  precio: 125.00 (quetzales)
  precioCosto: 95.00 (quetzales)
    ↓
UI muestra: Q125.00
```

### 3. Movimiento de Stock

```
Usuario registra venta de 2 unidades
    ↓
POST /api/repuestos/123/movimiento
{
  tipo_movimiento: "VENTA",
  cantidad: 2,
  precio_unitario: 12500
}
    ↓
Stored Procedure:
  1. Obtiene stock actual
  2. Calcula nuevo stock (actual - cantidad)
  3. Inserta movimiento en repuestos_movimientos
  4. Actualiza stock en repuestos
    ↓
Respuesta: { mensaje: "...", nuevo_stock: 3 }
```

## Validaciones

### Backend (Triggers)

1. **before_insert_repuesto**: Valida que precio_publico > precio_costo
2. **before_update_repuesto**: Valida precios y normaliza strings
3. Stock nunca puede ser negativo (se ajusta a 0)

### Frontend

1. Nombre requerido (3-120 caracteres)
2. Tipo y marca requeridos
3. Precio público > precio de costo (si ambos > 0)
4. Stock >= 0

## Notas Técnicas

### ¿Por qué centavos en lugar de decimales?

Los tipos FLOAT y DECIMAL en MySQL pueden causar problemas de precisión en cálculos monetarios. Usar INT (centavos) garantiza:

1. **Precisión exacta**: No hay errores de redondeo
2. **Cálculos rápidos**: Operaciones con enteros son más rápidas
3. **Consistencia**: Siempre 2 decimales exactos

### Conversión

```javascript
// Quetzales → Centavos
centavos = Math.round(quetzales * 100)

// Centavos → Quetzales
quetzales = centavos / 100

// Formato
`Q${(centavos / 100).toFixed(2)}`
```

### Compatibilidad

El campo `compatibilidad` es un JSON array:
```json
["iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max"]
```

### Tags

El campo `tags` es un JSON array:
```json
["OLED", "Táctil", "Original", "Alta calidad"]
```

## Próximos Pasos

- [ ] Integrar repuestos en módulo de reparaciones
- [ ] Añadir repuestos a cotizaciones
- [ ] Sistema de compras de repuestos con actualización automática de stock
- [ ] Reportes de rotación de inventario
- [ ] Alertas automáticas de stock bajo
- [ ] Historial de cambios de precio
- [ ] Códigos de barras para repuestos
