import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Image, AlertTriangle, Check, User } from 'lucide-react';
import { RepairFormData, RepairStatus, RepairPriority, StickerLocation } from '../../types/repair';
import { Customer } from '../../types/customer';
import { useStickers } from '../../hooks/useStickers';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import CustomerPicker from '../../components/customers/CustomerPicker';
import { EquipmentReceptionCard } from '../../components/repairs/EquipmentReceptionCard';
import { StateFlowCard } from '../../components/repairs/StateFlowCard';
import { StickerAssignmentPanel } from '../../components/repairs/StickerAssignmentPanel';
import { RepairProgressStepper } from '../../components/repairs/RepairProgressStepper';

export default function RepairFormPageNew() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { verificarSticker } = useStickers();
  
  const isEditing = !!id;
  const fromQuote = searchParams.get('desde') === 'cotizacion';

  // Estados del formulario principal
  const [formData, setFormData] = useState<RepairFormData>({
    cliente: undefined, // Nuevo campo unificado
    clienteNombre: "",
    clienteTelefono: "",
    clienteEmail: "",
    clienteId: "",
    clienteFrecuente: false,
    
    recepcion: {
      tipoEquipo: "Telefono",
      marca: "",
      modelo: "",
      color: "",
      accesoriosRecibidos: {
        chip: false,
        estuche: false,
        memoriaSD: false,
        cargador: false,
        otros: ""
      },
      diagnosticoInicial: "",
      fotosRecepcion: [],
      fechaRecepcion: new Date().toISOString().split('T')[0],
      userRecepcion: "Usuario Actual",
      recepcionConfirmada: false
    },
    
    estado: "RECIBIDA",
    prioridad: "MEDIA",
    historialEstados: [],
    
    items: [],
    manoDeObra: 0,
    
    garantiaMeses: 3,
    fotosFinales: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);

  // Efectos para manejar el flujo automático
  useEffect(() => {
    // Auto-abrir panel de sticker cuando se marca como COMPLETADA
    if (formData.estado === 'COMPLETADA' && !formData.stickerNumero) {
      setShowStickerPanel(true);
    }
  }, [formData.estado, formData.stickerNumero]);

  // Calcular fondo dinámico basado en estado
  const getBackgroundByStatus = (status: RepairStatus) => {
    const backgrounds: { [key in RepairStatus]: string } = {
      RECIBIDA: 'bg-gradient-to-br from-blue-50 to-blue-100',
      EN_PROCESO: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      EN_DIAGNOSTICO: 'bg-gradient-to-br from-orange-50 to-orange-100',
      ESPERANDO_AUTORIZACION: 'bg-gradient-to-br from-purple-50 to-purple-100',
      AUTORIZADA: 'bg-gradient-to-br from-green-50 to-green-100',
      EN_REPARACION: 'bg-gradient-to-br from-blue-50 to-blue-100',
      ESPERANDO_PIEZA: 'bg-gradient-to-br from-orange-50 to-orange-100',
      STAND_BY: 'bg-gradient-to-br from-gray-50 to-gray-100',
      COMPLETADA: 'bg-gradient-to-br from-green-50 to-green-100',
      ENTREGADA: 'bg-gradient-to-br from-gray-50 to-gray-100',
      CANCELADA: 'bg-gradient-to-br from-red-50 to-red-100'
    };
    return backgrounds[status] || 'bg-gradient-to-br from-gray-50 to-white';
  };

  // Handlers principales
  const handleCustomerChange = (customer: Customer) => {
    const customerName = customer.nombre || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    const customerPhone = customer.telefono || customer.phone || '';
    const customerEmail = customer.correo || customer.email || '';
    const isFrequent = customer.frecuente || (customer.loyaltyPoints && customer.loyaltyPoints > 100);
    
    setFormData(prev => ({ 
      ...prev, 
      cliente: customer,
      // Mantener campos legacy por compatibilidad
      clienteId: customer.id,
      clienteNombre: customerName,
      clienteTelefono: customerPhone,
      clienteEmail: customerEmail,
      clienteFrecuente: isFrequent || false
    }));
  };

  const handleReceptionChange = (receptionData: any) => {
    setFormData(prev => ({
      ...prev,
      recepcion: { ...prev.recepcion, ...receptionData }
    }));
  };

  const handleStateChange = (newState: RepairStatus, nota?: string) => {
    // Validaciones específicas
    if (newState === 'ENTREGADA' && !formData.stickerNumero) {
      alert('Debe asignar un sticker antes de marcar como entregada');
      return;
    }

    if (newState === 'ENTREGADA' && formData.estado === 'COMPLETADA') {
      setShowDeliveryConfirm(true);
      return;
    }

    // Crear entrada en historial
    const historialEntry = {
      id: Date.now().toString(),
      estado: newState,
      nota: nota || '',
      fotos: [],
      timestamp: new Date().toISOString(),
      user: 'Usuario Actual'
    };

    setFormData(prev => ({
      ...prev,
      estado: newState,
      historialEstados: [...prev.historialEstados, historialEntry],
      ...(newState === 'ENTREGADA' && {
        fechaEntrega: new Date().toISOString(),
        garantiaHasta: new Date(Date.now() + (prev.garantiaMeses || 3) * 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }));
  };

  const handleStickerAssign = (numero: string, ubicacion: StickerLocation) => {
    setFormData(prev => ({
      ...prev,
      stickerNumero: numero,
      stickerUbicacion: ubicacion
    }));
    setShowStickerPanel(false);
  };

  const confirmDelivery = () => {
    handleStateChange('ENTREGADA', 'Equipo entregado al cliente');
    setShowDeliveryConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validaciones
      if (!formData.cliente && !formData.clienteNombre.trim()) {
        throw new Error('Debe seleccionar un cliente');
      }

      if (!formData.recepcion.recepcionConfirmada) {
        throw new Error('Debe confirmar la recepción del equipo');
      }

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Guardando reparación:', formData);
      
      // Redirigir al listado
      navigate('/reparaciones');
      
    } catch (error) {
      console.error('Error al guardar:', error);
      alert((error as Error).message || 'Error al guardar la reparación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${getBackgroundByStatus(formData.estado)}`}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
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
              subtitle={isEditing ? `Reparación #${id}` : 'Crear una nueva orden de reparación'}
            />
          </div>
        </div>

        {/* Stepper de progreso */}
        <RepairProgressStepper currentStatus={formData.estado} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Datos del Cliente */}
          <div className="space-y-4">
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Datos del Cliente</h4>
                <span className="text-sm text-gray-500">Selecciona el cliente para esta reparación</span>
              </div>
              
              <CustomerPicker
                value={formData.cliente}
                onChange={handleCustomerChange}
                allowCreate={true}
                placeholder="Buscar cliente por nombre, teléfono o email..."
              />
            </Card>
          </div>

          {/* 2. Recepción del Equipo */}
          <EquipmentReceptionCard
            reception={formData.recepcion}
            onReceptionChange={handleReceptionChange}
            isConfirmed={formData.recepcion.recepcionConfirmada}
          />

          {/* 3. Diagnóstico y Flujo de Estados */}
          <StateFlowCard
            currentState={formData.estado}
            historialEstados={formData.historialEstados}
            onStateChange={handleStateChange}
            canProgress={!formData.recepcion.recepcionConfirmada}
          />

          {/* 4. Resumen de la Reparación */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen de la Reparación</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Cliente</h5>
                <p className="text-gray-900">{formData.clienteNombre || 'No seleccionado'}</p>
                {formData.clienteFrecuente && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                    Cliente Frecuente
                  </span>
                )}
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Equipo</h5>
                <p className="text-gray-900">
                  {formData.recepcion.tipoEquipo} {formData.recepcion.marca} {formData.recepcion.modelo}
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Estado</h5>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  formData.estado === 'RECIBIDA' ? 'bg-blue-100 text-blue-800' :
                  formData.estado === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-800' :
                  formData.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                  formData.estado === 'ENTREGADA' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {formData.estado.replace('_', ' ')}
                </span>
              </div>
              
              {formData.stickerNumero && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Sticker</h5>
                  <span className="font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {formData.stickerNumero}
                  </span>
                </div>
              )}
            </div>
          </div>

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
              disabled={isLoading || (!formData.cliente && !formData.clienteNombre) || !formData.recepcion.recepcionConfirmada}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  {isEditing ? 'Actualizar' : 'Crear'} Reparación
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Panel de asignación de sticker */}
        <StickerAssignmentPanel
          isOpen={showStickerPanel}
          onClose={() => setShowStickerPanel(false)}
          onStickerAssigned={handleStickerAssign}
          repairId={id || 'nueva'}
          clienteNombre={formData.clienteNombre}
          equipoInfo={`${formData.recepcion.tipoEquipo} ${formData.recepcion.marca} ${formData.recepcion.modelo}`}
        />

        {/* Modal de confirmación de entrega */}
        <Modal
          open={showDeliveryConfirm}
          onClose={() => setShowDeliveryConfirm(false)}
          title="Confirmar Entrega"
        >
          <div className="space-y-4">
            <div className="text-center">
              <Check size={48} className="text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Confirmar entrega de este equipo?
              </h3>
              <p className="text-gray-600">
                Una vez marcado como entregado, se iniciará el período de garantía
                de {formData.garantiaMeses} meses.
              </p>
            </div>
            
            {formData.stickerNumero && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Sticker asignado:</div>
                <div className="font-mono font-bold text-purple-700">
                  {formData.stickerNumero}
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
      </div>
    </div>
  );
}