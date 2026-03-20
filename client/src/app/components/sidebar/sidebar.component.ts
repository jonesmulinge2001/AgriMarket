import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  showSidebar = true;
  showLogoutModal = false;

  navItems = [
    { 
      label: 'Products', 
      link: '/home', 
      icon: 'dynamic_feed',
      description: 'Browse all products'
    },
    { 
      label: 'Dashboard', 
      link: '/farmer-dashboard', 
      icon: 'dashboard',
      description: 'Farmer analytics'
    },
    { 
      label: 'Cart', 
      link: '/cart', 
      icon: 'shopping_cart',
      description: 'View your cart'
    },
    { 
      label: 'Orders', 
      link: '/my-orders', 
      icon: 'receipt',
      description: 'Track your orders'
    }
  ];

  userInfo = {
    name: 'John Farmer',
    email: 'farmer@example.com',
    role: 'FARMER'
  };

  getIconGradient(label: string): string {
    const gradients: { [key: string]: string } = {
      'Products': 'from-green-400 to-blue-500',
      'Dashboard': 'from-purple-400 to-pink-500',
      'Cart': 'from-yellow-400 to-orange-500',
      'Orders': 'from-blue-400 to-indigo-500'
    };
  
    const gradient = gradients[label] || 'from-gray-500 to-gray-700';
    return `bg-gradient-to-r ${gradient}`;
  }

  getIconBackground(label: string): string {
    const backgrounds: { [key: string]: string } = {
      'Products': 'bg-gradient-to-r from-green-100 to-blue-100',
      'Dashboard': 'bg-gradient-to-r from-purple-100 to-pink-100',
      'Cart': 'bg-gradient-to-r from-yellow-100 to-orange-100',
      'Orders': 'bg-gradient-to-r from-blue-100 to-indigo-100'
    };
  
    return backgrounds[label] || 'bg-gray-100';
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.showSidebar = window.innerWidth >= 768;
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.showSidebar = event.target.innerWidth >= 768;
  }
  
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
    this.closeLogoutModal();
  }
}