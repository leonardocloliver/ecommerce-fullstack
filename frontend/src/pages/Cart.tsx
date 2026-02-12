import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import './Cart.css';

export default function Cart() {
  const { user, updateProfile } = useAuth();
  const { items, subtotal, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [useOtherAddress, setUseOtherAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderStatus, setOrderStatus] = useState<'PENDING' | 'CONFIRMED' | null>(null);
  const [confirmTimerId, setConfirmTimerId] = useState<number | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  useEffect(() => {
    return () => {
      if (confirmTimerId) {
        window.clearTimeout(confirmTimerId);
      }
    };
  }, [confirmTimerId]);

  useEffect(() => {
    if (user?.address && !address) {
      setAddress(user.address);
    }
  }, [user, address]);

  const handleCheckout = async () => {
    const normalizedAddress = (useOtherAddress ? address : user?.address || address).trim();
    if (!normalizedAddress) {
      setError('Informe um endereco para continuar.');
      return;
    }

    if (items.length === 0) {
      setError('Seu carrinho esta vazio.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setOrderStatus(null);

    try {
      if (saveAddress && user && normalizedAddress !== (user.address ?? '').trim()) {
        try {
          await updateProfile({ address: normalizedAddress });
        } catch {
          setError('Nao foi possivel salvar o endereco.');
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        address: normalizedAddress,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      const response = await api.post('/api/orders', payload);
      setOrderStatus('PENDING');

      if (confirmTimerId) {
        window.clearTimeout(confirmTimerId);
      }

      const timer = window.setTimeout(async () => {
        try {
          await api.put(`/api/orders/${response.data.id}`, { status: 'CONFIRMED' });
          setOrderStatus('CONFIRMED');
          clearCart();
        } catch {
          setError('Falha ao confirmar o pedido.');
        }
      }, 1500);

      setConfirmTimerId(timer);
    } catch {
      setError('Falha ao criar o pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <span className="cart-empty-icon">🛒</span>
          <h2>Seu carrinho esta vazio</h2>
          <p>Explore os produtos e adicione seus favoritos.</p>
          <Link to="/" className="cart-back">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <div>
          <h1>Carrinho</h1>
          <p>{totalItems} item(ns)</p>
        </div>
        <div className="cart-header-actions">
          <Link to="/" className="cart-link">
            Continuar comprando
          </Link>
          <button className="cart-clear" onClick={clearCart}>
            Limpar carrinho
          </button>
        </div>
      </header>

      <div className="cart-layout">
        <section className="cart-items">
          {items.map((item) => (
            <div key={item.product.id} className="cart-item">
              <div className="cart-item-image">
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.name} />
                ) : (
                  <span>📦</span>
                )}
              </div>
              <div className="cart-item-info">
                <h3>{item.product.name}</h3>
                <p>{item.product.description}</p>
                <span className="cart-item-price">{formatPrice(item.product.price)}</span>
              </div>
              <div className="cart-item-qty">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  aria-label="Diminuir quantidade"
                  disabled={isSubmitting || orderStatus === 'PENDING'}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  aria-label="Aumentar quantidade"
                  disabled={isSubmitting || orderStatus === 'PENDING'}
                >
                  +
                </button>
              </div>
              <div className="cart-item-total">
                <span>{formatPrice(item.product.price * item.quantity)}</span>
                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item.product.id)}
                  disabled={isSubmitting || orderStatus === 'PENDING'}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </section>

        <aside className="cart-summary">
          <h2>Resumo</h2>
          {orderStatus && (
            <div className={`cart-status ${orderStatus === 'CONFIRMED' ? 'confirmed' : 'pending'}`}>
              Status: {orderStatus === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
            </div>
          )}
          {error && <div className="cart-error">{error}</div>}
          <div className="cart-address">
            <label htmlFor="address">Endereco de entrega</label>
            {user?.address && !useOtherAddress && (
              <div className="cart-address-saved">
                <div>
                  <span className="cart-address-saved-label">Endereco salvo</span>
                  <span className="cart-address-saved-value">{user.address}</span>
                </div>
                <button
                  type="button"
                  className="cart-address-use"
                  onClick={() => {
                    setUseOtherAddress(true);
                    setAddress('');
                  }}
                  disabled={isSubmitting || orderStatus === 'PENDING'}
                >
                  Usar outro endereco
                </button>
              </div>
            )}
            {(!user?.address || useOtherAddress) && (
              <textarea
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Rua, numero, bairro, cidade - UF"
                rows={3}
                disabled={isSubmitting || orderStatus === 'PENDING'}
              />
            )}
            {user && useOtherAddress && (
              <label className="cart-address-save">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  disabled={isSubmitting || orderStatus === 'PENDING'}
                />
                Salvar este endereco para proximas compras
              </label>
            )}
            {user?.address && useOtherAddress && (
              <button
                type="button"
                className="cart-address-cancel"
                onClick={() => {
                  setUseOtherAddress(false);
                  setAddress(user.address || '');
                }}
                disabled={isSubmitting || orderStatus === 'PENDING'}
              >
                Usar endereco salvo
              </button>
            )}
          </div>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Frete</span>
            <span>Calculado no checkout</span>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <button
            className="cart-checkout"
            onClick={handleCheckout}
            disabled={isSubmitting || orderStatus === 'PENDING' || orderStatus === 'CONFIRMED'}
          >
            {isSubmitting ? 'Processando...' : 'Finalizar compra (teste)'}
          </button>
          <p className="cart-note">Simulacao: cria PENDING e confirma em seguida.</p>
        </aside>
      </div>
    </div>
  );
}
