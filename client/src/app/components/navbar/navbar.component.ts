import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, EventEmitter, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common'; 
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  userName: string = '';
  userImage: string = '';
  menuOpen: boolean = false;
  unreadCount: number = 0;
  logoutModalOpen: boolean = false;
  searchQuery: string = '';
  loading: boolean = false;
  searchPanelOpen: boolean = false;
  cartItemCount: number = 0;
  currentUrl: string = ''; // Add this to track current URL

  window = window;
  
  private socketSub?: Subscription;
  private searchSubject = new Subject<string>();
  private notificationSub?: Subscription;
  private cartSub?: Subscription;

  settingsPanelOpen: boolean = false;
  recentPanelOpen: boolean = false;

  // Add computed properties
  totalUnreadMessages: number = 0;
  
  // Chat modal properties
  activeConversationId: string | null = null;
  chatModalOpen: boolean = false;

  @Output() chatOpened = new EventEmitter<void>();
  @Output() chatClosed = new EventEmitter<void>();

  // Make router public or create a getter
  constructor(
    public router: Router, // Change from private to public
    private authService: AuthService,
    private toastr: ToastrService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.window = window;
    }
    this.isLoggedIn = this.authService.isLoggedIn();
    
    // Track current URL
    this.currentUrl = this.router.url;
    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });
    
    // Subscribe to cart count changes
    if (this.isLoggedIn) {
      this.cartSub = this.cartService.getCartCount().subscribe(count => {
        this.cartItemCount = count;
      });
    }
    
    document.addEventListener('click', this.closeMenuOnOutsideClick.bind(this));
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
    this.notificationSub?.unsubscribe();
    this.cartSub?.unsubscribe();
    document.removeEventListener('click', this.closeMenuOnOutsideClick.bind(this));
  }

  // Add a method to check if current route is cart
  isCartActive(): boolean {
    return this.router.url === '/cart';
  }

  toggleSearchPanel(): void {
    this.searchPanelOpen = !this.searchPanelOpen;
    if (this.searchPanelOpen && this.searchQuery.trim()) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  closeSearchPanel(): void {
    this.searchPanelOpen = false;
  }

  viewAllResults(): void {
    this.closeSearchPanel();
    this.router.navigate(['/search'], { 
      queryParams: { q: this.searchQuery } 
    });
  }

  onSearchItemClick(): void {
    this.closeSearchPanel();
    this.searchQuery = '';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  viewProfile(): void {
    this.menuOpen = false;
    this.router.navigate(['/my-profile']);
  }

  closeMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Close search panel if clicking outside
    const isInsideSearch = target.closest('.search-container');
    if (!isInsideSearch) {
      this.searchPanelOpen = false;
    }
    
    // Close menu if clicking outside
    const isInsideMenu = target.closest('.profile-dropdown-container');
    if (!isInsideMenu && this.menuOpen) {
      this.menuOpen = false;
    }
  }

  openLogoutModal(): void {
    this.menuOpen = false;
    this.logoutModalOpen = true;
  }

  navigateToProfile(profileId: string) {
    this.router.navigate(['/profile', profileId]);
  }

  navigateToPost(postId: string) {
    this.router.navigate(['/posts', postId]);
  }

  navigateToResource(resourceId: string) {
    this.router.navigate(['/resources']); 
  }

  toggleSettingsPanel() {
    this.settingsPanelOpen = !this.settingsPanelOpen;
  }

  closeSettingsPanel() {
    this.settingsPanelOpen = false;
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  viewOrders(): void {
    this.menuOpen = false;
    this.router.navigate(['/my-orders']);
  }

  logOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    this.logoutModalOpen = false;
    this.router.navigate(['/login']);
  }
}