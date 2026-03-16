import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../service/product.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { Product } from '../../interfaces';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  loading = true;
  error: string | null = null;
  selectedImageIndex = 0;
  quantity = 1;
  relatedProducts: Product[] = [];
  productId: string | null = null; // Changed from private to public
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService 
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadProductDetails(this.productId);
    } else {
      this.error = 'Product ID not found';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadProductDetails(productId: string): void {
    this.loading = true;
    this.error = null;

    const productSub = this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        // Load related products after getting the current product
        if (product.category) {
          this.loadRelatedProducts(product.category, product.id);
        }
      },
      error: (error) => {
        this.error = error.message || 'Failed to load product details';
        this.loading = false;
        console.error('Error loading product:', error);
      }
    });

    this.subscriptions.add(productSub);
  }

  loadRelatedProducts(category: string, currentProductId: string): void {
    const relatedSub = this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Filter products by same category and exclude current product, limit to 4
        this.relatedProducts = products
          .filter(p => p.category === category && p.id !== currentProductId)
          .slice(0, 4);
      },
      error: (error) => {
        console.error('Error loading related products:', error);
      }
    });

    this.subscriptions.add(relatedSub);
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.quantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/product/${this.productId}` } 
      });
      return;
    }
  
    if (this.product && this.quantity <= this.product.quantity) {
      this.cartService.addToCart(this.product, this.quantity);
      
      // Show success message
      alert(`${this.quantity} x ${this.product.name} added to cart!`);
      
      // Optionally navigate to cart
      // this.router.navigate(['/cart']);
    }
  }

  contactFarmer(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/product/${this.productId}` } 
      });
      return;
    }

    // TODO: Implement messaging or redirect to farmer profile
    console.log('Contacting farmer:', this.product?.farmer);
    alert(`Contact farmer: ${this.product?.farmer.email}`);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-product.jpg';
  }

  getImageUrl(imageUrl: string): string {
    return imageUrl || 'assets/images/default-product.jpg';
  }

  getStockStatus(): { text: string; class: string } {
    if (!this.product) {
      return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    }
    
    if (this.product.quantity <= 0) {
      return { text: 'Out of Stock', class: 'bg-red-100 text-red-800' };
    } else if (this.product.quantity < 10) {
      return { text: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'In Stock', class: 'bg-green-100 text-green-800' };
    }
  }

  getStockLevelClass(): string {
    if (!this.product) return 'bg-gray-200';
    
    const percentage = (this.product.quantity / 100) * 100;
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  // Helper method to get the product ID for template
  getCurrentProductId(): string | null {
    return this.productId;
  }
}