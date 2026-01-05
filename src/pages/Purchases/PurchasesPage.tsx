import { Plus, Save, Search } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatMoney } from "../../lib/format";
import { useCatalog } from "../../store/useCatalog";

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  total: number;
}

interface Purchase {
  id: string;
  supplier: string;
  docRef: string;
  date: string;
  items: PurchaseItem[];
  total: number;
  status: "draft" | "completed";
}

export default function PurchasesPage() {
  const { products } = useCatalog();
  const toast = useToast();

  const [purchases] = useState<Purchase[]>([
    {
      id: "P001",
      supplier: "Distribuidora Central",
      docRef: "FC-2024-001",
      date: "2024-10-20",
      status: "completed",
      total: 1250,
      items: [
        { productId: "1", productName: "Martillo 16oz", quantity: 10, cost: 25, total: 250 },
        { productId: "3", productName: "Cemento Gris 50kg", quantity: 20, cost: 50, total: 1000 },
      ],
    },
    {
      id: "P002",
      supplier: "Eléctricos del Norte",
      docRef: "FC-2024-002",
      date: "2024-10-19",
      status: "completed",
      total: 800,
      items: [
        { productId: "5", productName: "Foco LED 12W", quantity: 50, cost: 15, total: 750 },
        { productId: "6", productName: "Cinta Aislante", quantity: 25, cost: 2, total: 50 },
      ],
    },
  ]);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<Partial<Purchase>>({
    supplier: "",
    docRef: "",
    date: new Date().toISOString().split("T")[0],
    items: [],
    total: 0,
    status: "draft",
  });
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(0);

  const purchasesTableData = purchases.map((p) => ({
    ID: p.id,
    Proveedor: p.supplier,
    "Doc. Ref": p.docRef,
    Fecha: formatDate(p.date),
    Total: formatMoney(p.total),
    Estado: p.status === "completed" ? "Completada" : "Borrador",
    Acciones: (
      <Button variant="ghost" onClick={() => viewPurchase(p)}>
        Ver Detalle
      </Button>
    ),
  }));

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  function viewPurchase(purchase: Purchase) {
    setCurrentPurchase(purchase);
    setShowPurchaseModal(true);
  }

  function addItemToPurchase() {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const total = quantity * cost;
    const newItem: PurchaseItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      cost,
      total,
    };

    setCurrentPurchase((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
      total: (prev.total || 0) + total,
    }));

    setSelectedProduct("");
    setQuantity(1);
    setCost(0);
    setSearchProduct("");
  }

  function savePurchase() {
    toast.add("Compra registrada exitosamente");
    setShowPurchaseModal(false);
    setCurrentPurchase({
      supplier: "",
      docRef: "",
      date: new Date().toISOString().split("T")[0],
      items: [],
      total: 0,
      status: "draft",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 space-y-6 sm:space-y-8">
      <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
        <PageHeader title="Compras / Entradas" subtitle="Gestión de entradas de inventario" />
      </div>

      <Card className="mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Historial de Compras</h3>
              <p className="text-blue-100 mt-1">Registro completo de entradas de inventario</p>
            </div>
            <Button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              <Plus size={16} className="mr-2" />
              Nueva Entrada
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
        <div className="overflow-x-auto">
          <Table columns={Object.keys(purchasesTableData[0] || {})} data={purchasesTableData} />
        </div>
      </Card>

      <Modal
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="Registro de Entrada"
      >
        <div className="space-y-8">
          {/* Información general */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Información General
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Proveedor</label>
                <Input
                  value={currentPurchase.supplier || ""}
                  onChange={(e) =>
                    setCurrentPurchase({ ...currentPurchase, supplier: e.target.value })
                  }
                  placeholder="Nombre del proveedor"
                  className="border-2 border-blue-200 focus:border-blue-500 rounded-xl shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Doc. Referencia
                </label>
                <Input
                  value={currentPurchase.docRef || ""}
                  onChange={(e) =>
                    setCurrentPurchase({ ...currentPurchase, docRef: e.target.value })
                  }
                  placeholder="Factura, orden, etc."
                  className="border-2 border-blue-200 focus:border-blue-500 rounded-xl shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Fecha</label>
                <Input
                  type="date"
                  value={currentPurchase.date || ""}
                  onChange={(e) => setCurrentPurchase({ ...currentPurchase, date: e.target.value })}
                  className="border-2 border-blue-200 focus:border-blue-500 rounded-xl shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Agregar productos */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
            <h4 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
              Agregar Productos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-3 items-end">
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Producto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input
                    placeholder="Buscar producto..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="pl-10 border-2 border-emerald-200 focus:border-emerald-500 rounded-xl shadow-sm"
                  />
                </div>
                {searchProduct && (
                  <div className="absolute z-10 w-full bg-white border-2 border-emerald-200 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                    {filteredProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-emerald-100 last:border-b-0"
                        onClick={() => {
                          setSelectedProduct(product.id);
                          setSearchProduct(product.name);
                          setCost(product.cost);
                        }}
                      >
                        <div className="font-medium text-slate-800">{product.name}</div>
                        <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Cantidad</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  className="border-2 border-emerald-200 focus:border-emerald-500 rounded-xl shadow-sm"
                />
              </div>
              <div className="lg:col-span-3 space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Costo Unitario</label>
                <Input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  step="0.01"
                  className="border-2 border-emerald-200 focus:border-emerald-500 rounded-xl shadow-sm"
                />
              </div>
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Subtotal</label>
                <div className="p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-200 text-sm font-bold text-amber-800">
                  {formatMoney(quantity * cost)}
                </div>
              </div>
              <div className="lg:col-span-1 space-y-2">
                <label className="block text-sm font-semibold text-transparent">Acción</label>
                <Button
                  onClick={addItemToPurchase}
                  disabled={!selectedProduct}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de productos */}
          {currentPurchase.items && currentPurchase.items.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-slate-500 rounded-full mr-3"></div>
                Productos en la Entrada
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {currentPurchase.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-2"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{item.productName}</div>
                      <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium">
                          {item.quantity} unidades
                        </span>
                        <span className="text-slate-400">×</span>
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg text-xs font-medium">
                          {formatMoney(item.cost)}
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-lg text-slate-800 bg-amber-100 px-3 py-1 rounded-lg">
                      {formatMoney(item.total)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xl font-bold text-slate-700">Total de la Entrada:</span>
                <span className="text-2xl font-bold text-emerald-600 bg-emerald-100 px-4 py-2 rounded-xl shadow-sm">
                  {formatMoney(currentPurchase.total || 0)}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setShowPurchaseModal(false)}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-300 rounded-xl font-semibold transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={savePurchase}
              disabled={!currentPurchase.items?.length}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 shadow-xl rounded-xl font-semibold transition-all duration-200 hover:scale-105"
            >
              <Save size={16} className="mr-2" />
              Registrar Entrada
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
