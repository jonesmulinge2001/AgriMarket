import { Component } from '@angular/core';

import { RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { NavbarComponent } from '../../navbar/navbar.component';


@Component({
  selector: 'app-student-layout',
  imports: [RouterModule, CommonModule, SidebarComponent, NavbarComponent],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.css'
})
export class UserLayoutComponent {
  isChatOpen: boolean = false;

  onChatOpened() {
    this.isChatOpen = true;
  }

  onChatClosed() {
    this.isChatOpen = false;
  }

}
