import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  roles = [
    { value: 'USER', label: 'User', icon: 'person' },
    { value: 'FARMER', label: 'Farmer', icon: 'agriculture' },
    { value: 'ADMIN', label: 'Admin', icon: 'admin_panel_settings' }
  ];

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^(?:\+254|0)?7\d{8}$/)],
      ],
      role: ['USER', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authService.handleRegister(this.registerForm.value);
  }

  toggleVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!control?.invalid && control?.touched;
  }

  // Add these methods to your RegisterComponent class

getSelectedRoleIcon(): string {
  const selectedRole = this.registerForm.get('role')?.value;
  const role = this.roles.find(r => r.value === selectedRole);
  return role ? role.icon : 'person';
}

getSelectedRoleLabel(): string {
  const selectedRole = this.registerForm.get('role')?.value;
  const role = this.roles.find(r => r.value === selectedRole);
  return role ? role.label : 'User';
}

}