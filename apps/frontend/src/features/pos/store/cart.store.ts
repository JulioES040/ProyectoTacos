import { create } from 'zustand';

type CartItem = { productId: string; quantity: number };
type CartStore = { items: CartItem[]; addItem: (productId: string) => void; clear: () => void };

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (productId) => set((state) => ({ items: [...state.items, { productId, quantity: 1 }] })),
  clear: () => set({ items: [] }),
}));
