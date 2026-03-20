import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  imports: [CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent {
  @Input() isDarkMode: boolean = false;
  @Input() sidebarCollapsed: boolean = false;

  @Output() sidebarToggle = new EventEmitter<void>();
  @Output() darkModeToggle = new EventEmitter<void>();
}
