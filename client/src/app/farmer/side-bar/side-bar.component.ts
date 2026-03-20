import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent {
  @Input() isCollapsed: boolean = false;
  @Input() isDarkMode: boolean = false;
  @Input() activeTab: string = 'overview';
  @Output() tabChange = new EventEmitter<string>();

  showLogoutModal: boolean = false;

  constructor(private router: Router) {}

  setActiveTab(tab: string): void {
    this.tabChange.emit(tab);
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  confirmLogout(): void {
    // clear auth data
    localStorage.clear();

    // redirect to login
    this.router.navigate(['/login']);

    this.closeLogoutModal();
  }
}