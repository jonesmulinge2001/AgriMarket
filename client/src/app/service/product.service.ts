import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Product } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/products';

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

  getAllProducts(): Observable<Product[]> {
    const headers = this.getHeaders();
    
    return this.http.get<Product[]>(this.apiUrl, { headers }).pipe(
      map(response => {
        console.log('Products fetched:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching products:', error);
        let errorMessage = 'Failed to load products';
        
        if (error.status === 401) {
          errorMessage = 'Please login to view products';
          this.authService.logout(); // Optional: redirect to login
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to view products';
        } else if (error.status === 404) {
          errorMessage = 'Products not found';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // getProductById(productId: string): Observable<Product> {
  //   const headers = this.getHeaders();
    
  //   return this.http.get<Product>(`${this.apiUrl}/${productId}`, { headers }).pipe(
  //     catchError(error => {
  //       console.error('Error fetching product:', error);
  //       return throwError(() => new Error(error.error?.message || 'Failed to load product'));
  //     })
  //   );
  // }

  getProductsByFarmer(farmerId: string): Observable<Product[]> {
    const headers = this.getHeaders();
    
    return this.http.get<Product[]>(`${this.apiUrl}/farmer/${farmerId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching farmer products:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to load farmer products'));
      })
    );
  }

  // Add this method to your existing ProductService

getProductById(productId: string): Observable<Product> {
  const headers = this.getHeaders();
  
  return this.http.get<Product>(`${this.apiUrl}/${productId}`, { headers }).pipe(
    map(response => {
      console.log('Product fetched:', response);
      return response;
    }),
    catchError(error => {
      console.error('Error fetching product:', error);
      let errorMessage = 'Failed to load product';
      
      if (error.status === 401) {
        errorMessage = 'Please login to view product details';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to view this product';
      } else if (error.status === 404) {
        errorMessage = 'Product not found';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      
      return throwError(() => new Error(errorMessage));
    })
  );
}
}