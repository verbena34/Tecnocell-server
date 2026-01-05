import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Plus, Search, Eye, CheckCircle, X, Download, Filter, DollarSign, 
  CreditCard, Package, Wallet, ShoppingBag, FileText, User, Calendar,
  TrendingUp, Receipt, BarChart3, History, ShoppingCart
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { formatMoney, formatDate } from "../../lib/format";
import { useSales } from "../../store/useSales";

interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

interface Sale {
  id: string;
  customerName: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: "pending" | "completed" | "cancelled";
  paymentMethod: "efectivo" | "tarjeta" | "transferencia";
  transferenceImage?: string;
  fromQuote?: string;
}

// Mock data mejorado con más ventas y variedad
const mockSales: Sale[] = [
  {
    id: "V001",
    customerName: "Carlos Martínez",
    date: new Date().toISOString().split('T')[0], // Fecha de hoy
    items: [
      { id: "1", productId: "P001", productName: "Martillo 16oz", quantity: 2, price: 25.00, discount: 0, total: 50.00 },
      { id: "2", productId: "P002", productName: "Destornillador Phillips", quantity: 3, price: 12.00, discount: 2.00, total: 34.00 }
    ],
    subtotal: 84.00,
    discount: 2.00,
    tax: 9.84,
    total: 91.84,
    status: "completed",
    paymentMethod: "efectivo"
  },
  {
    id: "V002",
    customerName: "Ana García",
    date: new Date().toISOString().split('T')[0], // Fecha de hoy
    items: [
      { id: "3", productId: "P003", productName: "Taladro Eléctrico", quantity: 1, price: 180.00, discount: 20.00, total: 160.00 }
    ],
    subtotal: 160.00,
    discount: 20.00,
    tax: 16.80,
    total: 176.80,
    status: "completed", // Cambiar a completada para que aparezca en ingresos
    paymentMethod: "tarjeta"
  },
  {
    id: "V002B",
    customerName: "Roberto Silva", 
    date: new Date().toISOString().split('T')[0], // Otra venta de hoy
    items: [
      { id: "7", productId: "P007", productName: "Caja de Tornillos", quantity: 3, price: 15.00, discount: 0, total: 45.00 }
    ],
    subtotal: 45.00,
    discount: 0,
    tax: 5.40,
    total: 50.40,
    status: "completed",
    paymentMethod: "efectivo"
  },
  {
    id: "V003",
    customerName: "Luis Hernández",
    date: "2024-10-24",
    items: [
      { id: "4", productId: "P004", productName: "Sierra Circular", quantity: 1, price: 320.00, discount: 0, total: 320.00 },
      { id: "5", productId: "P005", productName: "Discos de Corte", quantity: 5, price: 8.00, discount: 0, total: 40.00 }
    ],
    subtotal: 360.00,
    discount: 0,
    tax: 43.20,
    total: 403.20,
    status: "completed",
    paymentMethod: "transferencia"
  },
  {
    id: "V004",
    customerName: "María López",
    date: "2024-10-23",
    items: [
      { id: "6", productId: "P006", productName: "Llave Inglesa", quantity: 2, price: 35.00, discount: 5.00, total: 65.00 }
    ],
    subtotal: 65.00,
    discount: 5.00,
    tax: 7.20,
    total: 72.20,
    status: "cancelled",
    paymentMethod: "efectivo"
  }
];

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Estados para el procesamiento de pagos
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia" | null>(null);
  const [saleToComplete, setSaleToComplete] = useState<Sale | null>(null);
  const [transferenceImage, setTransferenceImage] = useState<File | null>(null);
  const [transferenceImagePreview, setTransferenceImagePreview] = useState<string>("");
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Manejar datos de cotización convertida
  useEffect(() => {
    if (location.state?.fromQuote && location.state?.quoteData) {
      const quoteData = location.state.quoteData;
      const newSale: Sale = {
        id: `V${Date.now()}`,
        customerName: quoteData.customerName,
        date: new Date().toISOString().split('T')[0],
        items: quoteData.items.map((item: any, index: number) => ({
          id: `${index + 1}`,
          productId: item.productId || `P${index + 1}`,
          productName: item.name || item.productName,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          total: (item.quantity * item.price) - (item.discount || 0)
        })),
        subtotal: quoteData.total,
        discount: location.state.quoteData.globalDiscountAmount || 0,
        tax: (quoteData.total - (location.state.quoteData.globalDiscountAmount || 0)) * 0.12,
        total: (quoteData.total - (location.state.quoteData.globalDiscountAmount || 0)) * 1.12,
        status: "pending",
        paymentMethod: location.state.quoteData.paymentMethod || "efectivo",
        transferenceImage: location.state.quoteData.transferenceImage,
        fromQuote: quoteData.id,
      };
      
      setSales(prev => [newSale, ...prev]);
      setSelectedSale(newSale);
      setShowDetailsModal(true);
      
      // Clear location state
      navigate('/ventas', { replace: true });
    }
    
    // Manejar regreso del pago con tarjeta
    if (location.state?.paymentCompleted && location.state?.paymentMethod === 'tarjeta') {
      // Encontrar la venta pendiente más reciente y completarla
      const pendingSale = sales.find(sale => sale.status === 'pending');
      if (pendingSale) {
        setSales(prev => prev.map(sale => 
          sale.id === pendingSale.id 
            ? { 
                ...sale, 
                status: "completed" as const,
                paymentMethod: "tarjeta",
                completedAt: new Date().toISOString(),
                transactionId: location.state.transactionId
              }
            : sale
        ));
      }
      
      toast.add("Pago con tarjeta procesado exitosamente", "success");
      // Clear location state
      navigate('/ventas', { replace: true });
    }
  }, [location.state, navigate, toast]);

  // Funciones para manejar las acciones
  function handleViewDetails(sale: Sale) {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  }

  function handleCompleteSale(saleId: string) {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      setSaleToComplete(sale);
      setShowPaymentModal(true);
    }
  }

  function handleCancelSale(saleId: string) {
    setSales(sales.map(sale => 
      sale.id === saleId 
        ? { ...sale, status: "cancelled" as const }
        : sale
    ));
    toast.add("Venta cancelada");
  }

  // Funciones para manejar métodos de pago
  function handlePaymentMethodSelect(method: "efectivo" | "tarjeta" | "transferencia") {
    setSelectedPaymentMethod(method);
    
    if (method === "efectivo") {
      // Para efectivo, completar directamente
      completeSaleWithMethod(method);
    } else if (method === "tarjeta") {
      // Para tarjeta, redirigir al POS
      setShowPaymentModal(false);
      navigate('/pago-tarjeta', { 
        state: { 
          saleId: saleToComplete?.id,
          amount: saleToComplete?.total,
          customerName: saleToComplete?.customerName
        }
      });
    } else if (method === "transferencia") {
      // Para transferencia, mantener el modal abierto para subir imagen
      // No hacer nada más, esperar a que suban la imagen
    }
  }

  function completeSaleWithMethod(method: "efectivo" | "tarjeta" | "transferencia", imageUrl?: string) {
    if (!saleToComplete) return;

    // Si es pago con tarjeta, navegar a la página de POS
    if (method === "tarjeta") {
      navigate('/pago-tarjeta', { 
        state: { 
          saleData: saleToComplete,
          amount: saleToComplete.total,
          returnTo: '/ventas'
        }
      });
      setShowPaymentModal(false);
      setSaleToComplete(null);
      return;
    }

    // Para efectivo y transferencia, completar inmediatamente
    if (method === "transferencia" && !imageUrl) {
      toast.add("Por favor suba el comprobante de transferencia", "error");
      return;
    }

    setSales(prev => prev.map(sale => 
      sale.id === saleToComplete.id 
        ? { 
            ...sale, 
            status: "completed" as const,
            paymentMethod: method,
            transferenceImage: imageUrl,
            completedAt: new Date().toISOString()
          }
        : sale
    ));

    toast.add(`Venta completada con pago por ${method}`, "success");
    setShowPaymentModal(false);
    setShowDetailsModal(false);
    resetPaymentStates();
  }

  function resetPaymentStates() {
    setSaleToComplete(null);
    setSelectedPaymentMethod(null);
    setTransferenceImage(null);
    setTransferenceImagePreview("");
  }

  function handleTransferenceImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setTransferenceImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setTransferenceImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function completeTransferencePayment() {
    if (!transferenceImagePreview) {
      toast.add("Debe subir el comprobante de transferencia", "error");
      return;
    }
    completeSaleWithMethod("transferencia", transferenceImagePreview);
  }

  function removeTransferenceImage() {
    setTransferenceImage(null);
    setTransferenceImagePreview("");
  }

  // Filtrar ventas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = !searchQuery || 
      sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Estadísticas de ventas
  const today = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
  const todaySales = sales.filter(s => s.date === today);
  const todayRevenue = todaySales.filter(s => s.status === "completed").reduce((sum, sale) => sum + sale.total, 0);
  
  const completedSales = sales.filter(s => s.status === "completed");
  const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSale = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;
  
  // Estadísticas del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthSales = sales.filter(s => {
    const saleDate = new Date(s.date);
    return saleDate.getMonth() === currentMonth && 
           saleDate.getFullYear() === currentYear &&
           s.status === "completed";
  });
  const monthlyRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);

  function getStatusColor(status: string) {
    switch (status) {
      case "completed": return "green";
      case "pending": return "yellow";
      case "cancelled": return "red";
      default: return "gray";
    }
  }

  function getPaymentMethodIcon(method: string) {
    switch (method) {
      case "efectivo": return "💵";
      case "tarjeta": return "💳";
      case "transferencia": return "🏦";
      default: return "💰";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
        <PageHeader title="Gestión de Ventas" subtitle="Control y seguimiento de todas las ventas" />
      </div>

      {/* Estadísticas Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas Hoy */}
        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Ventas Hoy</p>
                <p className="text-3xl font-bold">{todaySales.length}</p>
                <p className="text-emerald-100 text-sm">
                  {todayRevenue > 0 ? formatMoney(todayRevenue) : "Sin ventas hoy"}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <ShoppingCart size={24} />
              </div>
            </div>
          </div>
        </Card>

        {/* Total Ventas */}
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Ventas</p>
                <p className="text-3xl font-bold">{completedSales.length}</p>
                <p className="text-blue-100 text-sm">completadas</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Receipt size={24} />
              </div>
            </div>
          </div>
        </Card>

        {/* Ingresos */}
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Ingresos</p>
                <p className="text-3xl font-bold">{formatMoney(totalRevenue)}</p>
                <p className="text-green-100 text-sm">total acumulado</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
        </Card>

        {/* Promedio */}
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Promedio</p>
                <p className="text-3xl font-bold">{formatMoney(averageSale)}</p>
                <p className="text-purple-100 text-sm">por venta</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Navegación por pestañas */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={18} />
                Vista General
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <History size={18} />
                Historial de Ventas
              </div>
            </button>
          </nav>
        </div>

        {/* Contenido de la pestaña Vista General */}
        {activeTab === "overview" && (
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Ventas Recientes</h3>
                <p className="text-gray-600">Gestiona las ventas activas y pendientes</p>
              </div>
              <Button
                onClick={() => navigate('/ventas/nueva')}
                className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-lg font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus size={18} className="mr-2" />
                ✨ Nueva Venta
              </Button>
            </div>

            {/* Filtros */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Buscar por cliente o ID de venta..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-2 border-gray-200 focus:border-emerald-400 rounded-xl"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="bg-white border-2 border-gray-200 focus:border-emerald-400 rounded-xl"
                >
                  <option value="">Todos los estados</option>
                  <option value="completed">Completadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Canceladas</option>
                </Select>
              </div>
            </div>

            {/* Grid de ventas recientes */}
            {filteredSales.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSales.slice(0, 6).map((sale) => (
                  <Card key={sale.id} className="bg-white border-2 border-gray-100 hover:border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{sale.id}</h4>
                          <p className="text-gray-600 font-medium">{sale.customerName || "Cliente General"}</p>
                        </div>
                        <Badge color={getStatusColor(sale.status)} className="font-semibold">
                          {sale.status === "completed" && "✅ Completada"}
                          {sale.status === "pending" && "⏳ Pendiente"}
                          {sale.status === "cancelled" && "❌ Cancelada"}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-xl text-emerald-600">{formatMoney(sale.total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Pago:</span>
                          <span className="font-medium">
                            {getPaymentMethodIcon(sale.paymentMethod)} {sale.paymentMethod}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Items:</span>
                          <span className="font-medium">{sale.items.length} productos</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Fecha:</span>
                          <span className="font-medium">{formatDate(sale.date)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleViewDetails(sale)}
                          className="flex-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg"
                        >
                          <Eye size={16} className="mr-2" />
                          Ver Detalles
                        </Button>
                        {sale.status === "pending" && (
                          <Button
                            onClick={() => handleCompleteSale(sale.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No hay ventas"
                subtitle="No se encontraron ventas que coincidan con los filtros aplicados"
              />
            )}
          </div>
        )}

        {/* Contenido de la pestaña Historial */}
        {activeTab === "history" && (
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Historial Completo de Ventas</h3>
                <p className="text-gray-600">Todas las transacciones realizadas</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="border border-gray-300 rounded-lg">
                  <Download size={16} className="mr-2" />
                  Exportar
                </Button>
                <Button variant="ghost" className="border border-gray-300 rounded-lg">
                  <Filter size={16} className="mr-2" />
                  Filtros Avanzados
                </Button>
              </div>
            </div>

            {/* Tabla de historial */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Pago</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSales.map((sale, index) => (
                      <tr key={sale.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{sale.id}</div>
                          {sale.fromQuote && (
                            <div className="text-xs text-gray-500">Desde: {sale.fromQuote}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{sale.customerName || "Cliente General"}</div>
                          <div className="text-sm text-gray-500">{sale.items.length} productos</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-emerald-600">{formatMoney(sale.total)}</div>
                          {sale.discount > 0 && (
                            <div className="text-xs text-gray-500">Desc: {formatMoney(sale.discount)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color={getStatusColor(sale.status)} className="font-semibold">
                            {sale.status === "completed" && "Completada"}
                            {sale.status === "pending" && "Pendiente"}
                            {sale.status === "cancelled" && "Cancelada"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">
                            {getPaymentMethodIcon(sale.paymentMethod)} {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(sale.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleViewDetails(sale)}
                              className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                            >
                              <Download size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Detalles de Venta */}
      {showDetailsModal && selectedSale && (
        <Modal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`Detalles de Venta ${selectedSale.id}`}
        >
          <div className="p-6">
            <div className="space-y-6">
              {/* Información de la venta */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Cliente:</span>
                    <p className="font-semibold text-gray-800">{selectedSale.customerName || "Cliente General"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge color={getStatusColor(selectedSale.status)} className="mt-1">
                      {selectedSale.status === "completed" && "✅ Completada"}
                      {selectedSale.status === "pending" && "⏳ Pendiente"}
                      {selectedSale.status === "cancelled" && "❌ Cancelada"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Método de Pago:</span>
                    <p className="font-semibold text-gray-800">
                      {getPaymentMethodIcon(selectedSale.paymentMethod)} {selectedSale.paymentMethod}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Fecha:</span>
                    <p className="font-semibold text-gray-800">{formatDate(selectedSale.date)}</p>
                  </div>
                </div>
              </div>

              {/* Items de la venta */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Productos Vendidos</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedSale.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatMoney(item.price)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                            {formatMoney(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen de totales */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatMoney(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-red-600">-{formatMoney(selectedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA (12%):</span>
                    <span className="font-medium">{formatMoney(selectedSale.tax)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="font-bold text-lg text-emerald-600">{formatMoney(selectedSale.total)}</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                {selectedSale.status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        handleCompleteSale(selectedSale.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Completar Venta
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleCancelSale(selectedSale.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg"
                    >
                      <X size={16} className="mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  className="border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  <Download size={16} className="mr-2" />
                  Descargar Factura
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Selección de Método de Pago */}
      {showPaymentModal && saleToComplete && (
        <Modal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSaleToComplete(null);
            setSelectedPaymentMethod(null);
            setTransferenceImage(null);
            setTransferenceImagePreview("");
          }}
          title="💳 Seleccionar Método de Pago"
        >
          <div className="space-y-6">
            {/* Información de la venta */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Resumen de Venta</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Cliente:</span>
                  <p className="font-semibold text-blue-900">{saleToComplete.customerName}</p>
                </div>
                <div>
                  <span className="text-blue-700">Total:</span>
                  <p className="font-bold text-blue-900 text-lg">Q {saleToComplete.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Botones de métodos de pago */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Seleccione el método de pago:</h4>
              
              {/* Efectivo */}
              <Button
                onClick={() => completeSaleWithMethod("efectivo")}
                className="w-full p-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    💵
                  </div>
                  <div className="text-left">
                    <h5 className="font-bold text-lg">Efectivo</h5>
                    <p className="text-green-100 text-sm">Pago inmediato en efectivo</p>
                  </div>
                </div>
                <CheckCircle size={24} />
              </Button>

              {/* Transferencia */}
              <div className="space-y-3">
                <Button
                  onClick={() => setSelectedPaymentMethod("transferencia")}
                  className={`w-full p-6 ${
                    selectedPaymentMethod === "transferencia"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  } text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                      🏦
                    </div>
                    <div className="text-left">
                      <h5 className="font-bold text-lg">Transferencia Bancaria</h5>
                      <p className="text-blue-100 text-sm">Requiere comprobante de transferencia</p>
                    </div>
                  </div>
                  <CheckCircle size={24} />
                </Button>

                {/* Subida de imagen para transferencia */}
                {selectedPaymentMethod === "transferencia" && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-4">
                    <label className="block text-sm font-semibold text-blue-900">
                      📎 Subir Comprobante de Transferencia
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTransferenceImageChange}
                      className="block w-full text-sm text-blue-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {transferenceImagePreview && (
                      <div className="mt-4">
                        <img
                          src={transferenceImagePreview}
                          alt="Vista previa del comprobante"
                          className="max-w-full h-32 object-cover rounded-lg border border-blue-200"
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => completeSaleWithMethod("transferencia", transferenceImagePreview)}
                      disabled={!transferenceImage}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Completar con Transferencia
                    </Button>
                  </div>
                )}
              </div>

              {/* Tarjeta */}
              <Button
                onClick={() => completeSaleWithMethod("tarjeta")}
                className="w-full p-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    💳
                  </div>
                  <div className="text-left">
                    <h5 className="font-bold text-lg">Tarjeta de Crédito/Débito</h5>
                    <p className="text-purple-100 text-sm">Redirige al terminal de pagos</p>
                  </div>
                </div>
                <CheckCircle size={24} />
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SalesPage;