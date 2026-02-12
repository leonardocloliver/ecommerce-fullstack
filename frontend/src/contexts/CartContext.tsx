import { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../services/products';
import { useAuth } from './AuthContext';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'cart_guest';
const getUserStorageKey = (userId: string) => `cart_user_${userId}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const previousUserId = useRef<string | null>(null);

  const readCart = (storageKey: string) => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return [] as CartItem[];
    }

    try {
      return JSON.parse(stored) as CartItem[];
    } catch {
      localStorage.removeItem(storageKey);
      return [] as CartItem[];
    }
  };

  const mergeCarts = (base: CartItem[], incoming: CartItem[]) => {
    if (incoming.length === 0) {
      return base;
    }

    const merged = [...base];
    incoming.forEach((item) => {
      const existing = merged.find((current) => current.product.id === item.product.id);
      if (existing) {
        const maxQty = item.product.stock > 0 ? item.product.stock : existing.quantity + item.quantity;
        existing.quantity = Math.min(existing.quantity + item.quantity, maxQty);
      } else {
        merged.push(item);
      }
    });

    return merged;
  };

  useEffect(() => {
    const guestItems = readCart(GUEST_STORAGE_KEY);

    if (user?.id) {
      const userKey = getUserStorageKey(user.id);
      const userItems = readCart(userKey);
      const merged = mergeCarts(userItems, guestItems);
      if (guestItems.length > 0) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
      setItems(merged);
    } else {
      if (previousUserId.current) {
        localStorage.removeItem(getUserStorageKey(previousUserId.current));
      }
      setItems(guestItems);
    }

    previousUserId.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    const storageKey = user?.id ? getUserStorageKey(user.id) : GUEST_STORAGE_KEY;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, user?.id]);

  const addItem = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0 || quantity <= 0) {
      return;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      }

      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      return prev.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        const maxQty = item.product.stock > 0 ? item.product.stock : quantity;
        const nextQty = Math.min(quantity, maxQty);
        return { ...item, quantity: nextQty };
      });
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const { totalItems, subtotal } = useMemo(() => {
    const totals = items.reduce(
      (acc, item) => {
        acc.totalItems += item.quantity;
        acc.subtotal += item.quantity * item.product.price;
        return acc;
      },
      { totalItems: 0, subtotal: 0 }
    );

    return totals;
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
