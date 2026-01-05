# Guía Rápida: Crear Cotizaciones en TECNOCELL

## ⚠️ IMPORTANTE: Debes estar autenticado

### 🔐 Paso 1: Iniciar Sesión

1. Ve a: http://localhost:5173/login
2. Ingresa tus credenciales
3. El sistema guardará tu token automáticamente

### ✅ Verificar Autenticación

Abre la consola del navegador (F12) y ejecuta:
```javascript
localStorage.getItem('token')
```

Si devuelve `null`, **NO estás autenticado** → Necesitas iniciar sesión primero.

---

## 📝 Paso 2: Crear Cotización

Una vez autenticado, ve a: http://localhost:5173/cotizaciones/nueva

### Campos de la Cotización:

#### **Paso 1: Cliente y Tipo**
- ✅ **Cliente**: Seleccionar de la lista (búsqueda mejorada)
- ✅ **Tipo**: VENTA o REPARACION
- ✅ **Validez**: Días que estará vigente (default 15)

#### **Paso 2: Productos/Repuestos**
- ✅ **Agregar Productos**: Modal con búsqueda, filtros y stock
- ✅ **Agregar Repuestos**: Para reparaciones
- ✅ **Agregar Manual**: Item personalizado
- ✅ Cada item tiene: cantidad, precio unitario, subtotal, impuestos

#### **Paso 3: Revisión y Guardado**
- ✅ Ver resumen completo
- ✅ Subtotal, impuestos, mano de obra (si es reparación), total
- ✅ Observaciones

---

## 🔄 Campos para Convertir a Venta

La tabla `cotizaciones` tiene estos campos preparados para conversión:

```sql
-- Campos de conversión
convertida_a ENUM('VENTA', 'REPARACION') NULL,
referencia_venta_id INT NULL,
referencia_reparacion_id INT NULL,
fecha_conversion DATETIME NULL,
```

### ✅ Lo que necesitas para convertir a venta:

1. **Items en formato JSON**: Ya guardados correctamente
   - id, nombre, cantidad, precioUnit, subtotal
   - Todo lo que necesita una venta

2. **Información del cliente**: Desnormalizada en la cotización
   - cliente_id, nombre, teléfono, email, nit, dirección
   - Listo para copiar a la venta

3. **Montos calculados**:
   - subtotal, impuestos, total
   - No hay que recalcular nada

4. **Estado**: Cuando se convierte:
   - `estado` → 'CONVERTIDA'
   - `convertida_a` → 'VENTA'
   - `referencia_venta_id` → ID de la venta creada
   - `fecha_conversion` → Timestamp

---

## 🚀 Endpoint para Convertir (Próximo a Crear)

```javascript
POST /api/cotizaciones/:id/convertir-venta

Body:
{
  "metodo_pago": "efectivo" | "tarjeta" | "credito-tecnocell",
  "notas": "Notas adicionales de la venta"
}

Proceso:
1. Verificar que cotización existe y está APROBADA
2. Crear registro en tabla 'ventas' con:
   - Todos los items de la cotización
   - Mismos montos
   - Cliente vinculado
3. Actualizar cotización:
   - estado = 'CONVERTIDA'
   - referencia_venta_id = nueva venta
   - fecha_conversion = NOW()
4. Crear interacción de tipo 'venta'
5. Actualizar stock de productos
```

---

## 🎯 Flujo Completo

```
1. Login (obtener token)
   ↓
2. /cotizaciones/nueva
   ↓
3. Seleccionar cliente
   ↓
4. Agregar productos
   ↓
5. Guardar cotización (BORRADOR)
   ↓
6. [FUTURO] Enviar/Aprobar cotización
   ↓
7. [FUTURO] Convertir a VENTA
   ↓
8. Se crea venta automática
   ↓
9. Stock se actualiza
   ↓
10. Interacción registrada
```

---

## 🐛 Solución al Error 401

### Error actual:
```
POST http://localhost:3000/api/cotizaciones 401 (Unauthorized)
❌ Error al crear cotización: {message: 'Token inválido o expirado'}
```

### Soluciones:

1. **No has iniciado sesión**:
   ```
   → Ve a http://localhost:5173/login
   → Ingresa usuario y contraseña
   → Prueba nuevamente
   ```

2. **Token expiró**:
   ```javascript
   // En consola del navegador:
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   // Luego vuelve a /login
   ```

3. **Usuario de prueba** (si no tienes uno):
   ```sql
   -- En MySQL (ya deberías tener usuarios de la instalación inicial)
   SELECT username, nombre FROM usuarios WHERE activo = true;
   ```

---

## ✅ Verificación Final

Antes de crear una cotización, verifica:

```javascript
// En consola del navegador (F12)
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Token:', token ? '✅ Existe' : '❌ No existe');
console.log('User:', user ? JSON.parse(user) : '❌ No existe');

// Si ambos existen, puedes crear cotizaciones
// Si no, ve a /login primero
```

---

## 📊 Campos de Cotización vs Venta

| Campo Cotización | Campo Venta | Notas |
|-----------------|-------------|-------|
| items (JSON) | items (JSON) | ✅ Mismo formato |
| cliente_id | cliente_id | ✅ Directo |
| cliente_nombre | - | Info para histórico |
| subtotal | subtotal | ✅ Directo |
| impuestos | impuestos | ✅ Directo |
| total | total | ✅ Directo |
| tipo | - | VENTA ya implícito |
| mano_de_obra | - | Solo si es REPARACION |
| observaciones | notas | ✅ Se copia |

**Conclusión**: Los campos están perfectamente diseñados para convertirse en venta. No hace falta cambiar nada. 👍

---

## 🎨 Próximos Pasos

1. ✅ Iniciar sesión
2. ✅ Crear cotización
3. 🔜 Crear endpoint de conversión a venta
4. 🔜 Crear tabla `ventas`
5. 🔜 Actualizar stock al convertir

---

**¿Necesitas crear la tabla de ventas ahora?** Avísame y la creo con todos los campos necesarios para que las cotizaciones se puedan convertir fácilmente.
