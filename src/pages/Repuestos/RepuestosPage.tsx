import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Package, TrendingUp, AlertTriangle, DollarSign, Activity, Eye, Edit, Trash2, Copy } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ImageModal from '../../components/ui/ImageModal';
import RepuestoCard from '../../components/repuestos/RepuestoCard';
import { useRepuestosStore } from '../../store/useRepuestosStore';
import { formatMoney } from '../../lib/format';
import type { Repuesto } from '../../types/repuesto';
import * as repuestoService from '../../services/repuestoService';
import { useToast } from '../../components/ui/Toast';

export function RepuestosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { repuestos, removeRepuesto, duplicateRepuesto, loadRepuestos, isLoading } = useRepuestosStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRepuesto, setSelectedRepuesto] = useState<Repuesto | null>(null);
  const [repuestoToDelete, setRepuestoToDelete] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cargar repuestos al montar el componente
  useEffect(() => {
    loadRepuestos();
  }, [loadRepuestos]);

  // Filtros
  const filteredRepuestos = repuestos.filter(repuesto => {
    const matchesSearch = repuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repuesto.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (repuesto.proveedor && repuesto.proveedor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && repuesto.activo) ||
                         (statusFilter === 'inactive' && !repuesto.activo);
    
    const matchesCategory = categoryFilter === 'all' || repuesto.tipo === categoryFilter;
    
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'low' && repuesto.stockMinimo && repuesto.stock <= repuesto.stockMinimo) ||
                        (stockFilter === 'available' && repuesto.stock > 0) ||
                        (stockFilter === 'out' && repuesto.stock === 0);
    
    return matchesSearch && matchesStatus && matchesCategory && matchesStock;
  });

  // Manejo de teclado para navegación de imágenes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showImageModal) {
        if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => Math.max(0, prev - 1));
        if (e.key === 'ArrowRight') setCurrentImageIndex(prev => Math.min(selectedImages.length - 1, prev + 1));
        if (e.key === 'Escape') setShowImageModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showImageModal, selectedImages.length]);

  const handleViewDetails = (repuesto: Repuesto) => {
    setSelectedRepuesto(repuesto);
    setShowDetailModal(true);
  };

  const handleEditRepuesto = (repuesto: Repuesto) => {
    navigate(`/repuestos/editar/${repuesto.id}`);
  };

  const handleDeleteRepuesto = (id: string) => {
    setRepuestoToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (repuestoToDelete) {
      removeRepuesto(repuestoToDelete);
      setRepuestoToDelete(null);
    }
    setShowDeleteDialog(false);
  };

  const handleDuplicateRepuesto = (repuesto: Repuesto) => {
    const duplicated = duplicateRepuesto(repuesto.id);
    if (duplicated) {
      navigate(`/repuestos/editar/${duplicated.id}`);
    }
  };

  const handleToggleActive = async (repuesto: Repuesto) => {
    try {
      const nuevoEstado = !repuesto.activo;
      await repuestoService.updateRepuesto(Number(repuesto.id), {
        activo: nuevoEstado
      });
      
      toast.add(
        `Repuesto ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
        'success'
      );
      
      // Recargar repuestos
      await loadRepuestos();
      
      // Buscar el repuesto actualizado en la lista recargada
      const repuestosActualizados = await repuestoService.getAllRepuestos({ limit: 500 });
      const repuestoActualizado = repuestosActualizados.find(r => r.id === Number(repuesto.id));
      
      if (repuestoActualizado) {
        // Mapear el repuesto actualizado al formato frontend
        setSelectedRepuesto({
          id: repuestoActualizado.id!.toString(),
          nombre: repuestoActualizado.nombre,
          tipo: repuestoActualizado.tipo,
          marca: repuestoActualizado.marca,
          linea: repuestoActualizado.linea || '',
          modelo: repuestoActualizado.modelo || '',
          compatibilidad: repuestoActualizado.compatibilidad || [],
          condicion: repuestoActualizado.condicion,
          color: repuestoActualizado.color || '',
          notas: repuestoActualizado.notas || '',
          precio: repuestoService.centavosAQuetzales(repuestoActualizado.precio_publico),
          precioCosto: repuestoService.centavosAQuetzales(repuestoActualizado.precio_costo),
          proveedor: repuestoActualizado.proveedor || '',
          stock: repuestoActualizado.stock,
          stockMinimo: repuestoActualizado.stock_minimo || 1,
          imagenes: repuestoActualizado.imagenes || [],
          tags: repuestoActualizado.tags || [],
          activo: repuestoActualizado.activo !== false,
          createdAt: repuestoActualizado.created_at || new Date().toISOString(),
          updatedAt: repuestoActualizado.updated_at || new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      toast.add(
        error.response?.data?.error || 'Error al cambiar estado del repuesto',
        'error'
      );
    }
  };

  // Estadísticas rápidas
  const totalRepuestos = filteredRepuestos.length;
  const repuestosActivos = filteredRepuestos.filter(r => r.activo).length;
  const repuestosStockBajo = filteredRepuestos.filter(r => r.stockMinimo && r.stock <= r.stockMinimo).length;
  const valorInventarioCosto = filteredRepuestos.reduce((sum, r) => sum + (r.precioCosto * r.stock), 0);
  const valorInventarioPublico = filteredRepuestos.reduce((sum, r) => sum + (r.precio * r.stock), 0);
  const margenTotal = valorInventarioPublico - valorInventarioCosto;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <PageHeader
              title="Repuestos"
              subtitle="Gestión de repuestos y compatibilidades"
            />
          </div>
          <Button onClick={() => navigate('/repuestos/nuevo')} className="shadow-lg">
            <Plus size={20} />
            Nuevo Repuesto
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <Package className="text-white" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-blue-600 font-medium mb-1">Total Repuestos</p>
                <p className="text-2xl font-bold text-blue-900">{totalRepuestos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                <Activity className="text-white" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-green-600 font-medium mb-1">Activos</p>
                <p className="text-2xl font-bold text-green-900">{repuestosActivos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                <AlertTriangle className="text-white" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-orange-600 font-medium mb-1">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-900">{repuestosStockBajo}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500 rounded-lg flex-shrink-0">
                <DollarSign className="text-white" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-red-600 font-medium mb-1 whitespace-nowrap">Valor Costo</p>
                <p className="text-lg font-bold text-red-900 truncate">{formatMoney(valorInventarioCosto)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-purple-600 font-medium mb-1 whitespace-nowrap">Valor Público</p>
                <p className="text-lg font-bold text-purple-900 truncate">{formatMoney(valorInventarioPublico)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar repuestos..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <option value="all">Todas las categorías</option>
              <option value="motor">Motor</option>
              <option value="frenos">Frenos</option>
              <option value="suspension">Suspensión</option>
              <option value="electrico">Eléctrico</option>
              <option value="transmision">Transmisión</option>
              <option value="carroceria">Carrocería</option>
              <option value="filtros">Filtros</option>
              <option value="aceites">Aceites</option>
              <option value="neumaticos">Neumáticos</option>
              <option value="accesorios">Accesorios</option>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <option value="all">Todo el stock</option>
              <option value="available">Disponible</option>
              <option value="low">Stock bajo</option>
              <option value="out">Sin stock</option>
            </Select>

            <Button variant="ghost" className="flex items-center gap-2">
              <Filter size={16} />
              Filtros avanzados
            </Button>
          </div>
        </Card>

        {/* Lista de repuestos */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="ml-4 text-gray-600">Cargando repuestos...</p>
          </div>
        ) : filteredRepuestos.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron repuestos</h3>
            <p className="text-gray-600 mb-6">No hay repuestos que coincidan con los filtros aplicados</p>
            <Button onClick={() => navigate('/repuestos/nuevo')}>
              <Plus size={20} />
              Crear primer repuesto
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRepuestos.map((repuesto) => (
              <RepuestoCard
                key={repuesto.id}
                repuesto={repuesto}
                onView={handleViewDetails}
                onEdit={handleEditRepuesto}
                onDuplicate={handleDuplicateRepuesto}
              />
            ))}
          </div>
        )}

        {filteredRepuestos.length === 0 && (
          <Card className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron repuestos</h3>
            <p className="text-gray-600 mb-6">No hay repuestos que coincidan con los filtros aplicados</p>
            <Button onClick={() => navigate('/repuestos/nuevo')}>
              <Plus size={20} />
              Crear primer repuesto
            </Button>
          </Card>
        )}

        {/* Modal de detalles */}
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Detalles del Repuesto"
        >
          {selectedRepuesto && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Nombre</label>
                  <p className="text-lg font-medium">{selectedRepuesto.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Estado</label>
                  <div className="flex items-center gap-3">
                    <Badge color={selectedRepuesto.activo ? 'green' : 'gray'}>
                      {selectedRepuesto.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(selectedRepuesto)}
                      className={selectedRepuesto.activo ? 'text-orange-600 border-orange-300' : 'text-green-600 border-green-300'}
                    >
                      {selectedRepuesto.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Tipo</label>
                  <p className="text-gray-700 capitalize">{selectedRepuesto.tipo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Stock</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">{selectedRepuesto.stock}</span>
                    {selectedRepuesto.stockMinimo && selectedRepuesto.stock <= selectedRepuesto.stockMinimo && (
                      <Badge>Stock Bajo</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Precio Costo</label>
                  <p className="text-lg font-bold text-red-600">{formatMoney(selectedRepuesto.precioCosto)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Precio Público</label>
                  <p className="text-lg font-bold text-green-600">{formatMoney(selectedRepuesto.precio)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Margen</label>
                  <p className="text-lg font-bold text-purple-600">
                    {formatMoney(selectedRepuesto.precio - selectedRepuesto.precioCosto)}
                    <span className="text-sm text-gray-500 ml-1">
                      ({((selectedRepuesto.precio - selectedRepuesto.precioCosto) / selectedRepuesto.precioCosto * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>

              {/* Proveedor */}
              {selectedRepuesto.proveedor && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Proveedor</label>
                  <p className="text-gray-700">{selectedRepuesto.proveedor}</p>
                </div>
              )}

              {/* Imágenes */}
              {selectedRepuesto.imagenes && selectedRepuesto.imagenes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Imágenes</label>
                  <div className="grid grid-cols-6 gap-2">
                    {selectedRepuesto.imagenes.map((imagen, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedImages(selectedRepuesto.imagenes!);
                          setCurrentImageIndex(index);
                          setShowImageModal(true);
                        }}
                        className="aspect-square rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 transition-colors group"
                      >
                        <img
                          src={imagen}
                          alt={`${selectedRepuesto.nombre} ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedRepuesto.notas && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Notas</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRepuesto.notas}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => handleEditRepuesto(selectedRepuesto)} className="flex-1">
                  Editar Repuesto
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleDuplicateRepuesto(selectedRepuesto)}
                  className="flex-1"
                >
                  Duplicar
                </Button>
                <Button 
                  variant={selectedRepuesto.activo ? "ghost" : "default"}
                  onClick={() => handleToggleActive(selectedRepuesto)}
                  className={selectedRepuesto.activo ? "text-orange-600 hover:text-orange-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {selectedRepuesto.activo ? 'Desactivar' : 'Activar'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowDetailModal(false);
                    handleDeleteRepuesto(selectedRepuesto.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de imágenes */}
        {showImageModal && (
          <ImageModal
            isOpen={showImageModal}
            images={selectedImages}
            initialIndex={currentImageIndex}
            onClose={() => setShowImageModal(false)}
          />
        )}

        {/* Diálogo de confirmación para eliminar */}
        <ConfirmDialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Eliminar Repuesto"
          message={`¿Estás seguro de que deseas eliminar este repuesto? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
        />
      </div>
    </div>
  );
}