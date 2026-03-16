import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent {
  @Input() isDarkMode: boolean = false;
  @Input() sidebarCollapsed: boolean = false;

  @Output() darkModeToggle = new EventEmitter<void>();
  @Output() sidebarToggle = new EventEmitter<void>();

  onDarkModeToggle(): void {
    this.darkModeToggle.emit();
  }

  onSidebarToggle(): void {
    this.sidebarToggle.emit();
  }
}
