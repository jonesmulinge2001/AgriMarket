import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../service/order.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { Order, OrderStatus } from '../../interfaces';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Filter states
  selectedStatus: string = 'all';
  searchQuery: string = '';
  sortOption: string = 'newest';
  
  // Modal states
  selectedOrder: Order | null = null;
  showOrderDetails = false;
  showCancelModal = false;
  orderToCancel: Order | null = null;
  cancelLoading = false;
  
  // Statistics
  orderStats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalSpent: 0
  };

  // Status badge classes with proper typing
  private statusBadgeClasses: Record<OrderStatus, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'CONFIRMED': 'bg-blue-100 text-blue-800 border-blue-200',
    'SHIPPED': 'bg-purple-100 text-purple-800 border-purple-200',
    'DELIVERED': 'bg-green-100 text-green-800 border-green-200',
    'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
  };

  // Status icons with proper typing
  private statusIcons: Record<OrderStatus, string> = {
    'PENDING': 'pending',
    'CONFIRMED': 'check_circle',
    'SHIPPED': 'local_shipping',
    'DELIVERED': 'task_alt',
    'CANCELLED': 'cancel'
  };

  private subscriptions: Subscription = new Subscription();

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/my-orders' } 
      });
      return;
    }

    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    const ordersSub = this.orderService.getUserOrders().subscribe({
      next: (orders: Order[]) => {
        // Ensure orders is an array
        this.orders = Array.isArray(orders) ? orders : [];
        console.log('Orders loaded:', this.orders);
        this.calculateStats();
        this.applyFilters();
        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Error in loadOrders:', error);
        this.orders = []; // Set to empty array on error
        this.filteredOrders = [];
        this.error = error.message || 'Failed to load orders';
        this.loading = false;
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });

    this.subscriptions.add(ordersSub);
  }

  calculateStats(): void {
    // Ensure orders is an array before calculating
    const orders = this.orders || [];
    
    this.orderStats = {
      total: orders.length,
      pending: orders.filter((o: Order) => o?.status === 'PENDING').length,
      confirmed: orders.filter((o: Order) => o?.status === 'CONFIRMED').length,
      shipped: orders.filter((o: Order) => o?.status === 'SHIPPED').length,
      delivered: orders.filter((o: Order) => o?.status === 'DELIVERED').length,
      cancelled: orders.filter((o: Order) => o?.status === 'CANCELLED').length,
      totalSpent: orders
        .filter((o: Order) => o?.status !== 'CANCELLED')
        .reduce((sum: number, order: Order) => sum + (order?.total || 0), 0)
    };
  }

  applyFilters(): void {
    // Ensure orders is an array
    const orders = this.orders || [];
    let filtered = [...orders];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((order: Order) => order?.status === this.selectedStatus);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order: Order) => {
        if (!order) return false;
        
        const orderIdMatch = order.id?.toLowerCase().includes(query) || false;
        const productMatch = order.items?.some((item: any) => 
          item?.product?.name?.toLowerCase().includes(query)
        ) || false;
        const totalMatch = order.total?.toString().includes(query) || false;
        
        return orderIdMatch || productMatch || totalMatch;
      });
    }

    // Apply sorting
    filtered = this.sortOrders(filtered, this.sortOption);

    this.filteredOrders = filtered;
  }

  sortOrders(orders: Order[], option: string): Order[] {
    // Filter out any null/undefined orders
    const validOrders = orders.filter((order: Order) => order != null);
    
    switch (option) {
      case 'oldest':
        return [...validOrders].sort((a: Order, b: Order) => 
          new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
        );
      case 'highest':
        return [...validOrders].sort((a: Order, b: Order) => (b?.total || 0) - (a?.total || 0));
      case 'lowest':
        return [...validOrders].sort((a: Order, b: Order) => (a?.total || 0) - (b?.total || 0));
      case 'newest':
      default:
        return [...validOrders].sort((a: Order, b: Order) => 
          new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        );
    }
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.applyFilters();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortOption = target.value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.searchQuery = '';
    this.sortOption = 'newest';
    this.applyFilters();
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  confirmCancelOrder(order: Order): void {
    this.orderToCancel = order;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.orderToCancel = null;
  }

  cancelOrder(): void {
    if (!this.orderToCancel) return;

    this.cancelLoading = true;
    this.error = null;

    const cancelSub = this.orderService.cancelOrder(this.orderToCancel.id).subscribe({
      next: (updatedOrder: Order | null) => {
        if (updatedOrder) {
          // Update the order in the list
          const index = this.orders.findIndex((o: Order) => o?.id === updatedOrder.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
          }
          
          this.calculateStats();
          this.applyFilters();
        }
        
        this.successMessage = 'Order cancelled successfully';
        this.closeCancelModal();
        this.cancelLoading = false;

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (error: Error) => {
        console.error('Error cancelling order:', error);
        this.error = error.message || 'Failed to cancel order';
        this.cancelLoading = false;
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          this.error = null;
        }, 3000);
      }
    });

    this.subscriptions.add(cancelSub);
  }

  reorder(order: Order): void {
    // Navigate to the first product in the order
    if (order?.items && order.items.length > 0 && order.items[0]?.productId) {
      this.router.navigate(['/product', order.items[0].productId]);
    }
  }

  trackOrder(order: Order): void {
    this.viewOrderDetails(order);
  }

  getStatusBadgeClass(status: OrderStatus): string {
    return this.statusBadgeClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: OrderStatus): string {
    return this.statusIcons[status] || 'help';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price || 0);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  canCancelOrder(order: Order): boolean {
    return order?.status === 'PENDING' || order?.status === 'CONFIRMED';
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-product.jpg';
  }

  refreshOrders(): void {
    this.loadOrders();
  }
}