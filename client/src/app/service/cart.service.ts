import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CartItem, Product, CartSummary } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();

  constructor() {
    // Load cart from localStorage on service initialization
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        this.cartItems.next(items);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(item => item.product.id === product.id);

    let updatedItems: CartItem[];

    if (existingItem) {
      // Update quantity if item exists
      updatedItems = currentItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // Add new item
      updatedItems = [...currentItems, { 
        product, 
        quantity, 
        selected: true 
      }];
    }

    this.cartItems.next(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  updateQuantity(productId: string, quantity: number): void {
    const currentItems = this.cartItems.value;
    const updatedItems = currentItems.map(item =>
      item.product.id === productId
        ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.quantity)) }
        : item
    );
    
    this.cartItems.next(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  removeFromCart(productId: string): void {
    const updatedItems = this.cartItems.value.filter(item => item.product.id !== productId);
    this.cartItems.next(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  toggleItemSelection(productId: string, selected: boolean): void {
    const updatedItems = this.cartItems.value.map(item =>
      item.product.id === productId ? { ...item, selected } : item
    );
    this.cartItems.next(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  toggleAllItems(selected: boolean): void {
    const updatedItems = this.cartItems.value.map(item => ({ ...item, selected }));
    this.cartItems.next(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  clearCart(): void {
    this.cartItems.next([]);
    localStorage.removeItem('cart');
  }

  getCartSummary(): Observable<CartSummary> {
    return this.cartItems$.pipe(
      map(items => {
        const subtotal = items.reduce(
          (sum, item) => sum + (item.product.price * item.quantity), 
          0
        );
        
        const selectedItems = items.filter(item => item.selected);
        const selectedTotal = selectedItems.reduce(
          (sum, item) => sum + (item.product.price * item.quantity), 
          0
        );

        return {
          subtotal,
          totalItems: items.length,
          selectedItems: selectedItems.length,
          selectedTotal
        };
      })
    );
  }

  getSelectedItems(): CartItem[] {
    return this.cartItems.value.filter(item => item.selected);
  }

  getCartCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
  }

  hasItemsInCart(): boolean {
    return this.cartItems.value.length > 0;
  }
}