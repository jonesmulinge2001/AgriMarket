import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../service/product.service';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { Product } from '../../interfaces';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  loading = true;
  error: string | null = null;
  selectedCategory: string = 'all';
  searchQuery: string = '';
  sortOption: string = 'newest';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    
    const productSub = this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.extractCategories();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load products. Please try again.';
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });

    this.subscriptions.add(productSub);
  }

  extractCategories(): void {
    const uniqueCategories = new Set<string>();
    this.products.forEach(product => {
      if (product.category) {
        uniqueCategories.add(product.category);
      } else {
        uniqueCategories.add('Uncategorized');
      }
    });
    this.categories = Array.from(uniqueCategories).sort();
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category === this.selectedCategory || 
        (this.selectedCategory === 'Uncategorized' && !product.category)
      );
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.farmer.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = this.sortProducts(filtered, this.sortOption);

    this.filteredProducts = filtered;
  }

  sortProducts(products: Product[], option: string): Product[] {
    switch (option) {
      case 'price-low':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...products].sort((a, b) => b.price - a.price);
      case 'name':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return [...products].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
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
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.sortOption = 'newest';
    this.applyFilters();
  }

  refreshProducts(): void {
    this.loadProducts();
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
      month: 'short',
      day: 'numeric'
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getImageUrl(imageUrl: string): string {
    // You might want to add a default image if the URL is invalid
    return imageUrl || 'assets/images/default-product.jpg';
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-product.jpg';
  }

  getStockStatus(quantity: number): { text: string; class: string } {
    if (quantity <= 0) {
      return { text: 'Out of Stock', class: 'bg-red-100 text-red-800' };
    } else if (quantity < 10) {
      return { text: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'In Stock', class: 'bg-green-100 text-green-800' };
    }
  }

  trackByProductId(index: number, product: Product): string {
    return product.id;
  }
}