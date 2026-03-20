import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError, forkJoin, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Product, Order, FarmerDashboardData, FarmerStats, TopProduct, DailySalesData, MonthlySalesData } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class FarmerService {
  private productsApiUrl = 'http://localhost:3000/products';
  private ordersApiUrl = 'http://localhost:3000/orders';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type here - let the browser set it with boundary for multipart/form-data
    });
  }

  // Get all products for the logged-in farmer
  getFarmerProducts(): Observable<Product[]> {
    const headers = this.getHeaders();
    
    return this.http.get<Product[]>(this.productsApiUrl, { headers }).pipe(
      map(products => {
        console.log('Farmer products:', products);
        return products || [];
      }),
      catchError(error => {
        console.error('Error fetching farmer products:', error);
        return of([]);
      })
    );
  }

  // Get all orders (filter for farmer's products)
  getAllOrders(): Observable<Order[]> {
    const headers = this.getHeaders();
    
    return this.http.get<Order[]>(this.ordersApiUrl, { headers }).pipe(
      map(orders => {
        console.log('All orders:', orders);
        return orders || [];
      }),
      catchError(error => {
        console.error('Error fetching orders:', error);
        return of([]);
      })
    );
  }

  // Get complete dashboard data
  getDashboardData(): Observable<FarmerDashboardData> {
    return forkJoin({
      products: this.getFarmerProducts(),
      orders: this.getAllOrders()
    }).pipe(
      map(({ products, orders }) => {
        // Filter orders that contain farmer's products
        const farmerProductIds = new Set(products.map(p => p.id));
        const relevantOrders = orders.filter(order => 
          order.items?.some(item => farmerProductIds.has(item.productId))
        );

        // Calculate statistics
        const stats = this.calculateStats(products, relevantOrders);
        
        // Get top products by sales
        const topProducts = this.getTopProducts(products, relevantOrders);
        
        // Generate sales trends
        const salesTrend = this.generateDailySalesTrend(relevantOrders);
        const monthlyTrend = this.generateMonthlySalesTrend(relevantOrders);

        return {
          stats,
          recentOrders: relevantOrders.slice(0, 10),
          topProducts: topProducts.slice(0, 5),
          salesTrend,
          monthlyTrend,
          products
        };
      }),
      catchError(error => {
        console.error('Error loading dashboard data:', error);
        return throwError(() => new Error('Failed to load dashboard data'));
      })
    );
  }

  private calculateStats(products: Product[], orders: Order[]): FarmerStats {
    // Calculate total revenue and order counts
    let totalRevenue = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        totalRevenue += order.total || 0;
      }
      
      totalOrders++;
      
      switch(order.status) {
        case 'PENDING':
          pendingOrders++;
          break;
        case 'SHIPPED':
          shippedOrders++;
          break;
        case 'DELIVERED':
          deliveredOrders++;
          break;
        case 'CANCELLED':
          cancelledOrders++;
          break;
      }
    });

    // Calculate product statistics
    products.forEach(product => {
      if (product.quantity === 0) {
        outOfStockProducts++;
      } else if (product.quantity < 10) {
        lowStockProducts++;
      }
    });

    return {
      totalProducts: products.length,
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockProducts,
      outOfStockProducts
    };
  }

  private getTopProducts(products: Product[], orders: Order[]): TopProduct[] {
    const productSales = new Map<string, { sold: number; revenue: number }>();

    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        order.items?.forEach(item => {
          const current = productSales.get(item.productId) || { sold: 0, revenue: 0 };
          productSales.set(item.productId, {
            sold: current.sold + item.quantity,
            revenue: current.revenue + (item.price * item.quantity)
          });
        });
      }
    });

    return products
      .map(product => ({
        ...product,
        totalSold: productSales.get(product.id)?.sold || 0,
        revenue: productSales.get(product.id)?.revenue || 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private generateDailySalesTrend(orders: Order[]): DailySalesData[] {
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = orders.filter(order => 
        order.createdAt?.startsWith(date) && order.status !== 'CANCELLED'
      );
      
      return {
        date,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      };
    });
  }

  private generateMonthlySalesTrend(orders: Order[]): MonthlySalesData[] {
    const last6Months = new Array(6).fill(0).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }).reverse();

    return last6Months.map(monthLabel => {
      const [month, year] = monthLabel.split(' ');
      const monthOrders = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate.toLocaleString('default', { month: 'short' }) === month &&
               orderDate.getFullYear().toString() === year &&
               order.status !== 'CANCELLED';
      });

      return {
        month: monthLabel,
        orders: monthOrders.length,
        revenue: monthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      };
    });
  }

  // Product management methods with Cloudinary support
  createProduct(productData: FormData): Observable<Product> {
    const headers = this.getHeaders();
    // Don't set Content-Type for FormData - browser will set it with boundary
    
    return this.http.post<Product>(this.productsApiUrl, productData, { headers }).pipe(
      catchError(error => {
        console.error('Error creating product:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to create product'));
      })
    );
  }

  updateProduct(productId: string, productData: FormData): Observable<Product> {
    const headers = this.getHeaders();
    
    return this.http.patch<Product>(`${this.productsApiUrl}/${productId}`, productData, { headers }).pipe(
      catchError(error => {
        console.error('Error updating product:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to update product'));
      })
    );
  }

  deleteProduct(productId: string): Observable<void> {
    const headers = this.getHeaders();
    
    return this.http.delete<void>(`${this.productsApiUrl}/${productId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error deleting product:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to delete product'));
      })
    );
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    const headers = this.getHeaders();
    
    return this.http.patch<Order>(`${this.ordersApiUrl}/${orderId}`, { status }, { headers }).pipe(
      catchError(error => {
        console.error('Error updating order status:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to update order status'));
      })
    );
  }
}