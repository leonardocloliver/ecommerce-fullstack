import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>🛒 Admin</h1>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📦</span>
            Produtos
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🛍️</span>
            Pedidos
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/" className="nav-item back-to-store">
            <span className="nav-icon">🏪</span>
            Voltar à Loja
          </NavLink>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-header">
          <div className="header-title">
            <h2>Painel Administrativo</h2>
          </div>
          <div className="header-user">
            <div className="user-avatar">{user?.name ? getInitials(user.name) : '?'}</div>
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">Sair</button>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
