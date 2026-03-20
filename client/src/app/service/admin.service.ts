// src/app/service/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError, forkJoin, of } from 'rxjs';
import { AuthService } from './auth.service';
import { OrderService } from './order.service'; // Import OrderService
import { Order, OrderStatus } from '../interfaces';

// Add this type for user status
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface AdminStats {
  totalUsers: number;
  totalFarmers: number;
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingApprovals: number;
  reportedItems: number;
  lowStockProducts: number;     
  outOfStockProducts: number; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus; // Now using UserStatus instead of OrderStatus
  phone?: string;
  isVerified?: boolean;
  createdAt?: string;
  profile?: {
    profileImage?: string;
    institution?: {
      id: string;
      name: string;
    };
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string | null;
  imageUrl: string;
  farmerId: string;
  farmer: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface DashboardData {
  stats: AdminStats;
  recentOrders: Order[];
  topProducts: (Product & { revenue: number })[];
  recentUsers: User[];
  salesTrend: { date: string; orders: number; revenue: number }[];
  categoryDistribution: { category: string; count: number }[];
  orderStatusBreakdown: { status: string; count: number; color: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private productsApi = 'http://localhost:3000/products';
  private usersApi = 'http://localhost:3000/admin/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private orderService: OrderService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ========== Product Management ==========
  
  getAllProducts(): Observable<Product[]> {
    const headers = this.getHeaders();
    return this.http.get<Product[]>(this.productsApi, { headers }).pipe(
      map(products => products || []),
      catchError(error => {
        console.error('Error fetching products:', error);
        return of([]);
      })
    );
  }

  deleteProduct(productId: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.productsApi}/${productId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error deleting product:', error);
        return throwError(() => new Error('Failed to delete product'));
      })
    );
  }

  // ========== Order Management ==========

  getAllOrders(): Observable<Order[]> {
    return this.orderService.getUserOrders().pipe(
      catchError(error => {
        console.error('Error fetching orders:', error);
        return of([]);
      })
    );
  }

  // updateOrderStatus(orderId: string, status: string): Observable<Order> {
  //   return this.orderService.updateOrder(orderId, { status }).pipe(
  //     map(order => order as Order),
  //     catchError(error => {
  //       console.error('Error updating order status:', error);
  //       return throwError(() => new Error('Failed to update order status'));
  //     })
  //   );
  // }

  // ========== User Management ==========

  getAllUsers(): Observable<User[]> {
    const headers = this.getHeaders();
    console.log('🔍 Fetching users from:', this.usersApi);
    
    return this.http.get<any[]>(this.usersApi, { headers }).pipe(
      map(users => {
        console.log('✅ Raw users from backend:', users);
        
        if (!users || users.length === 0) {
          console.log('⚠️ No users found');
          return [];
        }
        
        const mappedUsers = users.map(user => ({
          id: user.id || '',
          name: user.name || 'Unknown',
          email: user.email || '',
          role: user.role || 'USER',
          status: (user.status || 'ACTIVE') as UserStatus,
          phone: user.phone || '',
          isVerified: user.isVerified || false,
          createdAt: user.createdAt || new Date().toISOString(),
          profile: user.profile || {}
        }));
        
        console.log('✅ Mapped users:', mappedUsers);
        return mappedUsers;
      }),
      catchError(error => {
        console.error('❌ Error fetching users:', error);
        return of([]);
      })
    );
  }

  getUserById(userId: string): Observable<User> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.usersApi}/${userId}`, { headers }).pipe(
      map(user => ({
        id: user.id || '',
        name: user.name || 'Unknown',
        email: user.email || '',
        role: user.role || 'USER',
        status: (user.status || 'ACTIVE') as UserStatus,
        phone: user.phone || '',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt || new Date().toISOString(),
        profile: user.profile || {}
      })),
      catchError(error => {
        console.error('Error fetching user:', error);
        return throwError(() => new Error('Failed to load user'));
      })
    );
  }

  updateUser(userId: string, updateData: Partial<User>): Observable<User> {
    const headers = this.getHeaders();
    return this.http.patch<any>(`${this.usersApi}/${userId}`, updateData, { headers }).pipe(
      map(user => ({
        id: user.id || '',
        name: user.name || 'Unknown',
        email: user.email || '',
        role: user.role || 'USER',
        status: (user.status || 'ACTIVE') as UserStatus,
        phone: user.phone || '',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt || new Date().toISOString(),
        profile: user.profile || {}
      })),
      catchError(error => {
        console.error('Error updating user:', error);
        return throwError(() => new Error('Failed to update user'));
      })
    );
  }

  deleteUser(userId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(`${this.usersApi}/${userId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error deleting user:', error);
        return throwError(() => new Error('Failed to delete user'));
      })
    );
  }

  deleteUsers(userIds: string[]): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(this.usersApi, { 
      headers,
      body: { ids: userIds }
    }).pipe(
      catchError(error => {
        console.error('Error deleting users:', error);
        return throwError(() => new Error('Failed to delete users'));
      })
    );
  }

  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.updateUser(userId, { status: status as UserStatus });
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.updateUser(userId, { role });
  }

  // ========== Dashboard Statistics ==========

  getDashboardData(): Observable<DashboardData> {
    return forkJoin({
      products: this.getAllProducts(),
      orders: this.getAllOrders(),
      users: this.getAllUsers()
    }).pipe(
      map(({ products, orders, users }) => {
        console.log('📊 Dashboard data received:');
        console.log('   - Products:', products.length);
        console.log('   - Orders:', orders.length);
        console.log('   - Users:', users.length);
        
        const farmers = users.filter(u => u.role === 'FARMER');
        const customers = users.filter(u => u.role === 'USER');
        
        const pendingOrders = orders.filter(o => o.status === 'PENDING');
        const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED');
        const shippedOrders = orders.filter(o => o.status === 'SHIPPED');
        const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
        const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
        
        const totalRevenue = orders
          .filter(o => o.status !== 'CANCELLED')
          .reduce((sum, order) => sum + (order.total || 0), 0);
  
        const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
        const outOfStockProducts = products.filter(p => p.quantity === 0).length;
  
        const productRevenue = new Map<string, number>();
        orders.forEach(order => {
          if (order.status !== 'CANCELLED' && order.items) {
            order.items.forEach(item => {
              const current = productRevenue.get(item.productId) || 0;
              productRevenue.set(item.productId, current + ((item.price || 0) * (item.quantity || 0)));
            });
          }
        });
  
        const topProducts = products
          .map(product => ({
            ...product,
            revenue: productRevenue.get(product.id) || 0
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
  
        const last7Days = this.generateSalesTrend(orders);
        const categoryDist = this.getCategoryDistribution(products);
  
        const orderStatusBreakdown = [
          { status: 'PENDING', count: pendingOrders.length, color: 'yellow' },
          { status: 'CONFIRMED', count: confirmedOrders.length, color: 'blue' },
          { status: 'SHIPPED', count: shippedOrders.length, color: 'purple' },
          { status: 'DELIVERED', count: deliveredOrders.length, color: 'green' },
          { status: 'CANCELLED', count: cancelledOrders.length, color: 'red' }
        ];
  
        const stats: AdminStats = {
          totalUsers: users.length,
          totalFarmers: farmers.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          pendingOrders: pendingOrders.length,
          pendingApprovals: products.filter(p => !p.category).length,
          reportedItems: 0,
          lowStockProducts,
          outOfStockProducts
        };
  
        return {
          stats,
          recentOrders: orders.slice(0, 5),
          topProducts,
          recentUsers: users.slice(0, 5),
          salesTrend: last7Days,
          categoryDistribution: categoryDist,
          orderStatusBreakdown
        };
      }),
      catchError(error => {
        console.error('❌ Error loading dashboard data:', error);
        return of({
          stats: {
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
          },
          recentOrders: [],
          topProducts: [],
          recentUsers: [],
          salesTrend: this.generateSalesTrend([]),
          categoryDistribution: [],
          orderStatusBreakdown: [
            { status: 'PENDING', count: 0, color: 'yellow' },
            { status: 'CONFIRMED', count: 0, color: 'blue' },
            { status: 'SHIPPED', count: 0, color: 'purple' },
            { status: 'DELIVERED', count: 0, color: 'green' },
            { status: 'CANCELLED', count: 0, color: 'red' }
          ]
        });
      })
    );
  }

  private generateSalesTrend(orders: Order[]): { date: string; orders: number; revenue: number }[] {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(order => 
        order.createdAt?.startsWith(dateStr) && order.status !== 'CANCELLED'
      );
      
      last7Days.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      });
    }
    return last7Days;
  }

  private getCategoryDistribution(products: Product[]): { category: string; count: number }[] {
    const categories = new Map<string, number>();
    products.forEach(product => {
      const cat = product.category || 'Uncategorized';
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });
    
    return Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}