import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft, Package, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRepairs } from '../../store/useRepairs';
import { useCatalog } from '../../store/useCatalog';
import { RepairFormData, RepairStatus, RepairPriority } from '../../types/repair';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { RepairProgressStepper } from '../../components/repairs/RepairProgressStepper';
import { CustomerSelector } from '../../components/repairs/CustomerSelector';
import { EquipmentSelector } from '../../components/repairs/EquipmentSelector';
import { StickerAssignmentModal } from '../../components/repairs/StickerAssignmentModal';

export default function RepairFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { repairs, addRepair, updateRepair } = useRepairs();
  const { products } = useCatalog();

  const isEditing = !!id;
  const fromQuote = searchParams.get('desde') === 'cotizacion';

  // Estados del formulario
  const [formData, setFormData] = useState<RepairFormData>({
    clienteNombre: "",
    clienteTelefono: "",
    clienteEmail: "",
    recepcion: {
      tipoEquipo: "Telefono",
      marca: "",
      modelo: "",
      color: "",
      accesoriosRecibidos: {
        chip: false,
        estuche: false,
        memoriaSD: false,
        cargador: false
      },
      estadoFisico: "",
      diagnosticoInicial: "",
      fotosRecepcion: [],
      fechaRecepcion: new Date().toISOString().split('T')[0],
      userRecepcion: "Usuario Actual"
    },
    estado: "RECIBIDA",
    prioridad: "MEDIA",
    garantiaMeses: 3, // Cambiar de días a meses
    historialEstados: [],
    items: [],
    manoDeObra: 0,
    fotosFinales: []
  });

  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados adicionales para el flujo
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [backgroundColorByStatus, setBackgroundColorByStatus] = useState('');

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing && id) {
      const repair = repairs.find(r => r.id === id);
      if (repair) {
        setFormData({
          clienteNombre: repair.clienteNombre,
          clienteTelefono: repair.clienteTelefono,
          clienteEmail: repair.clienteEmail || "",
          recepcion: repair.recepcion || {
            tipoEquipo: "Telefono",
            marca: repair.marca || "",
            modelo: repair.modelo || "",
            color: repair.color || "",
            accesoriosRecibidos: {
              chip: false,
              estuche: false,
              memoriaSD: false,
              cargador: false
            },
            estadoFisico: "",
            diagnosticoInicial: repair.diagnosticoInicial || "",
            fotosRecepcion: [],
            fechaRecepcion: new Date().toISOString().split('T')[0],
            userRecepcion: "Usuario Actual"
          },
          estado: repair.estado,
          subEtapa: repair.subEtapa,
          prioridad: repair.prioridad,
          garantiaMeses: Math.ceil((repair.garantiaDias || 90) / 30), // Convertir días a meses
          historialEstados: repair.historialEstados || [],
          items: repair.items,
          manoDeObra: repair.manoDeObra,
          stickerSerieInterna: repair.stickerSerieInterna,
          stickerUbicacion: repair.stickerUbicacion,
          fotosFinales: repair.fotosFinales || []
        });
      }
    }
  }, [isEditing, id, repairs]);

  // Efecto para cambiar color de fondo según estado
  useEffect(() => {
    switch (formData.estado) {
      case 'RECIBIDA':
        setBackgroundColorByStatus('bg-gradient-to-br from-blue-50 to-blue-100');
        break;
      case 'EN_PROCESO':
        setBackgroundColorByStatus('bg-gradient-to-br from-yellow-50 to-yellow-100');
        break;
      case 'ESPERANDO_PIEZA':
        setBackgroundColorByStatus('bg-gradient-to-br from-orange-50 to-orange-100');
        break;
      case 'COMPLETADA':
        setBackgroundColorByStatus('bg-gradient-to-br from-green-50 to-green-100');
        break;
      case 'ENTREGADA':
        setBackgroundColorByStatus('bg-gradient-to-br from-gray-50 to-gray-100');
        break;
      default:
        setBackgroundColorByStatus('bg-gradient-to-br from-gray-50 to-white');
    }
  }, [formData.estado]);

  // Efecto para mostrar modal de sticker cuando se completa
  useEffect(() => {
    if (formData.estado === 'COMPLETADA' && !formData.stickerSerieInterna && !showStickerModal) {
      setShowStickerModal(true);
    }
  }, [formData.estado, formData.stickerSerieInterna, showStickerModal]);

  const handleInputChange = (field: keyof RepairFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (customerData: any) => {
    setFormData(prev => ({
      ...prev,
      ...customerData
    }));
  };

  const handleEquipmentChange = (equipmentData: any) => {
    setFormData(prev => ({
      ...prev,
      recepcion: {
        ...prev.recepcion,
        ...equipmentData
      }
    }));
  };

  const handleStickerAssign = (sticker: string, location: any) => {
    setFormData(prev => ({
      ...prev,
      stickerSerieInterna: sticker,
      stickerUbicacion: location
    }));
    setShowStickerModal(false);
  };

  const handleStatusChange = (newStatus: RepairStatus) => {
    if (newStatus === 'ENTREGADA' && formData.estado === 'COMPLETADA') {
      if (!formData.stickerSerieInterna) {
        alert('Debe asignar un sticker antes de marcar como entregada');
        return;
      }
      setShowDeliveryConfirm(true);
      return;
    }
    
    handleInputChange('estado', newStatus);
  };

  const confirmDelivery = () => {
    handleInputChange('estado', 'ENTREGADA');
    setShowDeliveryConfirm(false);
  };

  const handleAddItem = (product: any) => {
    const newItem = {
      id: Date.now().toString(),
      productId: product.id,
      nombre: product.name,
      cantidad: 1,
      precioUnit: product.price, // Sin IVA automático
      subtotal: product.price
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductSelector(false);
  };

  const handleUpdateItem = (itemId: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          updatedItem.subtotal = updatedItem.cantidad * updatedItem.precioUnit;
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    return itemsTotal + formData.manoDeObra; // Sin IVA automático
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && id) {
        await updateRepair(id, formData);
      } else {
        await addRepair(formData);
      }
      navigate('/reparaciones');
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${backgroundColorByStatus}`}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/reparaciones')}
              className="text-gray-600"
            >
              <ArrowLeft size={20} className="mr-2" />
              Volver
            </Button>
            <PageHeader
              title={isEditing ? 'Editar Reparación' : 'Nueva Reparación'}
              subtitle={isEditing ? `ID: ${id}` : 'Crear una nueva orden de reparación'}
            />
          </div>
        </div>

        {/* Stepper de progreso */}
        <RepairProgressStepper currentStatus={formData.estado} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Cliente */}
          <CustomerSelector
            selectedCustomer={{
              clienteId: formData.clienteId,
              clienteNombre: formData.clienteNombre,
              clienteTelefono: formData.clienteTelefono,
              clienteEmail: formData.clienteEmail
            }}
            onCustomerChange={handleCustomerChange}
          />

          {/* Datos del Equipo */}
          <EquipmentSelector
            equipment={{
              tipoEquipo: formData.recepcion.tipoEquipo,
              marca: formData.recepcion.marca,
              modelo: formData.recepcion.modelo,
              color: formData.recepcion.color,
              patronContraseña: formData.recepcion.patronContraseña,
              estadoFisico: formData.recepcion.estadoFisico,
              diagnosticoInicial: formData.recepcion.diagnosticoInicial
            }}
            onEquipmentChange={handleEquipmentChange}
          />

          {/* Diagnóstico y Estado */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Diagnóstico y Estado</h3>
                <p className="text-sm text-gray-500">Configuración de prioridad y garantía</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                {formData.estado === 'COMPLETADA' ? (
                  <div className="space-y-3">
                    <div className="h-12 px-4 rounded-xl border-2 border-green-500 bg-green-50 flex items-center">
                      <CheckCircle2 size={20} className="text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Completada</span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleStatusChange('ENTREGADA')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12"
                      disabled={!formData.stickerSerieInterna}
                    >
                      <Package size={20} className="mr-2" />
                      Marcar como Entregada
                    </Button>
                    {!formData.stickerSerieInterna && (
                      <p className="text-xs text-amber-600 text-center">
                        ⚠️ Asigna un sticker antes de entregar
                      </p>
                    )}
                  </div>
                ) : (
                  <Select
                    value={formData.estado}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      handleStatusChange(e.target.value as RepairStatus)
                    }
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500"
                  >
                    <option value="RECIBIDA">Recibida</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="ESPERANDO_PIEZA">Esperando Piezas</option>
                    <option value="COMPLETADA">Completada</option>
                  </Select>
                )}
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad *
                </label>
                <Select
                  value={formData.prioridad}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    handleInputChange('prioridad', e.target.value as RepairPriority)
                  }
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500"
                >
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </Select>
              </div>

              {/* Garantía */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garantía (meses) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.garantiaMeses}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleInputChange('garantiaMeses', Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))
                  }
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 5 meses. La garantía inicia al marcar como entregada.
                </p>
              </div>
            </div>

            {/* Sticker asignado */}
            {formData.stickerSerieInterna && (
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-purple-900">Sticker Asignado</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-white border-2 border-purple-500 rounded-lg px-3 py-1 font-mono text-sm font-bold text-purple-700">
                        {formData.stickerSerieInterna}
                      </span>
                      <span className="text-sm text-purple-600">
                        ({formData.stickerUbicacion})
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStickerModal(true)}
                    className="text-purple-600"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Partes y Servicios */}
          <Card className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Partes y Servicios</h3>
                  <p className="text-sm text-gray-500">Precios netos sin IVA automático</p>
                </div>
              </div>
              
              <Button
                type="button"
                onClick={() => setShowProductSelector(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                <Plus size={20} className="mr-2" />
                Agregar Parte
              </Button>
            </div>

            {/* Lista de items */}
            <div className="space-y-3 mb-6">
              {formData.items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                      <Input
                        value={item.nombre}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleUpdateItem(item.id, { nombre: e.target.value })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleUpdateItem(item.id, { cantidad: parseInt(e.target.value) || 1 })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Precio Unit.</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.precioUnit}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          handleUpdateItem(item.id, { precioUnit: parseFloat(e.target.value) || 0 })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                      <div className="h-10 px-3 bg-gray-100 rounded-lg flex items-center text-sm font-medium">
                        Q{item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Mano de obra */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mano de Obra
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.manoDeObra}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleInputChange('manoDeObra', parseFloat(e.target.value) || 0)
                    }
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500"
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total General</div>
                  <div className="text-3xl font-bold text-blue-600">
                    Q{calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/reparaciones')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.clienteNombre || !formData.recepcion.tipoEquipo}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
            >
              {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Reparación')}
            </Button>
          </div>
        </form>

        {/* Modal de selección de productos */}
        <Modal
          open={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          title="Seleccionar Producto"
        >
          <div className="space-y-4">
            <Input
              placeholder="Buscar productos..."
              value={productSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setProductSearch(e.target.value)
              }
              className="w-full"
            />
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddItem(product)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300"
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    SKU: {product.sku} | Precio: Q{product.price.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>

        {/* Modal de asignación de sticker */}
        <StickerAssignmentModal
          isOpen={showStickerModal}
          onClose={() => setShowStickerModal(false)}
          onStickerAssign={handleStickerAssign}
          currentSticker={formData.stickerSerieInterna}
          currentLocation={formData.stickerUbicacion}
          isLoading={isLoading}
        />

        {/* Modal de confirmación de entrega */}
        <Modal
          open={showDeliveryConfirm}
          onClose={() => setShowDeliveryConfirm(false)}
          title="Confirmar Entrega"
        >
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Confirmar entrega de este equipo?
              </h3>
              <p className="text-gray-600">
                Una vez marcado como entregado, se iniciará el período de garantía.
              </p>
            </div>
            
            {formData.stickerSerieInterna && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Sticker asignado:</div>
                <div className="font-mono font-bold text-purple-700">
                  {formData.stickerSerieInterna}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeliveryConfirm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDelivery}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Confirmar Entrega
              </Button>
            </div>
          </div>
        </Modal>

        {/* Botón flotante para agregar partes (móvil) */}
        <div className="md:hidden fixed bottom-6 right-6">
          <Button
            type="button"
            onClick={() => setShowProductSelector(true)}
            className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          >
            <Plus size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}