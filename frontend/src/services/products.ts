import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string | null;
  createdAt: string;
}

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await api.get<Product[]>('/api/products');
    return response.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
  },
};
