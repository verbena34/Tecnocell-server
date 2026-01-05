import { CreditCard, Minus, Plus, Save, Scan, Search, Trash2, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { formatMoney } from "../../lib/format";
import { useAuth } from "../../store/useAuth";
import { useCatalog } from "../../store/useCatalog";
import { usePOS } from "../../store/usePOS";

export default function PosPage() {
  const location = useLocation();
  const { products } = useCatalog();
  const {
    cart,
    customerName,
    customerNit,
    globalDiscount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setCustomer,
    setGlobalDiscount,
    getSubtotal,
    getTotal,
  } = usePOS();
  const { role } = useAuth();
  const toast = useToast();

  const [barcode, setBarcode] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [tempCustomer, setTempCustomer] = useState({ name: customerName, nit: customerNit });

  // Precargar items desde cotización
  useEffect(() => {
    if (location.state?.preloadedItems) {
      clearCart();
      location.state.preloadedItems.forEach((item: any) => {
        addToCart({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        });
      });
      toast.add("Productos cargados desde cotización");
    }
  }, [location.state]);

  const filteredProducts = products.filter(
    (p) =>
      p.active &&
      (p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.barcode.includes(searchProduct))
  );

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      addToCart({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        discount: 0,
      });
      toast.add(`${product.name} agregado al carrito`);
      setBarcode("");
    } else {
      toast.add("Producto no encontrado");
    }
  }

  function handleProductSelect(product: any) {
    addToCart({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      discount: 0,
    });
    toast.add(`${product.name} agregado al carrito`);
    setShowProductModal(false);
    setSearchProduct("");
  }

  function updateQuantity(productId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartItem(productId, { quantity: newQuantity });
    }
  }

  function updateItemDiscount(productId: string, discount: number) {
    // Empleado máximo 10% de descuento
    if (role === "employee" && discount > 10) {
      toast.add("Empleados pueden aplicar máximo 10% de descuento");
      return;
    }
    updateCartItem(productId, { discount });
  }

  function handleCheckout() {
    if (cart.length === 0) {
      toast.add("El carrito está vacío");
      return;
    }
    toast.add("Procesando venta...");
    setTimeout(() => {
      toast.add("Venta completada exitosamente");
      clearCart();
    }, 1500);
  }

  function saveDraft() {
    toast.add("Borrador guardado");
  }

  function setCustomerInfo() {
    setCustomer(tempCustomer.name, tempCustomer.nit);
    setShowCustomerModal(false);
    toast.add("Cliente actualizado");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 space-y-6 sm:space-y-8">
      <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
        <PageHeader title="Punto de Venta" subtitle="Sistema de ventas avanzado" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Columna izquierda - Entrada de productos */}
        <div className="xl:col-span-2 space-y-6">
          {/* Escáner de código de barras */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
              <h3 className="text-lg font-bold flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Escáner de Código de Barras
              </h3>
              <p className="text-violet-100 mt-1">Agregue productos al carrito</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Scan className="absolute left-3 top-3 text-violet-400" size={18} />
                  <Input
                    placeholder="Escanee o escriba código de barras..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="pl-10 border-2 border-violet-200 focus:border-violet-500 rounded-xl shadow-sm"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 border-0 shadow-lg font-semibold transition-all duration-200 hover:scale-105"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar
                </Button>
              </form>
            </div>
          </Card>

          {/* Carrito de compras */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold">Carrito de Compras</h3>
                  <p className="text-emerald-100 mt-1">{cart.length} productos</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    onClick={saveDraft}
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-semibold"
                  >
                    <Save size={16} className="mr-2" />
                    Guardar Borrador
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowProductModal(true)}
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-semibold"
                  >
                    <Search size={16} className="mr-2" />
                    Buscar Productos
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-xl font-medium text-slate-600">El carrito está vacío</p>
                  <p className="text-sm text-slate-400 mt-2">Escanee un producto para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.productName}</div>
                        <div className="text-sm text-gray-600">{formatMoney(item.price)} c/u</div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      <div className="w-full sm:w-20">
                        <Input
                          type="number"
                          placeholder="Desc %"
                          value={item.discount || ""}
                          onChange={(e) =>
                            updateItemDiscount(item.productId, Number(e.target.value))
                          }
                          className="text-xs"
                          max={role === "employee" ? "10" : "100"}
                        />
                      </div>

                      <div className="w-full sm:w-20 text-right font-medium">
                        {formatMoney(item.total)}
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => removeFromCart(item.productId)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Atajos de teclado */}
          <Card className="hidden lg:block">
            <h4 className="font-medium mb-2">Atajos de Teclado</h4>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">F2</kbd> Buscar
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">F4</kbd> Descuento
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-100 rounded">F10</kbd> Cobrar
              </span>
            </div>
          </Card>
        </div>

        {/* Columna derecha - Resumen y cliente */}
        <div className="space-y-4 order-first xl:order-last">
          {/* Cliente */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Cliente</h3>
              <Button variant="ghost" onClick={() => setShowCustomerModal(true)}>
                <User size={16} />
              </Button>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Nombre:</span>
                <div className="font-medium truncate">{customerName || "Cliente General"}</div>
              </div>
              {customerNit && (
                <div>
                  <span className="text-sm text-gray-600">NIT:</span>
                  <div className="font-medium">{customerNit}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Resumen */}
          <Card>
            <h3 className="font-medium mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatMoney(getSubtotal())}</span>
              </div>

              {role === "admin" && (
                <div className="flex justify-between items-center">
                  <span>Descuento Global:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                      className="w-16 text-right"
                      max="100"
                    />
                    <span>%</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">{formatMoney(getTotal())}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button className="w-full" onClick={handleCheckout}>
                <CreditCard size={16} className="mr-2" />
                <span className="hidden sm:inline">Cobrar </span>({formatMoney(getTotal())})
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal buscar producto */}
      <Modal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Buscar Producto"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <Input
              placeholder="Buscar por nombre, SKU o código..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredProducts.slice(0, 20).map((product) => (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded hover:bg-gray-50 cursor-pointer gap-2"
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    {product.sku} • Stock: {product.stock}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatMoney(product.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal cliente */}
      <Modal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Información del Cliente"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <Input
              value={tempCustomer.name}
              onChange={(e) => setTempCustomer({ ...tempCustomer, name: e.target.value })}
              placeholder="Nombre del cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NIT (opcional)</label>
            <Input
              value={tempCustomer.nit}
              onChange={(e) => setTempCustomer({ ...tempCustomer, nit: e.target.value })}
              placeholder="Número de identificación tributaria"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowCustomerModal(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button onClick={setCustomerInfo} className="w-full sm:w-auto">
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
