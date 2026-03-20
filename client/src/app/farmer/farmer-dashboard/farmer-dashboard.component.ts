import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { FarmerService } from '../../service/farmer.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { 
  FarmerDashboardData, 
  FarmerStats, 
  Product, 
  Order, 
  TopProduct, 
  DailySalesData, 
  MonthlySalesData 
} from '../../interfaces';
import { SideBarComponent } from "../side-bar/side-bar.component";
import { TopBarComponent } from "../top-bar/top-bar.component";
import { OrderService } from '../../service/order.service';

@Component({
  selector: 'app-farmer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './farmer-dashboard.component.html',
  styleUrls: ['./farmer-dashboard.component.css']
})
export class FarmerDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('productFormElement') productFormElement!: NgForm;
  
  // Dashboard data
  dashboardData: FarmerDashboardData | null = null;
  stats: FarmerStats | null = null;
  products: Product[] = [];
  recentOrders: Order[] = [];
  topProducts: TopProduct[] = [];
  salesTrend: DailySalesData[] = [];
  monthlyTrend: MonthlySalesData[] = [];

  showUpdateStatusModal = false;
  selectedOrderForUpdate: Order | null = null;
  selectedStatus: string = '';
  updatingOrderStatus = false;
  orderUpdateError: string | null = null;
  
  // UI states
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  activeTab: 'overview' | 'products' | 'orders' | 'analytics' = 'overview';
  
  // Product management
  showAddProductModal = false;
  showEditProductModal = false;
  selectedProduct: Product | null = null;
  showDeleteModal = false;
  productToDelete: Product | null = null;
  deletingProduct = false;
  productDeleteError: string | null = null;
  productForm: Partial<Product> = {
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    category: '',
    imageUrl: ''
  };
  savingProduct = false;
  
  // Image upload properties - THESE WERE MISSING
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingImage = false;
  
  // Order management
  showOrderDetailsModal = false;
  selectedOrder: Order | null = null;
  updatingOrder = false;
  
  // Date range for analytics
  dateRange: 'week' | 'month' | 'year' = 'week';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private farmerService: FarmerService,
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in and is a farmer
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/farmer-dashboard' } 
      });
      return;
    }

    if (!this.isFarmer()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  // Add this method to handle sidebar tab changes
onSidebarTabChange(tab: string): void {
  this.setActiveTab(tab as 'overview' | 'products' | 'orders' | 'analytics');
}
  

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    const dashboardSub = this.farmerService.getDashboardData().subscribe({
      next: (data: FarmerDashboardData) => {
        this.dashboardData = data;
        this.stats = data.stats;
        this.products = data.products;
        this.recentOrders = data.recentOrders;
        this.topProducts = data.topProducts;
        this.salesTrend = data.salesTrend;
        this.monthlyTrend = data.monthlyTrend;
        this.loading = false;
      },
      error: (error: Error) => {
        console.error('Error loading dashboard:', error);
        this.error = error.message || 'Failed to load dashboard data';
        this.loading = false;
      }
    });

    this.subscriptions.add(dashboardSub);
  }

  // Tab navigation
  setActiveTab(tab: 'overview' | 'products' | 'orders' | 'analytics'): void {
    this.activeTab = tab;
  }

  // Image upload handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Product management
  openAddProductModal(): void {
    this.resetProductForm();
    this.showAddProductModal = true;
  }

  openEditProductModal(product: Product): void {
    this.selectedProduct = product;
    this.productForm = { ...product };
    // If there's an existing image, show preview
    if (product.imageUrl) {
      this.imagePreview = product.imageUrl;
    }
    this.showEditProductModal = true;
  }

  closeProductModals(): void {
    this.showAddProductModal = false;
    this.showEditProductModal = false;
    this.selectedProduct = null;
    this.resetProductForm();
  }

  private resetProductForm(): void {
    this.productForm = {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      category: '',
      imageUrl: ''
    };
    this.selectedFile = null;
    this.imagePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    // Reset form validation state if form exists
    if (this.productFormElement) {
      this.productFormElement.resetForm();
    }
  }

  async saveProduct(): Promise<void> {
    if (!this.validateProductForm()) return;
  
    this.savingProduct = true;
    this.error = null;
  
    try {
      // Create FormData object for multipart/form-data upload
      const formData = new FormData();
      
      // Append all product fields
      formData.append('name', this.productForm.name || '');
      formData.append('description', this.productForm.description || '');
      formData.append('price', (this.productForm.price || 0).toString());
      formData.append('quantity', (this.productForm.quantity || 0).toString());
      
      if (this.productForm.category) {
        formData.append('category', this.productForm.category);
      }
      
      // Append image file if selected
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      } 
      // If editing and no new file but existing imageUrl, send it
      else if (this.showEditProductModal && this.productForm.imageUrl) {
        formData.append('imageUrl', this.productForm.imageUrl);
      }
  
      const saveOperation = this.showEditProductModal && this.selectedProduct
        ? this.farmerService.updateProduct(this.selectedProduct.id, formData)
        : this.farmerService.createProduct(formData);
  
      const saveSub = saveOperation.subscribe({
        next: (savedProduct: Product) => {
          if (this.showEditProductModal && this.selectedProduct) {
            // Update in products array
            const index = this.products.findIndex(p => p.id === savedProduct.id);
            if (index !== -1) {
              this.products[index] = savedProduct;
            }
            this.successMessage = 'Product updated successfully';
          } else {
            // Add to products array
            this.products = [savedProduct, ...this.products];
            this.successMessage = 'Product added successfully';
          }
  
          this.closeProductModals();
          this.savingProduct = false;
  
          // Refresh stats
          this.refreshStats();
  
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error: Error) => {
          console.error('Error saving product:', error);
          this.error = error.message || 'Failed to save product';
          this.savingProduct = false;
        }
      });
  
      this.subscriptions.add(saveSub);
    } catch (error: any) {
      console.error('Error in saveProduct:', error);
      this.error = error.message || 'Failed to save product';
      this.savingProduct = false;
    }
  }


  private validateProductForm(): boolean {
    if (!this.productForm.name?.trim()) {
      this.error = 'Product name is required';
      return false;
    }
    if (!this.productForm.description?.trim()) {
      this.error = 'Product description is required';
      return false;
    }
    if (!this.productForm.price || this.productForm.price <= 0) {
      this.error = 'Please enter a valid price';
      return false;
    }
    if (this.productForm.quantity === undefined || this.productForm.quantity < 0) {
      this.error = 'Please enter a valid quantity';
      return false;
    }
    return true;
  }

  // Order management
  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetailsModal = true;
  }

  closeOrderDetails(): void {
    this.showOrderDetailsModal = false;
    this.selectedOrder = null;
  }

  updateOrderStatus(order: Order, newStatus: string): void {
    if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

    this.updatingOrder = true;

    const updateSub = this.farmerService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updatedOrder: Order) => {
        // Update in recent orders
        const index = this.recentOrders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          this.recentOrders[index] = updatedOrder;
        }

        if (this.selectedOrder?.id === updatedOrder.id) {
          this.selectedOrder = updatedOrder;
        }

        this.successMessage = `Order status updated to ${newStatus}`;
        this.updatingOrder = false;

        // Refresh stats
        this.refreshStats();

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (error: Error) => {
        this.error = error.message || 'Failed to update order status';
        this.updatingOrder = false;
      }
    });

    this.subscriptions.add(updateSub);
  }

  // Analytics
  setDateRange(range: 'week' | 'month' | 'year'): void {
    this.dateRange = range;
  }

  getChartData(): DailySalesData[] | MonthlySalesData[] {
    switch(this.dateRange) {
      case 'week':
        return this.salesTrend;
      case 'month':
      case 'year':
        return this.monthlyTrend;
      default:
        return this.salesTrend;
    }
  }

  // Helper methods
  refreshStats(): void {
    // Reload dashboard data
    this.loadDashboardData();
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
      day: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  getStockStatusClass(quantity: number): string {
    if (quantity <= 0) return 'text-red-600 bg-red-100';
    if (quantity < 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  }

  getStockStatusText(quantity: number): string {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isFarmer(): boolean {
    return this.authService.getUserRole() === 'FARMER';
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-product.jpg';
  }

  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  getGrowthClass(growth: number): string {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  }

  getGrowthIcon(growth: number): string {
    return growth >= 0 ? 'trending_up' : 'trending_down';
  }

  // Open delete confirmation modal
openDeleteModal(product: Product): void {
  this.productToDelete = product;
  this.productDeleteError = null;
  this.showDeleteModal = true;
}

// Close delete modal
closeDeleteModal(): void {
  this.showDeleteModal = false;
  this.productToDelete = null;
  this.productDeleteError = null;
  this.deletingProduct = false;
}

// Confirm and execute delete
confirmDelete(): void {
  if (!this.productToDelete) return;

  this.deletingProduct = true;
  this.productDeleteError = null;

  const deleteSub = this.farmerService.deleteProduct(this.productToDelete.id).subscribe({
    next: () => {
      // Remove product from array
      this.products = this.products.filter(p => p.id !== this.productToDelete?.id);
      
      // Show success message
      this.successMessage = `✅ Product "${this.productToDelete?.name}" deleted successfully`;
      
      // Close modal and reset states
      this.closeDeleteModal();
      
      // Refresh stats
      this.refreshStats();

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    },
    error: (error: Error) => {
      console.error('Error deleting product:', error);
      
      // Set error message in modal
      if (error.message.includes('existing order')) {
        const orderCountMatch = error.message.match(/(\d+)/);
        const orderCount = orderCountMatch ? orderCountMatch[0] : '';
        
        this.productDeleteError = `This product has ${orderCount} existing order(s). Please ensure all orders are completed or cancelled before deleting.`;
      } else {
        this.productDeleteError = error.message || 'Failed to delete product';
      }
      
      this.deletingProduct = false;
    }
  });

  this.subscriptions.add(deleteSub);
}

// Open update status modal
openUpdateStatusModal(order: Order): void {
  this.selectedOrderForUpdate = order;
  this.selectedStatus = order.status;
  this.orderUpdateError = null;
  this.showUpdateStatusModal = true;
}

// Close update status modal
closeUpdateStatusModal(): void {
  this.showUpdateStatusModal = false;
  this.selectedOrderForUpdate = null;
  this.selectedStatus = '';
  this.orderUpdateError = null;
  this.updatingOrderStatus = false;
}

// Confirm and update order status
confirmUpdateStatus(): void {
  if (!this.selectedOrderForUpdate || !this.selectedStatus) return;

  // Don't update if status hasn't changed
  if (this.selectedStatus === this.selectedOrderForUpdate.status) {
    this.orderUpdateError = 'Please select a different status';
    return;
  }

  this.updatingOrderStatus = true;
  this.orderUpdateError = null;

  console.log('Farmer updating order status:', {
    orderId: this.selectedOrderForUpdate.id,
    currentStatus: this.selectedOrderForUpdate.status,
    newStatus: this.selectedStatus
  });

  // Use the new dedicated farmer endpoint
  const updateSub = this.orderService.updateOrderStatusByFarmer(
    this.selectedOrderForUpdate.id, 
    this.selectedStatus
  ).subscribe({
    next: (updatedOrder) => {
      if (updatedOrder) {
        console.log('Order status updated successfully by farmer:', updatedOrder);
        
        // Update in recent orders
        const index = this.recentOrders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          this.recentOrders[index] = updatedOrder;
        }

        if (this.selectedOrder?.id === updatedOrder.id) {
          this.selectedOrder = updatedOrder;
        }

        this.successMessage = `✅ Order #${updatedOrder.id.slice(-8)} status updated to ${this.selectedStatus}`;
        this.closeUpdateStatusModal();
        this.refreshStats();

        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      }
    },
    error: (error: Error) => {
      console.error('Error updating order status:', error);
      this.orderUpdateError = error.message || 'Failed to update order status';
      this.updatingOrderStatus = false;
    }
  });

  this.subscriptions.add(updateSub);
}
// Get status color for the dropdown
getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'CONFIRMED': 'bg-blue-100 text-blue-800 border-blue-200',
    'SHIPPED': 'bg-purple-100 text-purple-800 border-purple-200',
    'DELIVERED': 'bg-green-100 text-green-800 border-green-200',
    'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

}