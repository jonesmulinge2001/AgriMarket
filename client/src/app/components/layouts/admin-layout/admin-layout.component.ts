import { Component } from '@angular/core';

import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { SideBarComponent } from '../../../admin/side-bar/side-bar.component';
import { TopBarComponent } from '../../../admin/top-bar/top-bar.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterModule, CommonModule, TopBarComponent, SideBarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  isCollapsed: boolean = false;
  isDarkMode: boolean = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

}
