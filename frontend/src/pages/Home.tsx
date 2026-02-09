import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/products';
import type { Product } from '../services/products';
import './Home.css';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError('Erro ao carregar produtos');
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <Link to="/" className="logo">
            <div className="logo-icon">🛒</div>
            <span className="logo-text">ShopHub</span>
          </Link>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Buscar produtos..." />
          </div>
        </div>
        
        <nav className="header-right">
          {isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="header-btn admin-btn">
                  <span>⚙️</span>
                  <span>Admin</span>
                </Link>
              )}
              <Link to="/orders" className="header-btn">
                <span>📦</span>
                <span>Pedidos</span>
              </Link>
              <div className="header-divider"></div>
              <div className="user-menu">
                <div className="avatar">{user?.name ? getInitials(user.name) : '?'}</div>
                <div className="user-details">
                  <span className="user-name">{user?.name?.split(' ')[0]}</span>
                  {user?.role === 'ADMIN' && <span className="user-role">Admin</span>}
                </div>
              </div>
              <button onClick={logout} className="logout-btn" title="Sair">
                🚪
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Entrar</Link>
              <Link to="/register" className="signup-btn">Criar conta</Link>
            </div>
          )}
        </nav>
      </header>

      <main className="home-main">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h2>Encontre os melhores produtos</h2>
            <p>Qualidade e preço justo em um só lugar</p>
          </div>
        </section>

        {/* Products Section */}
        <section className="products-section">
          <h3 className="section-title">🔥 Produtos em destaque</h3>
          
          {isLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Carregando produtos...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={loadProducts} className="btn-retry">Tentar novamente</button>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>Nenhum produto disponível no momento</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="product-img"
                        loading="lazy"
                      />
                    ) : (
                      <span className="product-emoji">📦</span>
                    )}
                  </div>
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <p className="product-description">{product.description}</p>
                    <div className="product-footer">
                      <span className="product-price">{formatPrice(product.price)}</span>
                      <span className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
                      </span>
                    </div>
                    <button 
                      className="btn-add-cart" 
                      disabled={product.stock === 0}
                    >
                      {product.stock > 0 ? '🛒 Adicionar ao carrinho' : 'Indisponível'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="home-footer">
        <p>© 2026 E-Commerce. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
