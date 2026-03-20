import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { AdminLayoutComponent } from './components/layouts/admin-layout/admin-layout.component';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './components/home/home.component';
import { UserLayoutComponent } from './components/layouts/user-layout/user-layout.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { CartComponent } from './components/cart/cart.component';
import { MyOrdersComponent } from './components/my-orders/my-orders.component';
import { FarmerLayoutComponent } from './components/layouts/farmer-layout/farmer-layout.component';
import { FarmerDashboardComponent } from './farmer/farmer-dashboard/farmer-dashboard.component';
import { AdminDashboardComponent } from './admin/dashboard/dashboard.component';

export const routes: Routes = [
      // ==== Public routes (no layout) ====
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

      // ==== Student routes ====
  {
    path: '',
    component: UserLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'product/:id', component: ProductDetailComponent },
      { path: 'cart', component: CartComponent },
      { path: 'my-orders', component: MyOrdersComponent },

    ]
  },
  
  // ==== Super Admin routes ====
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
    ]
  },

    // ==== Admin routes ====
    {
      path: 'farmer',
      component: FarmerLayoutComponent,
      canActivate: [AuthGuard],
      children: [
        { path: 'dashboard', component: FarmerDashboardComponent},
      ]
    },

];
