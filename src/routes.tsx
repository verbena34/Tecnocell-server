import DashboardPage from "./pages/Dashboard/DashboardPage";
import FelPage from "./pages/InvoicesFel/FelPage";
import LoginPage from "./pages/Login/LoginPage";
import CustomersPage from "./pages/Customers/CustomersPage";
import ProductsPage from "./pages/Products/ProductsPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import PurchasesPage from "./pages/Purchases/PurchasesPage";
import QuotesPage from "./pages/Quotes/QuotesPage";
import QuoteDetailPage from "./pages/Quotes/QuoteDetailPage";
import QuoteFormPage from "./pages/Quotes/QuoteFormPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import SalesPageNew from "./pages/Sales/SalesPageNew";
import SaleNewPage from "./pages/Sales/SaleNewPage";
import SaleDetailPage from "./pages/Sales/SaleDetailPage";
import UsersPage from "./pages/Users/UsersPage";
import CardPaymentPage from "./pages/CardPayment/CardPaymentPage";
import RepairsPage from "./pages/Repairs/RepairsPage";
import RepairFormPage from "./pages/Repairs/RepairFormPage";
import RepairFormSimple from "./pages/Repairs/RepairFormSimple";
import { RepuestosPage } from "./pages/Repuestos/RepuestosPage";
import RepuestoForm from "./pages/Repuestos/RepuestoForm";

const routes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/productos", element: <ProductsPage /> },
  { path: "/repuestos", element: <RepuestosPage /> },
  { path: "/repuestos/nuevo", element: <RepuestoForm /> },
  { path: "/repuestos/editar/:id", element: <RepuestoForm /> },
  { path: "/compras", element: <PurchasesPage /> },
  { path: "/cotizaciones", element: <QuotesPage /> },
  { path: "/cotizaciones/nueva", element: <QuoteFormPage /> },
  { path: "/cotizaciones/:id/editar", element: <QuoteFormPage /> },
  { path: "/cotizaciones/:id", element: <QuoteDetailPage /> },
  { path: "/ventas", element: <SalesPageNew /> },
  { path: "/ventas/nueva", element: <SaleNewPage /> },
  { path: "/ventas/:id", element: <SaleDetailPage /> },
  { path: "/reparaciones", element: <RepairsPage /> },
  { path: "/reparaciones/nueva", element: <RepairFormSimple /> },
  { path: "/reparaciones/:id/editar", element: <RepairFormSimple /> },
  { path: "/pago-tarjeta", element: <CardPaymentPage /> },
  { path: "/clientes", element: <CustomersPage /> },
  { path: "/fel", element: <FelPage /> },
  { path: "/reportes", element: <ReportsPage /> },
  { path: "/usuarios", element: <UsersPage /> },
  { path: "/perfil", element: <ProfilePage /> },
];

export default routes;
