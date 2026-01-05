import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Package, TrendingDown } from 'lucide-react';
import { getCriticalStockProducts } from '../../services/productService';
import { formatMoney } from '../../lib/format';

interface CriticalProduct {
  id: number;
  sku: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  precio_venta: number;
  categoria: string;
  faltante: number;
}

export const StockAlertsWidget: React.FC = () => {
  const [criticalProducts, setCriticalProducts] = useState<CriticalProduct[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCriticalProducts = async () => {
    try {
      setLoading(true);
      const response = await getCriticalStockProducts();
      if (response.success) {
        setCriticalProducts(response.data);
      }
    } catch (error) {
      console.error('Error al cargar productos críticos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCriticalProducts();
    // Actualizar cada 5 minutos
    const interval = setInterval(loadCriticalProducts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  if (criticalProducts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <Package className="w-5 h-5 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          Stock en niveles óptimos
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-red-50 border-2 border-red-300 hover:border-red-400 rounded-lg p-3 flex items-center gap-3 transition-all hover:shadow-md w-full text-left"
      >
        <div className="bg-red-100 p-2 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-700">
            Alerta de Stock Crítico
          </div>
          <div className="text-xs text-red-600">
            {criticalProducts.length} {criticalProducts.length === 1 ? 'producto necesita' : 'productos necesitan'} reabastecimiento
          </div>
        </div>
        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          {criticalProducts.length}
        </div>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-red-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Productos con Stock Crítico</h2>
                  <p className="text-red-100 text-sm">
                    {criticalProducts.length} {criticalProducts.length === 1 ? 'producto' : 'productos'} por debajo del stock mínimo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="hover:bg-red-700 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock Mínimo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Faltante
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {criticalProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{product.nombre}</div>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {product.sku}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {product.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                          <TrendingDown className="w-4 h-4" />
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {product.stock_minimo}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                          {product.faltante}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatMoney(product.precio_venta)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  💡 <strong>Sugerencia:</strong> Considera reabastecer estos productos para evitar ventas perdidas
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
