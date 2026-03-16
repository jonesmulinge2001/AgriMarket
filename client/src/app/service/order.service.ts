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
    
    return this.http.post<Order>(this.apiUrl, orderData, { headers }).pipe(
      map(response => {
        console.log('Order created:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error creating order:', error);
        let errorMessage = 'Failed to create order';
        
        if (error.status === 401) {
          errorMessage = 'Please login to place an order';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Invalid order data';
        } else if (error.status === 404) {
          errorMessage = 'Product not found';
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
        // Ensure we always return an array, even if response is null
        return response || [];
      }),
      catchError(error => {
        console.error('Error fetching user orders:', error);
        // Return empty array on error instead of throwing
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