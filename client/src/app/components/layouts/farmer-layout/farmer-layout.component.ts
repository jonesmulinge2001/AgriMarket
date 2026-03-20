import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SideBarComponent } from "../../../farmer/side-bar/side-bar.component";
import { TopBarComponent } from '../../../farmer/top-bar/top-bar.component';

@Component({
  selector: 'app-farmer-layout',
  imports: [RouterModule, CommonModule, SideBarComponent, SideBarComponent, TopBarComponent],
  templateUrl: './farmer-layout.component.html',
  styleUrl: './farmer-layout.component.css'
})
export class FarmerLayoutComponent {

  isCollapsed: boolean = false;
  isDarkMode: boolean = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

}