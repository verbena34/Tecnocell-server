import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import Topbar from "./components/common/Topbar";
import { ToastProvider } from "./components/ui/Toast";
import LoginPage from "./pages/Login/LoginPage";
import routes from "./routes";
import { useAuth } from "./store/useAuth";

export default function App() {
  const role = useAuth((state) => state.role);
  const initAuth = useAuth((state) => state.initAuth);

  // Inicializar autenticación al cargar la app
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Si no hay usuario autenticado, mostrar solo la página de login
  if (!role) {
    return (
      <ToastProvider>
        <div className="min-h-screen">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </ToastProvider>
    );
  }

  // Si hay usuario autenticado, mostrar la aplicación completa
  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Sidebar />
        <div className="ml-64 flex flex-col">
          <Topbar />
          <main className="p-6">
            <Routes>
              {routes.filter(r => r.path !== "/login").map((r) => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
