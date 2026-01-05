const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde /uploads (para desarrollo local)
// En producción con Nginx, esto no será necesario
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const cotizacionRoutes = require('./routes/cotizacionRoutes');
const repuestoRoutes = require('./routes/repuestoRoutes');
const marcaLineaRoutes = require('./routes/marcaLineaRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const equipoRoutes = require('./routes/equipoRoutes');
const reparacionRoutes = require('./routes/reparacionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/repuestos', repuestoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/reparaciones', reparacionRoutes);
app.use('/api', marcaLineaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Tecnocell funcionando correctamente' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
