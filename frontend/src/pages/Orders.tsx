import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Orders.css';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    description: string;
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  address: string;
  items: OrderItem[];
}

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'pending' },
  CONFIRMED: { label: 'Confirmado', className: 'confirmed' },
  SHIPPED: { label: 'Enviado', className: 'shipped' },
  DELIVERED: { label: 'Entregue', className: 'delivered' },
  CANCELLED: { label: 'Cancelado', className: 'cancelled' },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (err) {
      setError('Erro ao carregar pedidos');
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

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <div className="orders-spinner"></div>
          <p>Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-error">
          <p>{error}</p>
          <button onClick={loadOrders} className="orders-retry">Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-empty">
          <span className="orders-empty-icon">📦</span>
          <h2>Nenhum pedido encontrado</h2>
          <p>Quando voce fizer um pedido, ele aparecera aqui.</p>
          <Link to="/" className="orders-back">Voltar para a loja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div>
          <h1>Meus pedidos</h1>
          <p>{orders.length} pedido(s)</p>
        </div>
        <Link to="/" className="orders-back">Continuar comprando</Link>
      </header>

      <div className="orders-list">
        {orders.map((order) => {
          const statusInfo = statusMap[order.status] || { label: order.status, className: 'pending' };
          const isExpanded = expandedOrder === order.id;

          return (
            <div key={order.id} className={`orders-card ${isExpanded ? 'expanded' : ''}`}>
              <button className="orders-card-header" onClick={() => toggleExpand(order.id)}>
                <div>
                  <span className="orders-id">Pedido #{order.id.slice(0, 8)}</span>
                  <span className="orders-date">{formatDate(order.createdAt)}</span>
                </div>
                <div className="orders-total">{formatPrice(Number(order.total))}</div>
                <span className={`orders-status ${statusInfo.className}`}>{statusInfo.label}</span>
                <span className="orders-expand">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="orders-details">
                  <div className="orders-address">
                    <span>Endereco de entrega</span>
                    <strong>{order.address}</strong>
                  </div>
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Qtd</th>
                        <th>Preco</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.product.name}</strong>
                            <span>{item.product.description}</span>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(Number(item.price))}</td>
                          <td>{formatPrice(Number(item.price) * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3}>Total</td>
                        <td>{formatPrice(Number(order.total))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
