import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Product } from '../../services/products';
import './Admin.css';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    imageUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
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

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      imageUrl: product.imageUrl || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '' });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        imageUrl: formData.imageUrl || null,
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }

      await loadProducts();
      closeModal();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erro ao salvar produto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/products/${product.id}`);
      await loadProducts();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      alert('Erro ao excluir produto');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="page-header">
        <div>
          <h1>Produtos</h1>
          <p>Gerencie os produtos da sua loja</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>Nenhum produto cadastrado</h3>
          <p>Comece adicionando seu primeiro produto</p>
          <button onClick={openCreateModal} className="btn-primary">
            ➕ Adicionar Produto
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="product-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <span className="product-emoji">📦</span>
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <span className="product-desc">{product.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="price-cell">{formatPrice(product.price)}</td>
                  <td className="stock-cell">{product.stock}</td>
                  <td>
                    <span className={`status-badge ${product.stock > 5 ? 'active' : product.stock > 0 ? 'low' : 'out'}`}>
                      {product.stock > 5 ? 'Em estoque' : product.stock > 0 ? 'Estoque baixo' : 'Esgotado'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openEditModal(product)} className="btn-edit" title="Editar">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(product)} className="btn-delete" title="Excluir">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={closeModal} className="modal-close">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="form-error">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="name">Nome do Produto</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Camiseta Básica"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o produto..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoria</label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Eletronicos"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Imagem (URL)</label>
                <input
                  type="url"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Preço (R$)</label>
                  <input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Estoque</label>
                  <input
                    type="number"
                    id="stock"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
