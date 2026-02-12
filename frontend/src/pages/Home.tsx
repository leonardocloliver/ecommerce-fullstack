import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productService } from '../services/products';
import type { Product } from '../services/products';
import './Home.css';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { addItem, totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addItem(product);
  };

  const handleLogout = () => {
    clearCart();
    logout();
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }

      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isUserMenuOpen]);

  const filteredProducts = products.filter((product) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <Link to="/" className="logo">
            <div className="logo-icon">🛒</div>
            <span className="logo-text">Ecommerce</span>
          </Link>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <nav className="header-right">
          {user?.role !== 'ADMIN' && (
            <Link to="/cart" className="header-btn cart-btn">
              <span>🛒</span>
              <span>Carrinho</span>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
          )}
          {isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="header-btn admin-btn">
                  <span>⚙️</span>
                  <span>Admin</span>
                </Link>
              )}
              <div className="header-divider"></div>
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button
                  className={`user-menu ${isUserMenuOpen ? 'open' : ''}`}
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="avatar">{user?.name ? getInitials(user.name) : '?'}</div>
                  <div className="user-details">
                    <span className="user-name">{user?.name}</span>
                    {user?.role === 'ADMIN' && <span className="user-role">Admin</span>}
                  </div>
                  {user?.role !== 'ADMIN' && <span className="user-chevron">▾</span>}
                </button>
                {user?.role !== 'ADMIN' && (
                  <div className={`user-dropdown ${isUserMenuOpen ? 'open' : ''}`} role="menu">
                    <Link
                      to="/orders"
                      className="user-dropdown-link"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span>📦</span>
                      <span>Pedidos</span>
                    </Link>
                    <Link
                      to="/perfil"
                      className="user-dropdown-link"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span>👤</span>
                      <span>Perfil</span>
                    </Link>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="logout-btn" title="Sair">
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
        <section className="hero">
          <div className="hero-glow hero-glow-a" aria-hidden="true"></div>
          <div className="hero-glow hero-glow-b" aria-hidden="true"></div>
          <div className="hero-grid" aria-hidden="true"></div>
          <div className="hero-content">
            <h2>Encontre os melhores produtos</h2>
            <p>Qualidade e preço justo em um só lugar</p>
          </div>
        </section>

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
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>
                {searchTerm.trim()
                  ? `Nenhum produto encontrado para "${searchTerm}"`
                  : 'Nenhum produto disponível no momento'}
              </p>
              {searchTerm.trim() && (
                <button onClick={() => setSearchTerm('')} className="btn-retry">
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
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
                      onClick={() => handleAddToCart(product)}
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
