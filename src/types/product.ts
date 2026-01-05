export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  
  // Precios separados
  precioProducto: number;  // Precio de costo/compra (solo interno)
  precioPublico: number;   // Precio de venta al público
  
  // Compatibilidad con price anterior (usar precioPublico)
  price: number;
  
  stock: number;
  stockMin: number;
  active: boolean;
  image?: string;
  images?: string[];
  description?: string;
}

export interface KardexEntry {
  id: string;
  productId: string;
  type: "purchase" | "sale" | "adjustment" | "return";
  quantity: number;
  date: string;
  note?: string;
  userId?: string;
}
