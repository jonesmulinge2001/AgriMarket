import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { CreateOrderRequest, Order, UpdateOrderRequest } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/orders';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createOrder(orderData: CreateOrderRequest): Observable<Order> {
    const headers = this.getHeaders();
    
    // Log exactly what's being sent
    console.log('📦 Creating order with payload:', JSON.stringify(orderData, null, 2));
    
    return this.http.post<Order>(this.apiUrl, orderData, { headers }).pipe(
      map(response => {
        console.log('✅ Order created successfully:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error creating order. Full error:', error);
        
        // Log the actual error response from backend
        if (error.error) {
          console.error('📋 Backend error response:', error.error);
          console.error('📋 Backend error message:', error.error.message);
          console.error('📋 Backend status code:', error.error.statusCode);
          
          // If it's a validation error array, log each message
          if (Array.isArray(error.error.message)) {
            console.error('📋 Validation errors:');
            error.error.message.forEach((msg: string, index: number) => {
              console.error(`   ${index + 1}. ${msg}`);
            });
          }
        }
        
        let errorMessage = 'Failed to create order';
        
        if (error.status === 401) {
          errorMessage = 'Please login to place an order';
        } else if (error.status === 400) {
          // Try to extract the actual validation error
          if (error.error?.message) {
            if (Array.isArray(error.error.message)) {
              errorMessage = error.error.message.join('. ');
            } else {
              errorMessage = error.error.message;
            }
          } else {
            errorMessage = 'Invalid order data. Please check your order and try again.';
          }
        } else if (error.status === 404) {
          errorMessage = 'Product not found';
        } else if (error.status === 409) {
          errorMessage = 'Insufficient stock for this order';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  createBulkOrders(orders: CreateOrderRequest[]): Observable<Order[]> {
    const headers = this.getHeaders();
    const requests = orders.map(order => 
      this.http.post<Order>(this.apiUrl, order, { headers }).toPromise()
    );
    
    return new Observable(observer => {
      Promise.all(requests)
        .then(results => {
          console.log('Bulk orders created:', results);
          observer.next(results as Order[]);
          observer.complete();
        })
        .catch(error => {
          console.error('Error creating bulk orders:', error);
          observer.error(new Error('Failed to create one or more orders'));
        });
    });
  }

  getUserOrders(): Observable<Order[]> {
    const headers = this.getHeaders();
    
    return this.http.get<Order[]>(`${this.apiUrl}`, { headers }).pipe(
      map(response => {
        console.log('User orders fetched:', response);
        return response || [];
      }),
      catchError(error => {
        console.error('Error fetching user orders:', error);
        return of([]);
      })
    );
  }

  getOrderById(orderId: string): Observable<Order | null> {
    const headers = this.getHeaders();
    
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`, { headers }).pipe(
      map(response => {
        console.log('Order fetched:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching order:', error);
        return of(null);
      })
    );
  }

/**
 * FOR FARMERS ONLY: Update order status using dedicated endpoint
 */
updateOrderStatusByFarmer(orderId: string, status: string): Observable<Order | null> {
  const headers = this.getHeaders();
  
  // Ensure status is uppercase to match backend enum
  const upperStatus = status.toUpperCase();
  
  // Valid statuses from your backend enum
  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  
  if (!validStatuses.includes(upperStatus)) {
    return throwError(() => new Error(`Invalid status: ${status}`));
  }
  
  const payload = { status: upperStatus };
  
  console.log('Farmer updating order status via dedicated endpoint:', { 
    orderId, 
    status: upperStatus
  });
  
  // Use the new dedicated endpoint
  return this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, payload, { headers }).pipe(
    map(response => {
      console.log('Order status updated successfully via farmer endpoint:', response);
      return response;
    }),
    catchError(error => {
      console.error('Error updating order status via farmer endpoint:', error);
      
      if (error.error?.message) {
        return throwError(() => new Error(error.error.message));
      }
      
      return throwError(() => new Error('Failed to update order status'));
    })
  );
}

  /**
   * FOR USERS ONLY: Update order quantity
   */
  updateOrderQuantity(orderId: string, quantity: number): Observable<Order | null> {
    const headers = this.getHeaders();
    const payload = { quantity };
    
    console.log('User updating order quantity:', { orderId, quantity });
    
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}`, payload, { headers }).pipe(
      map(response => {
        console.log('Order quantity updated successfully:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error updating order quantity:', error);
        
        let errorMessage = 'Failed to update order quantity';
        if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid quantity value';
        } else if (error.status === 401) {
          errorMessage = 'Please login to update orders';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to update this order';
        } else if (error.status === 404) {
          errorMessage = 'Order not found';
        } else if (error.status === 409) {
          errorMessage = 'Insufficient stock for this update';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * FOR ADMINS/USERS: Update both status and quantity (if needed)
   */
  updateOrder(orderId: string, updateData: UpdateOrderRequest): Observable<Order | null> {
    const headers = this.getHeaders();
    
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}`, updateData, { headers }).pipe(
      map(response => {
        console.log('Order updated:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error updating order:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to update order'));
      })
    );
  }

  cancelOrder(orderId: string): Observable<Order | null> {
    return this.updateOrder(orderId, { status: 'CANCELLED' });
  }

  deleteOrder(orderId: string): Observable<void> {
    const headers = this.getHeaders();
    
    return this.http.delete<void>(`${this.apiUrl}/${orderId}`, { headers }).pipe(
      map(() => {
        console.log('Order deleted:', orderId);
      }),
      catchError(error => {
        console.error('Error deleting order:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to delete order'));
      })
    );
  }
}