// src/app/admin/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, DashboardData, User, Product } from '../../service/admin.service';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Order } from '../../interfaces';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Main dashboard data
  dashboardData: DashboardData | null = null;
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  
  // UI states
  selectedTimeRange: 'week' | 'month' = 'week';
  activeTab: 'overview' | 'users' | 'products' | 'orders' = 'overview';
  
  // Data for detailed views
  allUsers: User[] = [];
  allProducts: Product[] = [];
  allOrders: Order[] = [];
  
  // Loading states for different sections
  loadingUsers = false;
  loadingProducts = false;
  loadingOrders = false;
  
  // Selection states
  selectedUsers: Set<string> = new Set();
  selectedProducts: Set<string> = new Set();
  selectedOrders: Set<string> = new Set();
  
  // Modal states
  showUserEditModal = false;
  showProductDeleteModal = false;
  showOrderStatusModal = false;
  showBulkDeleteModal = false;
  
  // Selected items for modals
  selectedUser: User | null = null;
  selectedProduct: Product | null = null;
  selectedOrder: Order | null = null;
  bulkDeleteType: 'users' | 'products' | 'orders' | null = null;
  
  // Form data for editing
  userEditForm: Partial<User> = {};
  orderStatusForm: { status: string } = { status: '' };
  
  // Action states
  updatingUser = false;
  deletingProduct = false;
  updatingOrder = false;
  bulkDeleting = false;
  
  private refreshSubscription?: Subscription;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadAllUsers();
    this.loadAllProducts();
    this.loadAllOrders();
    
    // Auto-refresh dashboard every 60 seconds
    this.refreshSubscription = interval(60000).pipe(
      switchMap(() => this.adminService.getDashboardData())
    ).subscribe({
      next: (data) => {
        this.dashboardData = data;
      },
      error: (error) => console.error('Error refreshing dashboard:', error)
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    this.subscriptions.unsubscribe();
  }

  // ========== Data Loading Methods ==========

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    const sub = this.adminService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadAllUsers(): void {
    this.loadingUsers = true;
    const sub = this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.loadingUsers = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loadingUsers = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadAllProducts(): void {
    this.loadingProducts = true;
    const sub = this.adminService.getAllProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.loadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loadingProducts = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadAllOrders(): void {
    this.loadingOrders = true;
    const sub = this.adminService.getAllOrders().subscribe({
      next: (orders) => {
        this.allOrders = orders;
        this.loadingOrders = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loadingOrders = false;
      }
    });
    this.subscriptions.add(sub);
  }

  refreshData(): void {
    this.loadDashboardData();
    this.loadAllUsers();
    this.loadAllProducts();
    this.loadAllOrders();
  }

  // ========== User Management Methods ==========

  openUserEditModal(user: User): void {
    this.selectedUser = user;
    this.userEditForm = { ...user };
    this.showUserEditModal = true;
  }

  closeUserEditModal(): void {
    this.showUserEditModal = false;
    this.selectedUser = null;
    this.userEditForm = {};
    this.updatingUser = false;
  }

  updateUser(): void {
    if (!this.selectedUser || !this.userEditForm) return;

    this.updatingUser = true;
    this.error = null;

    const sub = this.adminService.updateUser(this.selectedUser.id, this.userEditForm).subscribe({
      next: (updatedUser) => {
        // Update in allUsers array
        const index = this.allUsers.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.allUsers[index] = updatedUser;
        }
        
        // Update in dashboard recent users if present
        if (this.dashboardData) {
          const recentIndex = this.dashboardData.recentUsers.findIndex(u => u.id === updatedUser.id);
          if (recentIndex !== -1) {
            this.dashboardData.recentUsers[recentIndex] = updatedUser;
          }
        }

        this.successMessage = `✅ User "${updatedUser.name}" updated successfully`;
        this.closeUserEditModal();

        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        this.error = error.message || 'Failed to update user';
        this.updatingUser = false;
        setTimeout(() => this.error = null, 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  updateUserStatus(userId: string, status: string): void {
    const sub = this.adminService.updateUserStatus(userId, status).subscribe({
      next: (updatedUser) => {
        // Update in allUsers array
        const index = this.allUsers.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.allUsers[index] = updatedUser;
        }
        
        this.successMessage = `✅ User status updated to ${status}`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        this.error = error.message || 'Failed to update user status';
        setTimeout(() => this.error = null, 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  updateUserRole(userId: string, role: string): void {
    const sub = this.adminService.updateUserRole(userId, role).subscribe({
      next: (updatedUser) => {
        const index = this.allUsers.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.allUsers[index] = updatedUser;
        }
        
        this.successMessage = `✅ User role updated to ${role}`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        this.error = error.message || 'Failed to update user role';
        setTimeout(() => this.error = null, 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const sub = this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter(u => u.id !== userId);
        if (this.dashboardData) {
          this.dashboardData.recentUsers = this.dashboardData.recentUsers.filter(u => u.id !== userId);
        }
        this.successMessage = '✅ User deleted successfully';
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        this.error = error.message || 'Failed to delete user';
        setTimeout(() => this.error = null, 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  // ========== Bulk User Management ==========

  toggleUserSelection(userId: string): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
  }

  toggleAllUsers(): void {
    if (this.selectedUsers.size === this.allUsers.length) {
      this.selectedUsers.clear();
    } else {
      this.allUsers.forEach(u => this.selectedUsers.add(u.id));
    }
  }

  openBulkDeleteModal(type: 'users' | 'products' | 'orders'): void {
    this.bulkDeleteType = type;
    this.showBulkDeleteModal = true;
  }

  closeBulkDeleteModal(): void {
    this.showBulkDeleteModal = false;
    this.bulkDeleteType = null;
    this.bulkDeleting = false;
  }


  // ========== Product Management Methods ==========

  openProductDeleteModal(product: Product): void {
    this.selectedProduct = product;
    this.showProductDeleteModal = true;
  }

  closeProductDeleteModal(): void {
    this.showProductDeleteModal = false;
    this.selectedProduct = null;
    this.deletingProduct = false;
  }

  confirmDeleteProduct(): void {
    if (!this.selectedProduct) return;

    this.deletingProduct = true;

    const sub = this.adminService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        this.allProducts = this.allProducts.filter(p => p.id !== this.selectedProduct?.id);
        this.successMessage = `✅ Product "${this.selectedProduct?.name}" deleted successfully`;
        this.closeProductDeleteModal();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (error) => {
        this.error = error.message || 'Failed to delete product';
        this.deletingProduct = false;
        setTimeout(() => this.error = null, 3000);
      }
    });
    this.subscriptions.add(sub);
  }

  // ========== Order Management Methods ==========

  openOrderStatusModal(order: Order): void {
    this.selectedOrder = order;
    this.orderStatusForm = { status: order.status };
    this.showOrderStatusModal = true;
  }

  closeOrderStatusModal(): void {
    this.showOrderStatusModal = false;
    this.selectedOrder = null;
    this.orderStatusForm = { status: '' };
    this.updatingOrder = false;
  }

  // updateOrderStatus(): void {
  //   if (!this.selectedOrder || !this.orderStatusForm.status) return;

  //   this.updatingOrder = true;

  //   const sub = this.adminService.updateOrderStatus(this.selectedOrder.id, this.orderStatusForm.status).subscribe({
  //     next: (updatedOrder) => {
  //       const index = this.allOrders.findIndex(o => o.id === updatedOrder.id);
  //       if (index !== -1) {
  //         this.allOrders[index] = updatedOrder;
  //       }
        
  //       this.successMessage = `✅ Order status updated to ${this.orderStatusForm.status}`;
  //       this.closeOrderStatusModal();
  //       setTimeout(() => this.successMessage = null, 3000);
  //     },
  //     error: (error) => {
  //       this.error = error.message || 'Failed to update order status';
  //       this.updatingOrder = false;
  //       setTimeout(() => this.error = null, 3000);
  //     }
  //   });
  //   this.subscriptions.add(sub);
  // }

  // ========== Navigation Methods ==========

  viewAllUsers(): void {
    this.activeTab = 'users';
  }

  viewAllProducts(): void {
    this.activeTab = 'products';
  }

  viewAllOrders(): void {
    this.activeTab = 'orders';
  }

  viewUserDetails(userId: string): void {
    this.router.navigate(['/admin/users', userId]);
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  viewProductDetails(productId: string): void {
    this.router.navigate(['/admin/products', productId]);
  }

  // ========== Utility Methods ==========

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CONFIRMED': 'bg-blue-100 text-blue-800 border-blue-200',
      'SHIPPED': 'bg-purple-100 text-purple-800 border-purple-200',
      'DELIVERED': 'bg-green-100 text-green-800 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getRoleBadgeClass(role: string): string {
    const roleClasses: Record<string, string> = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'FARMER': 'bg-green-100 text-green-800',
      'USER': 'bg-blue-100 text-blue-800'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': '#f59e0b',
      'CONFIRMED': '#3b82f6',
      'SHIPPED': '#8b5cf6',
      'DELIVERED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  getUserInitials(user: User): string {
    return user.name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getProductStatus(product: Product): { text: string; class: string } {
    if (product.quantity <= 0) {
      return { text: 'Out of Stock', class: 'text-red-600 bg-red-100' };
    } else if (product.quantity < 10) {
      return { text: 'Low Stock', class: 'text-yellow-600 bg-yellow-100' };
    } else {
      return { text: 'In Stock', class: 'text-green-600 bg-green-100' };
    }
  }
}