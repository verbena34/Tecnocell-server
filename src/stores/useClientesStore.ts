import React from 'react';
import { create } from 'zustand';
import { Cliente, ClienteForm, Customer } from '../types/customer';
import { useCustomers } from '../store/useCustomers';

// Función para convertir Customer a Cliente
function customerToCliente(customer: Customer): Cliente {
  return {
    id: customer.id,
    nombre: `${customer.firstName} ${customer.lastName}`,
    telefono: customer.phone,
    correo: customer.email,
    frecuente: customer.loyaltyPoints > 100 || customer.totalVisits > 5,
    nit: customer.nit,
    direccion: customer.address,
    notas: customer.notes,
    fechaRegistro: customer.createdAt,
    reparacionesAnteriores: 0, // TODO: obtener de sistema de reparaciones
    ultimaReparacion: customer.lastVisit,
    metodoPagoPreferido: customer.preferredPaymentMethod || 'efectivo'
  };
}

// Función para convertir Cliente a Customer
function clienteToCustomer(cliente: Cliente | ClienteForm, existingCustomer?: Customer): Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'customerSince' | 'loyaltyPoints'> {
  const nombres = cliente.nombre.split(' ');
  const firstName = nombres[0] || '';
  const lastName = nombres.slice(1).join(' ') || '';
  
  return {
    firstName,
    lastName,
    phone: cliente.telefono || '',
    nit: cliente.nit,
    email: cliente.correo,
    address: cliente.direccion,
    preferredPaymentMethod: ('metodoPagoPreferido' in cliente ? cliente.metodoPagoPreferido : 'efectivo') as "efectivo" | "tarjeta" | "transferencia",
    notes: cliente.notas,
    lastVisit: existingCustomer?.lastVisit
  };
}

interface ClientesState {
  clientes: Cliente[];
  isLoaded: boolean;
  
  // Acciones principales
  setClientes: (clientes: Cliente[]) => void;
  upsertCliente: (cliente: Cliente | ClienteForm) => Cliente;
  removeCliente: (id: string) => void;
  
  // Utilidades de búsqueda
  searchClientes: (query: string) => Cliente[];
  getClienteById: (id: string) => Cliente | undefined;
  getClientesFrecuentes: () => Cliente[];
  
  // Para hidratar desde mock data
  initializeFromMockData: () => void;
}

// Mock data inicial (misma que usa la vista Clientes)
const MOCK_CLIENTES: Cliente[] = [
  {
    id: '1',
    nombre: 'María González López',
    telefono: '5551-2345',
    correo: 'maria.gonzalez@email.com',
    frecuente: true,
    nit: '12345678-9',
    direccion: 'Zona 10, Guatemala',
    fechaRegistro: '2024-01-15',
    reparacionesAnteriores: 5,
    ultimaReparacion: '2024-09-20',
    metodoPagoPreferido: 'transferencia'
  },
  {
    id: '2',
    nombre: 'Carlos Mendoza Rivera',
    telefono: '5552-3456',
    correo: 'carlos.mendoza@email.com',
    frecuente: false,
    nit: '23456789-0',
    direccion: 'Zona 7, Guatemala',
    fechaRegistro: '2024-02-10',
    reparacionesAnteriores: 1,
    ultimaReparacion: '2024-08-15',
    metodoPagoPreferido: 'efectivo'
  },
  {
    id: '3',
    nombre: 'Ana Patricia Morales',
    telefono: '5553-4567',
    correo: 'ana.morales@email.com',
    frecuente: true,
    nit: '34567890-1',
    direccion: 'Zona 14, Guatemala',
    fechaRegistro: '2024-01-05',
    reparacionesAnteriores: 8,
    ultimaReparacion: '2024-10-10',
    metodoPagoPreferido: 'tarjeta'
  },
  {
    id: '4',
    nombre: 'Roberto Jiménez Castro',
    telefono: '5554-5678',
    correo: 'roberto.jimenez@email.com',
    frecuente: false,
    direccion: 'Zona 12, Guatemala',
    fechaRegistro: '2024-03-20',
    reparacionesAnteriores: 2,
    ultimaReparacion: '2024-07-25',
    metodoPagoPreferido: 'efectivo'
  },
  {
    id: '5',
    nombre: 'Luisa Elena Vásquez',
    telefono: '5555-6789',
    correo: 'luisa.vasquez@email.com',
    frecuente: true,
    nit: '45678901-2',
    direccion: 'Zona 15, Guatemala',
    fechaRegistro: '2024-01-30',
    reparacionesAnteriores: 6,
    ultimaReparacion: '2024-09-30',
    metodoPagoPreferido: 'transferencia'
  },
  {
    id: '6',
    nombre: 'Miguel Angel Torres',
    telefono: '5556-7890',
    correo: 'miguel.torres@email.com',
    frecuente: false,
    direccion: 'Zona 9, Guatemala',
    fechaRegistro: '2024-04-12',
    reparacionesAnteriores: 0,
    metodoPagoPreferido: 'efectivo'
  }
];

export const useClientesStore = create<ClientesState>((set, get) => ({
  clientes: [],
  isLoaded: false,

  setClientes: (clientes: Cliente[]) => {
    set({ clientes, isLoaded: true });
  },

  upsertCliente: (clienteData: Cliente | ClienteForm) => {
    const clientes = get().clientes;
    
    // Si es un cliente existente (tiene id), actualizar
    if ('id' in clienteData && clienteData.id) {
      const updatedClientes = clientes.map(c => 
        c.id === clienteData.id ? { ...c, ...clienteData } : c
      );
      set({ clientes: updatedClientes });
      return clienteData as Cliente;
    }
    
    // Si es nuevo cliente (ClienteForm), crear uno nuevo
    const nuevoCliente: Cliente = {
      id: `cliente_${Date.now()}`,
      nombre: clienteData.nombre,
      telefono: clienteData.telefono,
      correo: clienteData.correo,
      frecuente: false,
      nit: 'nit' in clienteData ? clienteData.nit : undefined,
      direccion: 'direccion' in clienteData ? clienteData.direccion : undefined,
      notas: 'notas' in clienteData ? clienteData.notas : undefined,
      fechaRegistro: new Date().toISOString().split('T')[0],
      reparacionesAnteriores: 0,
      metodoPagoPreferido: 'efectivo'
    };

    set({ clientes: [...clientes, nuevoCliente] });
    return nuevoCliente;
  },

  removeCliente: (id: string) => {
    const clientes = get().clientes;
    const filteredClientes = clientes.filter(c => c.id !== id);
    set({ clientes: filteredClientes });
  },

  searchClientes: (query: string) => {
    const clientes = get().clientes;
    if (!query.trim()) return clientes;

    const searchTerm = query.toLowerCase();
    return clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm) ||
      cliente.telefono?.includes(query) ||
      cliente.correo?.toLowerCase().includes(searchTerm) ||
      cliente.nit?.includes(query)
    );
  },

  getClienteById: (id: string) => {
    const clientes = get().clientes;
    return clientes.find(c => c.id === id);
  },

  getClientesFrecuentes: () => {
    const clientes = get().clientes;
    return clientes.filter(c => c.frecuente === true);
  },

  initializeFromMockData: () => {
    const isLoaded = get().isLoaded;
    if (!isLoaded) {
      set({ clientes: MOCK_CLIENTES, isLoaded: true });
    }
  }
}));

// Hook personalizado para facilitar el uso con sincronización automática
export const useClientes = () => {
  const store = useClientesStore();
  const customerStore = useCustomers();
  
  // Sincronizar automáticamente con el store de customers
  React.useEffect(() => {
    const clientesFromCustomers = customerStore.customers.map(customerToCliente);
    if (clientesFromCustomers.length > 0) {
      store.setClientes(clientesFromCustomers);
    } else if (!store.isLoaded) {
      // Solo usar mock data si no hay customers y no se ha cargado
      store.initializeFromMockData();
    }
  }, [customerStore.customers, store.isLoaded, store.setClientes, store.initializeFromMockData]);

  // Función mejorada para crear clientes que sincroniza con ambos stores
  const createClienteWithSync = React.useCallback((clienteData: ClienteForm): Cliente => {
    // Crear en el store de customers primero
    const customerData = clienteToCustomer(clienteData);
    customerStore.addCustomer(customerData);
    
    // El useEffect de arriba se encargará de sincronizar automáticamente
    // pero retornamos el cliente creado inmediatamente
    const nuevoCliente: Cliente = {
      id: `cliente_${Date.now()}`,
      nombre: clienteData.nombre,
      telefono: clienteData.telefono,
      correo: clienteData.correo,
      frecuente: false,
      nit: clienteData.nit,
      direccion: clienteData.direccion,
      notas: clienteData.notas,
      fechaRegistro: new Date().toISOString().split('T')[0],
      reparacionesAnteriores: 0,
      metodoPagoPreferido: 'efectivo'
    };

    return store.upsertCliente(nuevoCliente);
  }, [customerStore.addCustomer, store.upsertCliente]);

  return {
    ...store,
    upsertCliente: createClienteWithSync
  };
};

// TODO: sustituir por API real
export const clientesApi = {
  async getAll(): Promise<Cliente[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_CLIENTES;
  },

  async create(cliente: ClienteForm): Promise<Cliente> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return useClientesStore.getState().upsertCliente(cliente);
  },

  async update(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const clienteExistente = useClientesStore.getState().getClienteById(id);
    if (!clienteExistente) throw new Error('Cliente no encontrado');
    
    const clienteActualizado = { ...clienteExistente, ...updates };
    return useClientesStore.getState().upsertCliente(clienteActualizado);
  }
};