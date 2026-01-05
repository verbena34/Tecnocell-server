# 🖼️ Sistema de Reparaciones con Almacenamiento de Imágenes

## Descripción General

Sistema completo de gestión de reparaciones con soporte para almacenamiento de imágenes en servidor Hetzner usando **Nginx** para servir archivos estáticos.

---

## 🏗️ Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────┐
│  SERVIDOR HETZNER                                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  NGINX (Puerto 80/443)                         │     │
│  │  ┌──────────────────┐  ┌────────────────────┐ │     │
│  │  │ /uploads/        │  │ /api/              │ │     │
│  │  │ (Archivos)       │  │ (Proxy → :3000)    │ │     │
│  │  └──────────────────┘  └────────────────────┘ │     │
│  └────────────────────────────────────────────────┘     │
│                                  │                       │
│  ┌────────────────────────────────────────────────┐     │
│  │  Node.js + Express (Puerto 3000)               │     │
│  │  + Multer (manejo de uploads)                  │     │
│  └────────────────────────────────────────────────┘     │
│                                  │                       │
│  ┌────────────────────────────────────────────────┐     │
│  │  MySQL Database (tecnocell_web)                │     │
│  │  - reparaciones                                │     │
│  │  - reparaciones_historial                      │     │
│  │  - reparaciones_imagenes (solo rutas)          │     │
│  │  - reparaciones_accesorios                     │     │
│  │  - reparaciones_items                          │     │
│  └────────────────────────────────────────────────┘     │
│                                  │                       │
│  ┌────────────────────────────────────────────────┐     │
│  │  Sistema de Archivos                           │     │
│  │  /var/www/tecnocell/Tecnocell_backend/uploads/ │     │
│  │    └── reparaciones/                           │     │
│  │          └── REP1704412800000/                 │     │
│  │                ├── recepcion/                  │     │
│  │                │     ├── img_001.jpg   (2.3MB) │     │
│  │                │     └── img_002.jpg   (1.8MB) │     │
│  │                ├── historial/                  │     │
│  │                │     ├── hist_1_001.jpg (3.1MB)│     │
│  │                │     └── hist_2_001.jpg (2.7MB)│     │
│  │                └── finales/                    │     │
│  │                      └── final_001.jpg  (2.9MB)│     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Base de Datos

### Tabla: `reparaciones`

Almacena la información principal de cada reparación.

```sql
CREATE TABLE reparaciones (
  id VARCHAR(50) PRIMARY KEY,             -- REP1704412800000
  cliente_nombre VARCHAR(200),
  tipo_equipo ENUM('Telefono','Laptop'...),
  marca VARCHAR(100),
  modelo VARCHAR(150),
  estado ENUM('RECIBIDA','EN_PROCESO'...) DEFAULT 'RECIBIDA',
  monto_anticipo INT,                     -- En centavos: 15000 = Q150.00
  saldo_anticipo INT,                     -- En centavos
  sticker_serie_interna VARCHAR(50) UNIQUE,
  fecha_ingreso DATE,
  ...
);
```

### Tabla: `reparaciones_historial`

Almacena cada cambio de estado de la reparación.

```sql
CREATE TABLE reparaciones_historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reparacion_id VARCHAR(50),
  estado ENUM('RECIBIDA','EN_PROCESO'...),
  nota TEXT NOT NULL,
  pieza_necesaria VARCHAR(255),
  costo_repuesto INT,                     -- En centavos
  user_nombre VARCHAR(100),
  created_at TIMESTAMP,
  FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE
);
```

### Tabla: `reparaciones_imagenes` ⭐

**Solo almacena rutas, NO archivos binarios.**

```sql
CREATE TABLE reparaciones_imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reparacion_id VARCHAR(50),
  historial_id INT NULL,                  -- NULL = foto de recepción
  tipo ENUM('recepcion','historial','final','comprobante'),
  filename VARCHAR(255),                  -- "hist_5_1704412800000.jpg"
  url_path VARCHAR(500),                  -- "/uploads/reparaciones/REP.../hist_5.jpg"
  file_size INT,                          -- 2458672 bytes
  mime_type VARCHAR(100),                 -- "image/jpeg"
  created_at TIMESTAMP,
  FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE
);
```

**Ejemplo de registro:**
```json
{
  "id": 123,
  "reparacion_id": "REP1704412800000",
  "historial_id": 5,
  "tipo": "historial",
  "filename": "pantalla_rota_1704412800000.jpg",
  "url_path": "/uploads/reparaciones/REP1704412800000/historial/pantalla_rota_1704412800000.jpg",
  "file_size": 2458672,
  "mime_type": "image/jpeg",
  "created_at": "2026-01-04 15:30:00"
}
```

---

## 🔄 Flujo Completo de Subida de Imágenes

### 1️⃣ **Usuario selecciona fotos en el formulario**

```typescript
// Frontend - StateChangeModal.tsx
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  setSelectedFiles(prev => [...prev, ...files]);
};
```

### 2️⃣ **Frontend envía formulario con archivos**

```typescript
// Frontend - repairService.ts
const changeRepairState = async (id, stateChange, fotos) => {
  const formData = new FormData();
  
  // Agregar archivos binarios
  fotos.forEach(file => {
    formData.append('fotos', file);  // File object del navegador
  });
  
  // Agregar datos JSON
  formData.append('estado', 'EN_PROCESO');
  formData.append('nota', 'Iniciando reparación de pantalla');
  
  // POST al backend
  await axios.post(`/api/reparaciones/${id}/estado`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
```

### 3️⃣ **Backend recibe y guarda archivos con Multer**

```javascript
// Backend - reparacionController.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const repairId = req.params.id;
    const uploadPath = `uploads/reparaciones/${repairId}/historial`;
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `hist_${timestamp}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Route
app.post('/api/reparaciones/:id/estado', upload.array('fotos', 10), async (req, res) => {
  const uploadedFiles = req.files;  // Archivos ya guardados en disco
  
  // uploadedFiles = [
  //   {
  //     filename: 'hist_1704412800000.jpg',
  //     path: 'uploads/reparaciones/REP123/historial/hist_1704412800000.jpg',
  //     size: 2458672,
  //     mimetype: 'image/jpeg'
  //   }
  // ]
  
  // Guardar referencias en BD
  for (const file of uploadedFiles) {
    await db.query(
      'INSERT INTO reparaciones_imagenes (reparacion_id, tipo, filename, url_path, file_size) VALUES (?, ?, ?, ?, ?)',
      ['REP123', 'historial', file.filename, `/uploads/reparaciones/REP123/historial/${file.filename}`, file.size]
    );
  }
});
```

### 4️⃣ **Archivos guardados en disco**

```
/var/www/tecnocell/Tecnocell_backend/uploads/reparaciones/REP1704412800000/historial/
  ├── hist_1704412800000.jpg     (archivo físico en disco)
  ├── hist_1704412801234.jpg     (archivo físico en disco)
  └── hist_1704412802567.jpg     (archivo físico en disco)
```

### 5️⃣ **Nginx sirve las imágenes**

```nginx
# /etc/nginx/sites-available/tecnocell
location /uploads/ {
  alias /var/www/tecnocell/Tecnocell_backend/uploads/;
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

### 6️⃣ **Frontend obtiene URLs y muestra imágenes**

```typescript
// Frontend - StateHistory.tsx
const historial = await repairService.getReparacionById('REP123');

// historial.historial[0].fotos = [
//   "/uploads/reparaciones/REP123/historial/hist_1704412800000.jpg",
//   "/uploads/reparaciones/REP123/historial/hist_1704412801234.jpg"
// ]

const imageUrl = repairService.getImageUrl(historial.historial[0].fotos[0]);
// → "https://api.tecnocell.com/uploads/reparaciones/REP123/historial/hist_1704412800000.jpg"

<img src={imageUrl} alt="Foto reparación" />
// El navegador descarga la imagen directamente desde Nginx
```

---

## 🌐 URLs de Acceso

### Desarrollo Local
```
API: http://localhost:3000/api/
Imágenes: http://localhost:3000/uploads/reparaciones/REP123/historial/img.jpg
```

### Producción Hetzner
```
API: https://api.tecnocell.com/api/
Imágenes: https://api.tecnocell.com/uploads/reparaciones/REP123/historial/img.jpg
```

---

## 📊 Estimación de Almacenamiento

### Por Reparación:
- 3 fotos recepción × 2 MB = 6 MB
- 5 fotos historial × 2 MB = 10 MB  
- 2 fotos finales × 2 MB = 4 MB  
**Total: ~20 MB/reparación**

### Proyección:
- 100 reparaciones/mes × 20 MB = **2 GB/mes**
- 12 meses = **24 GB/año**
- Servidor con 40 GB SSD = **Suficiente para 2+ años**

---

## 🔐 Seguridad

### Validaciones Backend:
```javascript
const fileFilter = (req, file, cb) => {
  // Solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5 MB máximo
});
```

### Sanitización de Nombres:
```javascript
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname);
  const basename = path.basename(file.originalname, ext);
  const sanitized = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
  cb(null, `${sanitized}_${Date.now()}${ext}`);
}
```

### Permisos Nginx:
```bash
chown -R www-data:www-data /var/www/tecnocell/Tecnocell_backend/uploads
chmod -R 755 /var/www/tecnocell/Tecnocell_backend/uploads
```

---

## 🚀 API Endpoints

### **POST** `/api/reparaciones`
Crear nueva reparación con fotos de recepción.

**Request:**
```json
{
  "clienteNombre": "Juan Pérez",
  "tipoEquipo": "Telefono",
  "marca": "Apple",
  "modelo": "iPhone 14 Pro",
  "estado": "RECIBIDA",
  "montoAnticipo": 150,
  "fotosRecepcion": []  // Se suben por separado
}
```

### **POST** `/api/reparaciones/:id/estado`
Cambiar estado con imágenes (multipart/form-data).

**FormData:**
```
fotos: [File, File, File]
estado: "EN_PROCESO"
subEtapa: "REPARACION"
nota: "Reemplazando pantalla"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "historialId": 123,
    "imagenesSubidas": 3
  }
}
```

### **GET** `/api/reparaciones/:id`
Obtener reparación con historial e imágenes.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "REP1704412800000",
    "cliente_nombre": "Juan Pérez",
    "estado": "EN_PROCESO",
    "fotosRecepcion": [
      "/uploads/reparaciones/REP.../recepcion/img1.jpg"
    ],
    "historial": [
      {
        "id": 1,
        "estado": "RECIBIDA",
        "nota": "Equipo recibido",
        "fotos": [
          "/uploads/reparaciones/REP.../historial/hist_1.jpg"
        ]
      }
    ]
  }
}
```

---

## 💾 Backup

### Backup de Archivos:
```bash
# Comprimir uploads
tar -czf backup_uploads_$(date +%Y%m%d).tar.gz /var/www/tecnocell/Tecnocell_backend/uploads

# Copiar a servidor remoto
rsync -avz /var/www/tecnocell/Tecnocell_backend/uploads/ usuario@backup-server:/backups/tecnocell/uploads/
```

### Backup de Base de Datos:
```bash
# Dump de MySQL
mysqldump -u root -p tecnocell_web reparaciones reparaciones_historial reparaciones_imagenes > backup_db_$(date +%Y%m%d).sql

# Comprimir
gzip backup_db_$(date +%Y%m%d).sql
```

### Automatizar con Cron:
```bash
# crontab -e
0 2 * * * /root/backup_tecnocell.sh
```

---

## ✅ Ventajas de Este Sistema

1. **✅ Base de datos ligera** - Solo rutas, no archivos binarios
2. **✅ Nginx ultra rápido** - Sirve imágenes directamente sin Node.js
3. **✅ Fácil de escalar** - Podemos mover a S3/CDN después
4. **✅ Organizado** - Estructura clara por reparación
5. **✅ Backups simples** - `rsync` + `mysqldump`
6. **✅ Sin pérdida de datos** - Todo persistido en servidor
7. **✅ Trazabilidad completa** - Historial con fotos de cada cambio
8. **✅ Caché eficiente** - Nginx cachea automáticamente

---

## 📚 Archivos Creados

- ✅ **SQL:** `Tecnocell_backend/scripts/create-reparaciones-schema.sql`
- ✅ **Controller:** `Tecnocell_backend/controllers/reparacionController.js`
- ✅ **Routes:** `Tecnocell_backend/routes/reparacionRoutes.js`
- ✅ **Nginx Config:** `Tecnocell_backend/nginx/tecnocell.conf`
- ✅ **Guía Hetzner:** `Tecnocell_backend/nginx/INSTALACION-HETZNER.md`
- ✅ **Frontend Service:** `src/services/repairService.ts`
- ✅ **Documentación:** Este archivo

---

## 🎯 Próximos Pasos

1. ✅ Actualizar componentes frontend para usar `repairService`
2. ✅ Migrar datos de localStorage a base de datos
3. ✅ Configurar Nginx en servidor Hetzner
4. ✅ Configurar SSL con Let's Encrypt
5. ✅ Implementar autenticación de usuarios
6. ✅ Configurar backups automáticos

---

## 🆘 Soporte

Para problemas o dudas, consultar:
- **Instalación Hetzner:** `nginx/INSTALACION-HETZNER.md`
- **Configuración Nginx:** `nginx/tecnocell.conf`
- **API Docs:** Endpoints listados arriba
