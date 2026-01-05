const db = require('../config/database');

// Obtener todos los clientes
const getAllCustomers = async (req, res) => {
  try {
    const [customers] = await db.query(
      'SELECT * FROM clientes WHERE activo = true ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener clientes' 
    });
  }
};

// Buscar clientes
const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        success: false,
        message: 'Se requiere un término de búsqueda' 
      });
    }

    const [customers] = await db.query(
      `SELECT * FROM clientes 
       WHERE activo = true 
       AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR telefono LIKE ? OR nit LIKE ?)
       ORDER BY nombre ASC`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar clientes' 
    });
  }
};

// Obtener cliente por ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [customers] = await db.query('SELECT * FROM clientes WHERE id = ? AND activo = true', [id]);

    if (customers.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente no encontrado' 
      });
    }

    res.json({
      success: true,
      data: customers[0]
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener cliente' 
    });
  }
};

// Crear nuevo cliente
const createCustomer = async (req, res) => {
  try {
    console.log('📥 Datos recibidos en backend:', req.body);
    const { nombre, apellido, telefono, nit, email, direccion, metodo_pago_preferido, notas } = req.body;

    console.log('📋 nombre extraído:', nombre, 'tipo:', typeof nombre);

    // Validar datos requeridos
    if (!nombre || nombre.trim() === '') {
      console.log('❌ Validación falló: nombre vacío o undefined');
      return res.status(400).json({ 
        success: false,
        message: 'El nombre es requerido' 
      });
    }

    // Insertar cliente
    const [result] = await db.query(
      `INSERT INTO clientes (nombre, apellido, telefono, nit, email, direccion, metodo_pago_preferido, notas) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, 
        apellido || null, 
        telefono || null, 
        nit || null, 
        email || null, 
        direccion || null,
        metodo_pago_preferido || 'efectivo',
        notas || null
      ]
    );

    console.log('✅ Cliente creado con ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear cliente',
      error: error.message
    });
  }
};

// Actualizar cliente
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, nit, email, direccion, metodo_pago_preferido, notas } = req.body;

    // Verificar que el cliente existe
    const [customers] = await db.query('SELECT id FROM clientes WHERE id = ? AND activo = true', [id]);
    if (customers.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente no encontrado' 
      });
    }

    // Actualizar cliente
    await db.query(
      `UPDATE clientes 
       SET nombre = ?, apellido = ?, telefono = ?, nit = ?, email = ?, direccion = ?, metodo_pago_preferido = ?, notas = ?
       WHERE id = ?`,
      [
        nombre, 
        apellido || null, 
        telefono || null, 
        nit || null, 
        email || null, 
        direccion || null,
        metodo_pago_preferido || 'efectivo',
        notas || null,
        id
      ]
    );

    res.json({ 
      success: true,
      message: 'Cliente actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar cliente' 
    });
  }
};

// Eliminar cliente (soft delete)
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('UPDATE clientes SET activo = false WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Cliente no encontrado' 
      });
    }

    res.json({ 
      success: true,
      message: 'Cliente desactivado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar cliente' 
    });
  }
};

module.exports = {
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
