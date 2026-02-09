import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública - Vitrine de produtos */}
          <Route path="/" element={<Home />} />
          
          {/* Rotas de autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas privadas (só acessíveis se logado) */}
          <Route element={<PrivateRoute />}>
            <Route path="/orders" element={<div>Meus Pedidos</div>} />
          </Route>

          {/* Rotas de Admin (só acessíveis se for ADMIN) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
