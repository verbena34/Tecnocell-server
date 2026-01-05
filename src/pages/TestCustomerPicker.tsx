// Prueba rápida para verificar que CustomerPicker funciona
import React, { useState } from 'react';
import CustomerPicker from '../components/customers/CustomerPicker';
import { Customer } from '../types/customer';

export default function TestCustomerPicker() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test CustomerPicker</h1>
      
      <CustomerPicker
        value={selectedCustomer}
        onChange={setSelectedCustomer}
        allowCreate={true}
        placeholder="Buscar cliente..."
      />
      
      {selectedCustomer && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold">Cliente seleccionado:</h3>
          <pre className="text-sm mt-2">
            {JSON.stringify(selectedCustomer, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}