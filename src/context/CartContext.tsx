"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext<any>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("nexus-cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("nexus-cart", JSON.stringify(cart));
  }, [cart]);

  // DIPERBARUI: Menerima parameter kuantitas (default 1)
  const addToCart = (product: any, quantity: number = 1) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        // Jika barang sudah ada di keranjang, tambahkan kuantitasnya
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + quantity } 
            : item
        );
      }
      // Jika barang baru, masukkan dengan kuantitas yang dipilih
      return [...prev, { ...product, cartQuantity: quantity }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("nexus-cart");
  };

  return (
    <CartContext.Provider value={{ cart, isOpen, setIsOpen, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);