import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AdminService, AdminStats, DashboardData } from '../../service/admin.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  badgeColor?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-super-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SuperAdminSidebarComponent implements OnInit, OnDestroy {
  @Input() activeSection: string = 'dashboard';
  @Input() isCollapsed: boolean = false;
  @Output() sectionChange = new EventEmitter<string>();

  // Real-time stats from backend
  stats: AdminStats = {
    totalUsers: 0,
    totalFarmers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    pendingApprovals: 0,
    reportedItems: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  };

  dashboardData: DashboardData | null = null;
  currentTime: string = '';
  private timeInterval: any;
  private statsSubscription?: Subscription;

  // Expanded menu sections
  expandedMenus: Set<string> = new Set(['user-management', 'order-management']);

  menuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'dashboard', 
      route: '/admin/dashboard'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: 'analytics', 
      route: '/admin/analytics' 
    },
    { 
      id: 'user-management', 
      label: 'User Management', 
      icon: 'group', 
      route: '/admin/users',
      children: [
        { id: 'all-users', label: 'All Users', icon: 'people', route: '/admin/users/all' },
        { id: 'farmers', label: 'Farmers', icon: 'agriculture', route: '/admin/users/farmers' },
        { id: 'customers', label: 'Customers', icon: 'person', route: '/admin/users/customers' },
        { id: 'admins', label: 'Administrators', icon: 'admin_panel_settings', route: '/admin/users/admins' }
      ]
    },
    { 
      id: 'product-management', 
      label: 'Product Management', 
      icon: 'inventory', 
      route: '/admin/products',
      children: [
        { id: 'all-products', label: 'All Products', icon: 'inventory_2', route: '/admin/products/all' },
        { id: 'by-farmer', label: 'By Farmer', icon: 'person_outline', route: '/admin/products/by-farmer' },
        { id: 'categories', label: 'Categories', icon: 'category', route: '/admin/products/categories' }
      ]
    },
    { 
      id: 'order-management', 
      label: 'Order Management', 
      icon: 'shopping_cart', 
      route: '/admin/orders',
      children: [
        { id: 'all-orders', label: 'All Orders', icon: 'receipt', route: '/admin/orders/all' },
        { id: 'pending-orders', label: 'Pending', icon: 'hourglass_top', route: '/admin/orders/pending' },
        { id: 'processing', label: 'Processing', icon: 'autorenew', route: '/admin/orders/processing' },
        { id: 'shipped', label: 'Shipped', icon: 'local_shipping', route: '/admin/orders/shipped' },
        { id: 'delivered', label: 'Delivered', icon: 'check_circle', route: '/admin/orders/delivered' },
        { id: 'cancelled', label: 'Cancelled', icon: 'cancel', route: '/admin/orders/cancelled' }
      ]
    },
    { 
      id: 'payment-management', 
      label: 'Payments', 
      icon: 'payments', 
      route: '/admin/payments',
      children: [
        { id: 'transactions', label: 'Transactions', icon: 'receipt_long', route: '/admin/payments/transactions' },
        { id: 'payouts', label: 'Farmer Payouts', icon: 'paid', route: '/admin/payments/payouts' }
      ]
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: 'assessment', 
      route: '/admin/reports',
      children: [
        { id: 'sales-report', label: 'Sales Report', icon: 'trending_up', route: '/admin/reports/sales' },
        { id: 'user-report', label: 'User Activity', icon: 'people_outline', route: '/admin/reports/users' },
        { id: 'product-report', label: 'Product Performance', icon: 'inventory', route: '/admin/reports/products' }
      ]
    },
    { 
      id: 'system', 
      label: 'System', 
      icon: 'settings', 
      route: '/admin/system',
      children: [
        { id: 'settings', label: 'Settings', icon: 'settings_applications', route: '/admin/system/settings' },
        { id: 'audit-logs', label: 'Audit Logs', icon: 'history', route: '/admin/system/audit-logs' }
      ]
    }
  ];

  // Quick stats for collapsed view
  quickStats = [
    { label: 'Users', value: () => this.stats.totalUsers, icon: 'people', color: 'from-blue-400 to-indigo-500' },
    { label: 'Products', value: () => this.stats.totalProducts, icon: 'inventory', color: 'from-green-400 to-teal-500' },
    { label: 'Orders', value: () => this.stats.totalOrders, icon: 'shopping_cart', color: 'from-yellow-400 to-orange-500' }
  ];

  constructor(
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.updateCurrentTime();
    this.loadDashboardStats();
    
    // Update time every second
    this.timeInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 1000);

    // Refresh stats every 30 seconds
    this.statsSubscription = interval(30000).pipe(
      switchMap(() => this.adminService.getDashboardData())
    ).subscribe({
      next: (data: DashboardData) => {
        this.dashboardData = data;
        this.stats = data.stats;
        this.updateMenuBadges();
      },
      error: (error) => console.error('Error refreshing stats:', error)
    });
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

  loadDashboardStats(): void {
    this.adminService.getDashboardData().subscribe({
      next: (data: DashboardData) => {
        this.dashboardData = data;
        this.stats = data.stats;
        this.updateMenuBadges();
      },
      error: (error) => console.error('Error loading stats:', error)
    });
  }

  updateMenuBadges(): void {
    // Update user management badges
    const userMenu = this.menuItems.find(m => m.id === 'user-management');
    if (userMenu) {
      userMenu.badge = this.stats.totalUsers;
    }

    // Update order management badges
    const orderMenu = this.menuItems.find(m => m.id === 'order-management');
    if (orderMenu) {
      orderMenu.badge = this.stats.totalOrders;
      
      // Update child badges
      const pendingChild = orderMenu.children?.find(c => c.id === 'pending-orders');
      if (pendingChild) pendingChild.badge = this.stats.pendingOrders;
      
      // You can add more child badges here as needed
      const processingChild = orderMenu.children?.find(c => c.id === 'processing');
      if (processingChild) processingChild.badge = 0; // You'll need to track this separately
      
      const shippedChild = orderMenu.children?.find(c => c.id === 'shipped');
      if (shippedChild) shippedChild.badge = 0;
      
      const deliveredChild = orderMenu.children?.find(c => c.id === 'delivered');
      if (deliveredChild) deliveredChild.badge = 0;
      
      const cancelledChild = orderMenu.children?.find(c => c.id === 'cancelled');
      if (cancelledChild) cancelledChild.badge = 0;
    }

    // Update product management badges
    const productMenu = this.menuItems.find(m => m.id === 'product-management');
    if (productMenu) {
      productMenu.badge = this.stats.totalProducts;
    }
  }

  updateCurrentTime(): void {
    this.currentTime = new Date().toLocaleTimeString();
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.adminName = user.name || 'Super Admin';
        this.adminEmail = user.email || 'admin@farmersportal.com';
      } catch {
        this.adminName = 'Super Admin';
        this.adminEmail = 'admin@farmersportal.com';
      }
    }
  }

  toggleMenu(menuId: string): void {
    if (this.expandedMenus.has(menuId)) {
      this.expandedMenus.delete(menuId);
    } else {
      this.expandedMenus.add(menuId);
    }
  }

  isMenuExpanded(menuId: string): boolean {
    return this.expandedMenus.has(menuId);
  }

  onSectionSelect(item: MenuItem): void {
    if (item.id === 'logout') {
      this.logoutItem = item;
      this.showLogoutModal = true;
      return;
    }
    
    this.activeSection = item.id;
    this.sectionChange.emit(item.id);
    this.router.navigate([item.route]);
    
    if (window.innerWidth < 768) {
      this.isCollapsed = true;
    }
  }

  getInitials(): string {
    return this.adminName?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'SA';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Modal state
  showLogoutModal: boolean = false;
  logoutItem!: MenuItem;
  adminName: string = 'Super Admin';
  adminEmail: string = 'admin@farmersportal.com';

  confirmLogout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
    this.showLogoutModal = false;
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }
}