import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Clock, AlertCircle, CheckCircle, Package, FileText, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRepairs } from '../../store/useRepairs';
import { RepairStatus, RepairPriority, StateChangeRequest, Repair } from '../../types/repair';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StateChangeModal } from '../../components/repairs/StateChangeModal';
import { StateHistory } from '../../components/repairs/StateHistory';
import { EditRepairModal } from '../../components/repairs/EditRepairModal';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'RECIBIDA', label: 'Recibida' },
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'ESPERANDO_PIEZA', label: 'Esperando Pieza' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'ENTREGADA', label: 'Entregada' },
  { value: 'CANCELADA', label: 'Cancelada' }
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' }
];

export default function RepairsPage() {
  const navigate = useNavigate();
  const { 
    repairs, 
    deleteRepair, 
    changeRepairState, 
    updateRepair,
    searchRepairs, 
    isLoading,
    validateStickerUniqueness
  } = useRepairs();

  // Estados del componente
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [showStateChangeModal, setShowStateChangeModal] = useState<string | null>(null);

  // Filtros aplicados
  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = searchQuery === '' || searchRepairs(searchQuery).some(r => r.id === repair.id);
    const matchesStatus = statusFilter === '' || repair.estado === statusFilter;
    const matchesPriority = priorityFilter === '' || repair.prioridad === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleDeleteRepair = async (id: string) => {
    try {
      await deleteRepair(id);
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('Error al eliminar reparación:', error);
    }
  };

  const handleStateChange = async (stateChange: StateChangeRequest) => {
    if (!showStateChangeModal) return;
    
    try {
      await changeRepairState(showStateChangeModal, stateChange);
      setShowStateChangeModal(null);
    } catch (error) {
      console.error('Error changing state:', error);
    }
  };

  const handleEditRepair = async (repairId: string, updates: Partial<Repair>) => {
    try {
      await updateRepair(repairId, updates);
      setShowEditModal(null);
    } catch (error) {
      console.error('Error updating repair:', error);
    }
  };

  const getStatusIcon = (status: RepairStatus) => {
    switch (status) {
      case 'RECIBIDA':
        return <Clock size={16} />;
      case 'EN_PROCESO':
        return <AlertCircle size={16} />;
      case 'ESPERANDO_PIEZA':
        return <Package size={16} />;
      case 'COMPLETADA':
        return <CheckCircle size={16} />;
      case 'ENTREGADA':
        return <CheckCircle size={16} />;
      case 'CANCELADA':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: RepairStatus): 'blue' | 'yellow' | 'orange' | 'green' | 'gray' | 'red' => {
    switch (status) {
      case 'RECIBIDA':
        return 'blue';
      case 'EN_PROCESO':
        return 'yellow';
      case 'ESPERANDO_PIEZA':
        return 'orange';
      case 'COMPLETADA':
        return 'green';
      case 'ENTREGADA':
        return 'gray';
      case 'CANCELADA':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: RepairPriority): 'green' | 'yellow' | 'red' => {
    switch (priority) {
      case 'BAJA':
        return 'green';
      case 'MEDIA':
        return 'yellow';
      case 'ALTA':
        return 'red';
      default:
        return 'yellow';
    }
  };

  const formatCurrency = (amount: number) => {
    return `Q${amount.toFixed(2)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Reparaciones" 
        subtitle="Gestión de reparaciones de equipos"
      />

      {/* Barra de acciones */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por cliente, equipo, IMEI..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <Select
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todos los estados</option>
            <option value="RECIBIDA">Recibida</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="ESPERANDO_PIEZA">Esperando Pieza</option>
            <option value="COMPLETADA">Completada</option>
            <option value="ENTREGADA">Entregada</option>
            <option value="CANCELADA">Cancelada</option>
          </Select>

          <Select
            value={priorityFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todas las prioridades</option>
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
          </Select>
        </div>

        <Button
          onClick={() => navigate('/reparaciones/nueva')}
          className="whitespace-nowrap"
        >
          <Plus size={20} className="mr-2" />
          Nueva Reparación
        </Button>
      </div>

      {/* Lista de reparaciones */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando reparaciones...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron reparaciones
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter || priorityFilter
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera reparación'
              }
            </p>
            {!searchQuery && !statusFilter && !priorityFilter && (
              <Button onClick={() => navigate('/reparaciones/nueva')}>
                <Plus size={20} className="mr-2" />
                Nueva Reparación
              </Button>
            )}
          </Card>
        ) : (
          filteredRepairs.map((repair) => (
            <Card key={repair.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Información principal */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {repair.id}
                    </h3>
                    <Badge color={getStatusColor(repair.estado)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(repair.estado)}
                        {STATUS_OPTIONS.find(opt => opt.value === repair.estado)?.label}
                      </div>
                    </Badge>
                    {repair.subEtapa && (
                      <Badge color="gray" className="text-xs">
                        {repair.subEtapa}
                      </Badge>
                    )}
                    <Badge color={getPriorityColor(repair.prioridad)}>
                      {repair.prioridad}
                    </Badge>
                    {repair.stickerSerieInterna && (
                      <Badge color="purple">
                        {repair.stickerSerieInterna}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cliente:</span>
                      <p className="font-medium">{repair.clienteNombre}</p>
                      <p className="text-gray-600">{repair.clienteTelefono}</p>
                    </div>

                    <div>
                      <span className="text-gray-500">Equipo:</span>
                      <p className="font-medium">
                        {repair.recepcion.marca} {repair.recepcion.modelo}
                      </p>
                      <p className="text-gray-600">{repair.recepcion.color}</p>
                    </div>

                    <div>
                      <span className="text-gray-500">Total:</span>
                      <p className="font-medium text-green-600 text-lg">
                        {formatCurrency(repair.total)}
                      </p>
                      
                      {/* Anticipo recibido */}
                      {repair.recepcion.montoAnticipo && repair.recepcion.montoAnticipo > 0 && (
                        <div className="mt-1">
                          <span className="text-gray-500 text-xs">Anticipo recibido:</span>
                          <p className="font-medium text-sm text-blue-600">
                            Q{repair.recepcion.montoAnticipo.toFixed(2)} ({repair.recepcion.metodoAnticipo})
                          </p>
                        </div>
                      )}
                      
                      {/* Total Ganancia */}
                      {repair.totalGanancia !== undefined && (
                        <div className="mt-1">
                          <span className="text-gray-500 text-xs">Total ganancia:</span>
                          <p className={`font-medium text-sm ${repair.totalGanancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Q{repair.totalGanancia.toFixed(2)}
                          </p>
                        </div>
                      )}
                      
                      {/* Total Invertido */}
                      {repair.totalInvertido !== undefined && repair.totalInvertido > 0 && (
                        <div className="mt-1">
                          <span className="text-gray-500 text-xs">Total invertido:</span>
                          <p className="font-medium text-red-600 text-sm">
                            -Q{repair.totalInvertido.toFixed(2)}
                          </p>
                        </div>
                      )}
                      
                      {repair.tecnicoAsignado && (
                        <p className="text-gray-600 text-xs mt-1">
                          Técnico: {repair.tecnicoAsignado}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <p className="line-clamp-2">{repair.recepcion.diagnosticoInicial}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistoryModal(repair.id)}
                    className="justify-center"
                  >
                    <History size={16} className="mr-1" />
                    Ver Historial
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStateChangeModal(repair.id)}
                    className="justify-center"
                    disabled={repair.estado === 'ENTREGADA'}
                  >
                    <Clock size={16} className="mr-1" />
                    Cambiar Estado
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditModal(repair.id)}
                    className="justify-center"
                  >
                    <Edit size={16} className="mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteDialog(repair.id)}
                    className="justify-center text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de historial */}
      {showHistoryModal && (
        <Modal
          open={!!showHistoryModal}
          onClose={() => setShowHistoryModal(null)}
          title="Historial de Estados"
        >
          <StateHistory 
            history={repairs.find(r => r.id === showHistoryModal)?.historialEstados || []}
          />
        </Modal>
      )}

      {/* Modal de cambio de estado */}
      {showStateChangeModal && (
        <StateChangeModal
          isOpen={!!showStateChangeModal}
          onClose={() => setShowStateChangeModal(null)}
          onConfirm={handleStateChange}
          currentState={repairs.find(r => r.id === showStateChangeModal)?.estado || 'RECIBIDA'}
          currentSubStage={repairs.find(r => r.id === showStateChangeModal)?.subEtapa}
          isLoading={isLoading}
          anticipoOriginal={repairs.find(r => r.id === showStateChangeModal)?.recepcion.montoAnticipo || 0}
          saldoAnticipo={repairs.find(r => r.id === showStateChangeModal)?.saldoAnticipo || repairs.find(r => r.id === showStateChangeModal)?.recepcion.montoAnticipo || 0}
          validateStickerUniqueness={(sticker) => validateStickerUniqueness(sticker, showStateChangeModal || undefined)}
        />
      )}

      {/* Modal de edición */}
      {showEditModal && (
        <EditRepairModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          onSave={(updates) => handleEditRepair(showEditModal, updates)}
          repair={repairs.find(r => r.id === showEditModal)!}
          isLoading={isLoading}
        />
      )}

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!showDeleteDialog}
        onClose={() => setShowDeleteDialog(null)}
        onConfirm={() => showDeleteDialog && handleDeleteRepair(showDeleteDialog)}
        title="Eliminar Reparación"
        message="¿Estás seguro de que deseas eliminar esta reparación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}