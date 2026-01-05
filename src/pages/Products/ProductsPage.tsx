import { Edit, Package, Plus, Search, ShoppingCart, Eye, AlertTriangle, Coins, Tag, Sparkles, ChevronDown, Trash2, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { formatMoney } from "../../lib/format";
import { useCatalog } from "../../store/useCatalog";
import { Product } from "../../types/product";
import * as categoryService from "../../services/categoryService";
import { StockAlertsWidget } from "../../components/common/StockAlertsWidget";

export default function ProductsPage() {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    adjustStock,
    getAllCategories,
    getSubcategories,
    addCustomCategory,
    addSubcategory,
    loadCategories,
    loadProducts,
    isLoadingCategories,
    isLoadingProducts,
    pagination
  } = useCatalog();
  const toast = useToast();

  // Estados - TODOS los useState deben estar declarados ANTES de cualquier useEffect
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({ productId: "", quantity: 0, note: "" });
  const [categoriesData, setCategoriesData] = useState<any>({ categories: [], subcategories: [] });

  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    subcategory: "",
    precioProducto: 0,
    precioPublico: 0,
    price: 0,
    stock: 0,
    stockMin: 0,
    active: true,
    image: "",
    description: "",
  });

  const [newCategoryForm, setNewCategoryForm] = useState({
    category: "",
    subcategory: "",
    isSubcategory: false,
    selectedParentCategory: "",
    editingCategoryId: null as number | null,
    editingSubcategoryId: null as number | null,
    isEditing: false
  });

  // Cargar categorías y productos al montar el componente
  useEffect(() => {
    loadCategories();
    loadProducts(1, 20);
  }, [loadCategories, loadProducts]);

  // Cargar datos completos de categorías cuando se abre el modal
  useEffect(() => {
    if (showAddCategoryModal) {
      const loadCategoriesData = async () => {
        try {
          const response = await categoryService.getAllCategories();
          if (response.success) {
            setCategoriesData(response.data);
          }
        } catch (error) {
          console.error('Error al cargar categorías:', error);
        }
      };
      loadCategoriesData();
    }
  }, [showAddCategoryModal]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesSubcategory = !subcategoryFilter || p.subcategory === subcategoryFilter;
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  function handleEditProduct(product: Product) {
    setEditingProduct(product);
    setProductForm({
      ...product,
      image: product.image || "",
      description: product.description || "",
      subcategory: product.subcategory || "",
      // Asegurar que los nuevos campos estén presentes
      precioProducto: product.precioProducto || 0,
      precioPublico: product.precioPublico || product.price || 0,
      price: product.precioPublico || product.price || 0, // Compatibilidad
    });
    setShowProductModal(true);
  }

  function handleViewProduct(product: Product) {
    setSelectedProduct(product);
    setShowDetailModal(true);
  }

  function handleStockAdjust(productId: string) {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setStockAdjustment({ productId, quantity: 0, note: "" });
      setShowStockModal(true);
    }
  }

  async function handleSaveProduct() {
    try {
      // Validaciones
      if (!productForm.sku || !productForm.name || !productForm.category) {
        toast.add("Por favor completa todos los campos requeridos (SKU, Nombre, Categoría)", "error");
        return;
      }

      console.log('📋 Guardando producto con:', {
        categoria: productForm.category,
        subcategoria: productForm.subcategory,
        nombre: productForm.name
      });

      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        toast.add("Producto actualizado exitosamente");
      } else {
        await addProduct(productForm);
        toast.add("Producto creado exitosamente");
      }
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
    } catch (error: any) {
      toast.add(error.message || "Error al guardar el producto", "error");
      console.error('Error:', error);
    }
  }

  function resetProductForm() {
    setProductForm({
      sku: "",
      name: "",
      category: "",
      subcategory: "",
      precioProducto: 0,
      precioPublico: 0,
      price: 0,
      stock: 0,
      stockMin: 0,
      active: true,
      image: "",
      description: "",
    });
  }

  async function handleStockAdjustment() {
    try {
      await adjustStock(stockAdjustment.productId, stockAdjustment.quantity, stockAdjustment.note);
      toast.add("Stock ajustado correctamente");
      setShowStockModal(false);
    } catch (error) {
      toast.add("Error al ajustar el stock", "error");
      console.error('Error:', error);
    }
  }

  async function handleToggleProductStatus() {
    try {
      const product = products.find(p => p.id === stockAdjustment.productId);
      if (!product) return;
      
      // Solo enviar el campo active
      await updateProduct(product.id, { active: !product.active });
      toast.add(product.active ? "Producto desactivado" : "Producto activado");
      setShowStockModal(false);
      setSelectedProduct({ ...product, active: !product.active });
    } catch (error) {
      toast.add("Error al cambiar estado del producto", "error");
      console.error('Error:', error);
    }
  }

  async function handleDeleteProduct() {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const { deleteProduct } = useCatalog.getState();
      await deleteProduct(stockAdjustment.productId);
      toast.add("Producto eliminado exitosamente");
      setShowStockModal(false);
    } catch (error) {
      toast.add("Error al eliminar el producto", "error");
      console.error('Error:', error);
    }
  }

  async function handleAddCategory() {
    try {
      if (newCategoryForm.isEditing) {
        // Modo edición
        if (newCategoryForm.isSubcategory && newCategoryForm.editingSubcategoryId) {
          await categoryService.updateSubcategory(newCategoryForm.editingSubcategoryId, { nombre: newCategoryForm.subcategory });
          toast.add("Subcategoría actualizada exitosamente");
        } else if (newCategoryForm.editingCategoryId) {
          await categoryService.updateCategory(newCategoryForm.editingCategoryId, { nombre: newCategoryForm.category });
          toast.add("Categoría actualizada exitosamente");
        }
      } else {
        // Modo crear
        if (newCategoryForm.isSubcategory && newCategoryForm.subcategory && newCategoryForm.selectedParentCategory) {
          await addSubcategory(newCategoryForm.selectedParentCategory, newCategoryForm.subcategory);
          toast.add("Subcategoría agregada exitosamente");
        } else if (!newCategoryForm.isSubcategory && newCategoryForm.category) {
          await addCustomCategory(newCategoryForm.category, []);
          toast.add("Categoría agregada exitosamente");
        }
      }
      
      await loadCategories();
    } catch (error: any) {
      toast.add(error.message || "Error al procesar categoría", "error");
      console.error('Error:', error);
      return;
    }
    
    setNewCategoryForm({
      category: "",
      subcategory: "",
      isSubcategory: false,
      selectedParentCategory: "",
      editingCategoryId: null,
      editingSubcategoryId: null,
      isEditing: false
    });
  }

  async function handleEditCategory(categoryName: string, categoryId: number) {
    setNewCategoryForm({
      category: categoryName,
      subcategory: "",
      isSubcategory: false,
      selectedParentCategory: "",
      editingCategoryId: categoryId,
      editingSubcategoryId: null,
      isEditing: true
    });
  }

  async function handleEditSubcategory(categoryName: string, subcategoryName: string, subcategoryId: number) {
    setNewCategoryForm({
      category: "",
      subcategory: subcategoryName,
      isSubcategory: true,
      selectedParentCategory: categoryName,
      editingCategoryId: null,
      editingSubcategoryId: subcategoryId,
      isEditing: true
    });
  }

  async function handleDeleteCategory(categoryId: number, categoryName: string) {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${categoryName}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      await categoryService.deleteCategory(categoryId);
      toast.add("Categoría eliminada exitosamente");
      await loadCategories();
    } catch (error: any) {
      toast.add(error.message || "Error al eliminar categoría", "error");
      console.error('Error:', error);
    }
  }

  async function handleDeleteSubcategory(subcategoryId: number, subcategoryName: string) {
    if (!window.confirm(`¿Estás seguro de eliminar la subcategoría "${subcategoryName}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      await categoryService.deleteSubcategory(subcategoryId);
      toast.add("Subcategoría eliminada exitosamente");
      await loadCategories();
    } catch (error: any) {
      toast.add(error.message || "Error al eliminar subcategoría", "error");
      console.error('Error:', error);
    }
  }

  function getProductImage(product: Product) {
    return product.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23e5e7eb' width='300' height='200'/%3E%3Ctext fill='%239ca3af' font-family='system-ui, sans-serif' font-size='18' font-weight='600' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESin Imagen%3C/text%3E%3C/svg%3E";
  }

  function capitalizeText(text: string): string {
    if (!text) return '';
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  function handlePageChange(newPage: number) {
    loadProducts(newPage, pagination.pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 space-y-6 sm:space-y-8">
      <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
        <PageHeader title="Productos" subtitle="Gestión del catálogo de productos" />
      </div>

      <Card className="mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Catálogo de Productos</h3>
                <p className="text-blue-100 mt-1">Gestión completa del inventario</p>
              </div>
              <Button
                onClick={() => setShowProductModal(true)}
                className="w-full lg:w-auto bg-gray-900 text-white hover:bg-black border-2 border-gray-700 hover:border-gray-600 shadow-xl hover:shadow-2xl font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <Plus size={18} className="mr-2" />
                ✨ Nuevo Producto
              </Button>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <div className="flex flex-col gap-4">
                {/* Widget de Alertas de Stock */}
                <StockAlertsWidget />
                
                {/* Barra de búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, SKU, categoría o subcategoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/90 border-0 shadow-lg rounded-xl text-slate-800"
                  />
                </div>
                
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setSubcategoryFilter(""); // Limpiar subcategoría al cambiar categoría
                    }}
                    className="w-full sm:flex-1 bg-white/90 border-0 shadow-lg rounded-xl text-slate-800"
                  >
                    <option value="">📁 Todas las categorías</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {capitalizeText(cat)}
                      </option>
                    ))}
                  </Select>
                  
                  {categoryFilter && (
                    <Select
                      value={subcategoryFilter}
                      onChange={(e) => setSubcategoryFilter(e.target.value)}
                      className="w-full sm:flex-1 bg-white/90 border-0 shadow-lg rounded-xl text-slate-800"
                    >
                      <option value="">📂 Todas las subcategorías</option>
                      {getSubcategories(categoryFilter).map((subcat) => (
                        <option key={subcat} value={subcat}>
                          {capitalizeText(subcat)}
                        </option>
                      ))}
                    </Select>
                  )}
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("");
                      setSubcategoryFilter("");
                    }}
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl font-semibold transition-all duration-200"
                  >
                    🔄 Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contador de resultados */}
      {(searchTerm || categoryFilter || subcategoryFilter) && (
        <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            <span className="text-gray-700 font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
            </span>
          </div>
          {searchTerm && (
            <Badge color="blue" className="flex items-center gap-1">
              <Search size={12} />
              Búsqueda: "{searchTerm}"
            </Badge>
          )}
        </div>
      )}

      {/* Grid de productos en tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
            {/* Imagen del producto */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23e5e7eb' width='300' height='200'/%3E%3Ctext fill='%239ca3af' font-family='system-ui, sans-serif' font-size='18' font-weight='600' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESin Imagen%3C/text%3E%3C/svg%3E";
                }}
              />
              {/* Badge de estado */}
              <div className="absolute top-3 left-3">
                <Badge color={product.active ? "green" : "red"} className="shadow-lg">
                  {product.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {/* Badge de stock bajo */}
              {product.stock <= product.stockMin && (
                <div className="absolute top-3 right-3">
                  <Badge color="red" className="shadow-lg flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Stock Bajo
                  </Badge>
                </div>
              )}
              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleViewProduct(product)}
                  className="bg-white/90 text-gray-800 hover:bg-white"
                >
                  <Eye size={16} />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Edit size={16} />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStockAdjust(product.id)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Package size={16} />
                </Button>
              </div>
            </div>

            {/* Información del producto */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                    SKU: {product.sku}
                  </span>
                  {product.category && (
                    <Badge color="blue" className="text-xs">
                      <Tag size={12} className="mr-1" />
                      {capitalizeText(product.category)}
                    </Badge>
                  )}
                  {product.subcategory && (
                    <Badge color="purple" className="text-xs">
                      <ChevronDown size={12} className="mr-1" />
                      {capitalizeText(product.subcategory)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatMoney(product.price)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Precio de venta
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${product.stock <= product.stockMin ? 'text-red-600' : 'text-gray-700'}`}>
                    {product.stock} unidades
                  </p>
                  <p className="text-xs text-gray-500">
                    Mín: {product.stockMin}
                  </p>
                </div>
              </div>

              {/* Barra de stock */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    product.stock <= product.stockMin ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min((product.stock / (product.stockMin * 3)) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mensaje cuando no hay productos */}
      {filteredProducts.length === 0 && (
        <Card className="text-center py-12 bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-500 mb-4">
            {categoryFilter ? 'No se encontraron productos en esta categoría' : 'Comienza agregando tu primer producto'}
          </p>
          <Button onClick={() => setShowProductModal(true)}>
            <Plus size={16} className="mr-2" />
            Agregar Producto
          </Button>
        </Card>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{products.length}</span> de{' '}
              <span className="font-semibold">{pagination.total}</span> productos
              <span className="text-gray-400 ml-2">
                (Página {pagination.currentPage} de {pagination.totalPages})
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </Button>
              
              {/* Números de página */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={pagination.currentPage === pageNum ? "bg-blue-600 text-white" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modal de producto moderno */}
      <Modal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
      >
        <div className="space-y-8">
          {/* Sección de imagen */}
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4 lg:w-1/3">
              <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-blue-200 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-inner">
                {productForm.image ? (
                  <img
                    src={productForm.image}
                    alt="Vista previa"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'%3E%3Crect fill='%23e5e7eb' width='192' height='192'/%3E%3Ctext fill='%239ca3af' font-family='system-ui, sans-serif' font-size='14' font-weight='600' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESin Imagen%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <Package size={48} className="mx-auto text-blue-400 mb-3" />
                    <p className="text-sm text-blue-600 font-medium">Sin imagen</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setProductForm({ ...productForm, image: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="imageUpload"
                />
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Sparkles size={16} />
                  Subir Imagen
                </label>
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  JPG, PNG o GIF<br/>
                  <span className="text-blue-600">Máximo 5MB</span>
                </p>
              </div>
            </div>

            {/* Formulario principal */}
            <div className="flex-1 space-y-6">
              {/* Información básica */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  Información Básica
                </h4>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        className="w-full border-slate-300 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-all duration-200"
                        placeholder="Código único del producto"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Stock Inicial <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        className="w-full border-slate-300 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-all duration-200"
                        placeholder="Cantidad inicial"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Nombre del Producto <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full border-slate-300 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-all duration-200"
                      placeholder="Nombre descriptivo del producto"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Descripción
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                      rows={3}
                      placeholder="Descripción detallada del producto..."
                    />
                  </div>
                </div>
              </div>

              {/* Categorización */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Tag size={20} className="text-indigo-600" />
                    </div>
                    Categorización
                  </h4>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm"
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Select
                        value={productForm.category}
                        onChange={(e) => {
                          setProductForm({ ...productForm, category: e.target.value, subcategory: "" });
                        }}
                        className="w-full border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl appearance-none transition-all duration-200"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400" size={20} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Subcategoría
                    </label>
                    <div className="relative">
                      <Select
                        value={productForm.subcategory}
                        onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                        className="w-full border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl appearance-none transition-all duration-200"
                        disabled={!productForm.category}
                      >
                        <option value="">Seleccionar subcategoría</option>
                        {productForm.category && getSubcategories(productForm.category).map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </Select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Precios y Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Precios */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
              <h4 className="font-bold text-slate-800 flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Coins size={20} className="text-green-600" />
                </div>
                Precios
              </h4>
              
              {/* Precio Producto (Costo) */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Precio Producto (Costo) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-md text-sm">
                    Q
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.precioProducto}
                    onChange={(e) => setProductForm({ 
                      ...productForm, 
                      precioProducto: Number(e.target.value) 
                    })}
                    className="pl-16 w-full border-blue-300 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-lg font-semibold transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-blue-600">Solo visible internamente</p>
              </div>

              {/* Precio Público (Venta) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Precio Público (Venta) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-100 text-green-700 font-bold px-2 py-1 rounded-md text-sm">
                    Q
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.precioPublico}
                    onChange={(e) => {
                      const precio = Number(e.target.value);
                      setProductForm({ 
                        ...productForm, 
                        precioPublico: precio,
                        price: precio  // Mantener compatibilidad
                      });
                    }}
                    className="pl-16 w-full border-green-300 focus:ring-green-500 focus:border-green-500 rounded-xl text-lg font-semibold transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-green-600">Visible en cotizaciones y ventas</p>
              </div>

              {/* Margen de ganancia */}
              {productForm.precioProducto > 0 && productForm.precioPublico > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-700">Margen de ganancia:</span>
                    <span className="font-bold text-purple-800">
                      Q{(productForm.precioPublico - productForm.precioProducto).toFixed(2)} 
                      ({((productForm.precioPublico - productForm.precioProducto) / productForm.precioProducto * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Stock Mínimo */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
              <h4 className="font-bold text-slate-800 flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                Control de Stock
              </h4>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Stock Mínimo <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.stockMin}
                  onChange={(e) => setProductForm({ ...productForm, stockMin: Number(e.target.value) })}
                  className="w-full border-orange-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl transition-all duration-200"
                  placeholder="Cantidad mínima de alerta"
                />
              </div>
              
              {productForm.stock > 0 && productForm.stockMin > 0 && (
                <div className="mt-4 bg-white rounded-xl p-4 border border-orange-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Estado del Stock:</span>
                    <Badge color={productForm.stock <= productForm.stockMin ? "red" : "green"}>
                      {productForm.stock <= productForm.stockMin ? "Stock Bajo" : "Stock Normal"}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        productForm.stock <= productForm.stockMin ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-green-400 to-green-500'
                      }`}
                      style={{
                        width: `${Math.min((productForm.stock / (productForm.stockMin * 3)) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setShowProductModal(false)}
              className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProduct} 
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              disabled={!productForm.name || !productForm.sku || !productForm.category}
            >
              <Sparkles size={16} className="mr-2" />
              {editingProduct ? "Actualizar Producto" : "Crear Producto"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para agregar categorías */}
      <Modal
        open={showAddCategoryModal}
        onClose={() => {
          setShowAddCategoryModal(false);
          setNewCategoryForm({
            category: "",
            subcategory: "",
            isSubcategory: false,
            selectedParentCategory: "",
            editingCategoryId: null,
            editingSubcategoryId: null,
            isEditing: false
          });
        }}
        title={newCategoryForm.isEditing ? "Editar Categoría" : "Gestionar Categorías"}
      >
        <div className="space-y-6">
          {/* Formulario de agregar/editar */}
          <div className="border-b pb-4">
            <h4 className="font-semibold text-gray-900 mb-4">
              {newCategoryForm.isEditing ? "Editar" : "Agregar Nueva"}
            </h4>
            
            {!newCategoryForm.isEditing && (
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!newCategoryForm.isSubcategory}
                    onChange={() => setNewCategoryForm({ ...newCategoryForm, isSubcategory: false })}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">Nueva Categoría</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={newCategoryForm.isSubcategory}
                    onChange={() => setNewCategoryForm({ ...newCategoryForm, isSubcategory: true })}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">Nueva Subcategoría</span>
                </label>
              </div>
            )}

            {newCategoryForm.isSubcategory || newCategoryForm.editingSubcategoryId ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Principal</label>
                  <Select
                    value={newCategoryForm.selectedParentCategory}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, selectedParentCategory: e.target.value })}
                    className="w-full"
                    disabled={newCategoryForm.isEditing}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Subcategoría</label>
                  <Input
                    value={newCategoryForm.subcategory}
                    onChange={(e) => setNewCategoryForm({ ...newCategoryForm, subcategory: e.target.value })}
                    placeholder="Nombre de la subcategoría"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría</label>
                <Input
                  value={newCategoryForm.category}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, category: e.target.value })}
                  placeholder="Nombre de la categoría"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              {newCategoryForm.isEditing && (
                <Button 
                  variant="ghost" 
                  onClick={() => setNewCategoryForm({
                    category: "",
                    subcategory: "",
                    isSubcategory: false,
                    selectedParentCategory: "",
                    editingCategoryId: null,
                    editingSubcategoryId: null,
                    isEditing: false
                  })}
                >
                  Cancelar Edición
                </Button>
              )}
              <Button onClick={handleAddCategory}>
                {newCategoryForm.isEditing ? "Actualizar" : "Agregar"}
              </Button>
            </div>
          </div>

          {/* Lista de categorías y subcategorías existentes */}
          <div className="max-h-96 overflow-y-auto">
            <h4 className="font-semibold text-gray-900 mb-3">Categorías Existentes</h4>
            <div className="space-y-3">
              {categoriesData.categories?.map((category: any) => (
                <div key={category.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-blue-600" />
                      <span className="font-medium text-gray-900">{category.nombre}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCategory(category.nombre, category.id)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id, category.nombre)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subcategorías */}
                  {categoriesData.subcategories
                    ?.filter((sub: any) => sub.categoria_id === category.id)
                    .map((subcategory: any) => (
                      <div key={subcategory.id} className="ml-6 mt-2 flex items-center justify-between bg-gray-50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{subcategory.nombre}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSubcategory(category.nombre, subcategory.nombre, subcategory.id)}
                            className="text-blue-600 hover:bg-blue-100 text-xs"
                          >
                            <Pencil size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSubcategory(subcategory.id, subcategory.nombre)}
                            className="text-red-600 hover:bg-red-100 text-xs"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowAddCategoryModal(false);
                setNewCategoryForm({
                  category: "",
                  subcategory: "",
                  isSubcategory: false,
                  selectedParentCategory: "",
                  editingCategoryId: null,
                  editingSubcategoryId: null,
                  isEditing: false
                });
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de detalle del producto */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalle del Producto"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={getProductImage(selectedProduct)}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='system-ui, sans-serif' font-size='20' font-weight='600' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3ESin Imagen%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre</label>
                <p className="font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <p className="font-semibold">{selectedProduct.sku}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Categoría</label>
                <p className="font-semibold">{selectedProduct.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Precio Público</label>
                <p className="font-semibold text-emerald-600">{formatMoney(selectedProduct.precioPublico || selectedProduct.price)}</p>
              </div>
              {selectedProduct.precioProducto && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Precio Producto</label>
                  <p className="font-semibold text-blue-600">{formatMoney(selectedProduct.precioProducto)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Stock</label>
                <p className={`font-semibold ${selectedProduct.stock <= selectedProduct.stockMin ? 'text-red-600' : 'text-gray-900'}`}>
                  {selectedProduct.stock} unidades
                </p>
              </div>
            </div>
            {selectedProduct.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="mt-1">{selectedProduct.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de ajuste de stock */}
      <Modal open={showStockModal} onClose={() => setShowStockModal(false)} title="Gestión de Producto">
        {selectedProduct && (
          <div className="space-y-6">
            {/* Información del producto */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedProduct.name}</h4>
              <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
              <p className="text-sm text-gray-600">Stock actual: {selectedProduct.stock} unidades</p>
              <div className="mt-2">
                <Badge color={selectedProduct.active ? "green" : "red"}>
                  {selectedProduct.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            {/* Ajuste de stock */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900">Ajustar Stock</h5>
              <Input
                type="number"
                placeholder="Cantidad (+/-)"
                value={stockAdjustment.quantity}
                onChange={(e) =>
                  setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })
                }
              />
              <Input
                placeholder="Motivo"
                value={stockAdjustment.note}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, note: e.target.value })}
              />
              <Button onClick={handleStockAdjustment} className="w-full">
                <Package size={16} className="mr-2" />
                Ajustar Stock
              </Button>
            </div>

            {/* Acciones del producto */}
            <div className="space-y-2 border-t pt-4">
              <h5 className="font-medium text-gray-900 mb-3">Acciones</h5>
              <Button
                onClick={handleToggleProductStatus}
                variant="ghost"
                className={`w-full ${
                  selectedProduct.active 
                    ? "text-orange-600 hover:bg-orange-50" 
                    : "text-green-600 hover:bg-green-50"
                }`}
              >
                {selectedProduct.active ? "🔴 Desactivar Producto" : "🟢 Activar Producto"}
              </Button>
              <Button
                onClick={handleDeleteProduct}
                variant="ghost"
                className="w-full text-red-600 hover:bg-red-50"
              >
                🗑️ Eliminar Producto
              </Button>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowStockModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
