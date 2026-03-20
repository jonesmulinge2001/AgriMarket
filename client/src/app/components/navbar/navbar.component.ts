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

interface Language {
  code: string;
  name: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

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
  userEmail: string = '';
  userImage: string = '';
  menuOpen: boolean = false;
  unreadCount: number = 0;
  logoutModalOpen: boolean = false;
  searchQuery: string = '';
  loading: boolean = false;
  searchPanelOpen: boolean = false;
  cartItemCount: number = 0;
  currentUrl: string = '';
  
  // Dark Mode
  isDarkMode: boolean = false;
  
  // Language
  currentLanguage: Language = { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' };
  languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', direction: 'ltr' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', direction: 'rtl' }
  ];
  languageMenuOpen: boolean = false;

  window = window;
  
  private socketSub?: Subscription;
  private searchSubject = new Subject<string>();
  private notificationSub?: Subscription;
  private cartSub?: Subscription;

  settingsPanelOpen: boolean = false;
  recentPanelOpen: boolean = false;

  totalUnreadMessages: number = 0;
  
  activeConversationId: string | null = null;
  chatModalOpen: boolean = false;

  @Output() chatOpened = new EventEmitter<void>();
  @Output() chatClosed = new EventEmitter<void>();
  @Output() darkModeToggled = new EventEmitter<boolean>();
  @Output() languageChanged = new EventEmitter<Language>();

  constructor(
    public router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.window = window;
      this.loadThemePreferences();
    }
    
    this.isLoggedIn = this.authService.isLoggedIn();
    
    if (this.isLoggedIn) {
      this.loadUserData();
    }
    
    this.currentUrl = this.router.url;
    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });
    
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

  private loadThemePreferences(): void {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkMode = JSON.parse(savedDarkMode);
      this.applyDarkMode();
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode = prefersDark;
      localStorage.setItem('darkMode', JSON.stringify(prefersDark));
      this.applyDarkMode();
    }

    // Load language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      const lang = this.languages.find(l => l.code === savedLanguage);
      if (lang) {
        this.currentLanguage = lang;
        this.applyLanguage();
      }
    }
  }

  private loadUserData(): void {
    // Load user data from localStorage or service
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.name || 'User';
        this.userEmail = user.email || 'user@example.com';
        this.userImage = user.image || '';
      } catch {
        this.userName = 'User';
        this.userEmail = 'user@example.com';
      }
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    this.applyDarkMode();
    this.darkModeToggled.emit(this.isDarkMode);
    
    // Show toast notification
    this.toastr.success(
      `${this.isDarkMode ? '🌙 Dark' : '☀️ Light'} mode activated`,
      'Theme Changed',
      { timeOut: 2000 }
    );
  }

  private applyDarkMode(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  changeLanguage(language: Language): void {
    this.currentLanguage = language;
    localStorage.setItem('language', language.code);
    this.applyLanguage();
    this.languageMenuOpen = false;
    this.languageChanged.emit(language);
    
    // Show toast notification
    this.toastr.success(
      `Language changed to ${language.name}`,
      '🌐 Language Updated',
      { timeOut: 2000 }
    );
  }

  private applyLanguage(): void {
    document.documentElement.dir = this.currentLanguage.direction;
    document.documentElement.lang = this.currentLanguage.code;
  }

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

  toggleLanguageMenu(): void {
    this.languageMenuOpen = !this.languageMenuOpen;
  }

  viewProfile(): void {
    this.menuOpen = false;
    this.router.navigate(['/my-profile']);
  }

  closeMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    const isInsideSearch = target.closest('.search-container');
    if (!isInsideSearch) {
      this.searchPanelOpen = false;
    }
    
    const isInsideMenu = target.closest('.profile-dropdown-container');
    if (!isInsideMenu && this.menuOpen) {
      this.menuOpen = false;
    }

    const isInsideLanguageMenu = target.closest('.language-dropdown');
    if (!isInsideLanguageMenu && this.languageMenuOpen) {
      this.languageMenuOpen = false;
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
    localStorage.removeItem('user');
    this.logoutModalOpen = false;
    this.router.navigate(['/login']);
  }

  getInitials(): string {
    if (!this.userName) return 'U';
    return this.userName.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}