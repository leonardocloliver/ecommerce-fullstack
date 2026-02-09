import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Admin.css';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Carregar produtos
      const productsRes = await api.get('/api/products');
      const products = productsRes.data;
      
      // Carregar pedidos
      const ordersRes = await api.get('/api/orders');
      const orders = ordersRes.data;

      // Calcular estatísticas
      const totalRevenue = orders.reduce((sum: number, order: { total: number }) => sum + order.total, 0);
      const lowStockProducts = products.filter((p: { stock: number }) => p.stock < 5).length;

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        lowStockProducts,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Visão geral do seu e-commerce</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProducts}</span>
            <span className="stat-label">Produtos</span>
          </div>
          <Link to="/admin/products" className="stat-link">Ver todos →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">🛍️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalOrders}</span>
            <span className="stat-label">Pedidos</span>
          </div>
          <Link to="/admin/orders" className="stat-link">Ver todos →</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatPrice(stats.totalRevenue)}</span>
            <span className="stat-label">Receita Total</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon low-stock">⚠️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.lowStockProducts}</span>
            <span className="stat-label">Estoque Baixo</span>
          </div>
          <Link to="/admin/products" className="stat-link">Verificar →</Link>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <div className="actions-grid">
          <Link to="/admin/products" className="action-card">
            <span className="action-icon">➕</span>
            <span className="action-text">Novo Produto</span>
          </Link>
          <Link to="/admin/orders" className="action-card">
            <span className="action-icon">📋</span>
            <span className="action-text">Ver Pedidos</span>
          </Link>
          <Link to="/" className="action-card">
            <span className="action-icon">👁️</span>
            <span className="action-text">Ver Loja</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
