import { useState, useEffect } from 'react';
import api from '../../services/api';
import './Admin.css';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
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

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      PENDING: { label: 'Pendente', class: 'pending' },
      PROCESSING: { label: 'Processando', class: 'processing' },
      SHIPPED: { label: 'Enviado', class: 'shipped' },
      DELIVERED: { label: 'Entregue', class: 'delivered' },
      CANCELLED: { label: 'Cancelado', class: 'cancelled' },
    };
    return statusMap[status] || { label: status, class: 'pending' };
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status do pedido');
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p>Gerencie os pedidos dos clientes</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🛍️</span>
          <h3>Nenhum pedido encontrado</h3>
          <p>Quando os clientes fizerem pedidos, eles aparecerão aqui</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className={`order-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="order-header" onClick={() => toggleExpand(order.id)}>
                  <div className="order-info">
                    <span className="order-id">#{order.id.slice(0, 8)}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-customer">
                    <strong>{order.user.name}</strong>
                    <span>{order.user.email}</span>
                  </div>
                  <div className="order-total">
                    {formatPrice(order.total)}
                  </div>
                  <span className={`status-badge ${statusInfo.class}`}>
                    {statusInfo.label}
                  </span>
                  <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div className="order-details">
                    <div className="order-items">
                      <h4>Itens do Pedido</h4>
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Produto</th>
                            <th>Qtd</th>
                            <th>Preço Unit.</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.product.name}</td>
                              <td>{item.quantity}</td>
                              <td>{formatPrice(item.price)}</td>
                              <td>{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3}><strong>Total</strong></td>
                            <td><strong>{formatPrice(order.total)}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="order-actions">
                      <label>Atualizar Status:</label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="PROCESSING">Processando</option>
                        <option value="SHIPPED">Enviado</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
