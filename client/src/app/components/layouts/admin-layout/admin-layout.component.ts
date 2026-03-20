import { Component } from '@angular/core';
import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { TopBarComponent } from '../../../admin/top-bar/top-bar.component';
import { SuperAdminSidebarComponent } from '../../../admin/side-bar/side-bar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, CommonModule, SuperAdminSidebarComponent, TopBarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  isCollapsed: boolean = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}