import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../service/order.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { CartItem, CartSummary } from '../../interfaces';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  summary: CartSummary = {
    subtotal: 0,
    totalItems: 0,
    selectedItems: 0,
    selectedTotal: 0
  };
  
  loading = false;
  placingOrder = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Modal states
  showRemoveModal = false;
  itemToRemove: CartItem | null = null;
  showClearCartModal = false;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/cart' } 
      });
      return;
    }

    this.loadCart();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCart(): void {
    const cartSub = this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
    
    const summarySub = this.cartService.getCartSummary().subscribe(summary => {
      this.summary = summary;
    });

    this.subscriptions.add(cartSub);
    this.subscriptions.add(summarySub);
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) return;
    if (newQuantity > item.product.quantity) {
      this.error = `Only ${item.product.quantity} items available`;
      setTimeout(() => this.error = null, 3000);
      return;
    }
    
    this.cartService.updateQuantity(item.product.id, newQuantity);
    this.successMessage = `Quantity updated to ${newQuantity}`;
    setTimeout(() => this.successMessage = null, 2000);
  }

  // Remove item modal methods
  openRemoveModal(item: CartItem): void {
    this.itemToRemove = item;
    this.showRemoveModal = true;
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.itemToRemove = null;
  }

  confirmRemove(): void {
    if (this.itemToRemove) {
      this.cartService.removeFromCart(this.itemToRemove.product.id);
      this.successMessage = `"${this.itemToRemove.product.name}" removed from cart`;
      this.closeRemoveModal();
      
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    }
  }

  // Clear cart modal methods
  openClearCartModal(): void {
    if (this.cartItems.length > 0) {
      this.showClearCartModal = true;
    }
  }

  closeClearCartModal(): void {
    this.showClearCartModal = false;
  }

  confirmClearCart(): void {
    this.cartService.clearCart();
    this.successMessage = 'Cart cleared successfully';
    this.closeClearCartModal();
    
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  toggleItemSelection(item: CartItem, event: any): void {
    this.cartService.toggleItemSelection(item.product.id, event.target.checked);
  }

  toggleAllItems(event: any): void {
    this.cartService.toggleAllItems(event.target.checked);
  }

  get allItemsSelected(): boolean {
    return this.cartItems.length > 0 && 
           this.cartItems.every(item => item.selected);
  }

  get someItemsSelected(): boolean {
    return this.cartItems.some(item => item.selected) && !this.allItemsSelected;
  }

  async placeOrder(): Promise<void> {
    const selectedItems = this.cartService.getSelectedItems();
    
    if (selectedItems.length === 0) {
      this.error = '⚠️ Please select at least one item to order';
      setTimeout(() => this.error = null, 3000);
      return;
    }
  
    // Validate stock availability
    for (const item of selectedItems) {
      if (item.quantity > item.product.quantity) {
        this.error = `⚠️ Insufficient stock for ${item.product.name}. Only ${item.product.quantity} available.`;
        setTimeout(() => this.error = null, 5000);
        return;
      }
    }
  
    this.placingOrder = true;
    this.error = null;
    this.successMessage = null;
  
    try {
      const orders = selectedItems.map(item => ({
        productId: item.product.id,
        quantity: Number(item.quantity) // Ensure it's a number
      }));
  
      console.log('📦 Placing orders:', JSON.stringify(orders, null, 2));
  
      // Create orders one by one
      for (const order of orders) {
        try {
          console.log('📤 Sending order:', order);
          const result = await this.orderService.createOrder(order).toPromise();
          console.log('✅ Order placed successfully:', result);
        } catch (orderError: any) {
          console.error('❌ Failed to place order:', orderError);
          const productName = selectedItems.find(i => i.product.id === order.productId)?.product.name;
          throw new Error(`Failed to order ${productName}: ${orderError.message}`);
        }
      }
  
      // Remove ordered items from cart
      selectedItems.forEach(item => {
        this.cartService.removeFromCart(item.product.id);
      });
  
      this.successMessage = '✅ Order placed successfully!';
      
      setTimeout(() => {
        this.successMessage = null;
      }, 5000);
  
    } catch (error: any) {
      console.error('❌ Error placing orders:', error);
      this.error = error.message || '❌ Failed to place order. Please try again.';
      setTimeout(() => this.error = null, 5000);
    } finally {
      this.placingOrder = false;
    }
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  viewOrders(): void {
    this.router.navigate(['/my-orders']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-product.jpg';
  }
}