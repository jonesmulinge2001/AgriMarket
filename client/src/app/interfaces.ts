export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'ADMIN' | 'STUDENT';
  }
  
  export interface RegisterResponse {
    message: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    };
  }
  
  export interface VerifyEmailRequest {
    email: string;
    code: string;
  }
  
  export interface GenericResponse {
    message: string;
  }
  
  export interface ResetPasswordRequest {
    email: string;
    code: string;
    password: string;
  }
  

  export interface Farmer {
    id: string;
    name: string;
    email: string;
  }
  
  export interface Product {
    id: string;
    name: string;
    description: string;
    category: string | null;
    quantity: number;
    price: number;
    imageUrl: string;
    farmerId: string;
    createdAt: string;
    farmer: Farmer;
  }
  
  export interface ProductsResponse {
    success: boolean;
    data: Product[];
    message?: string;
  }

  // Add this to your existing interfaces
export interface ProductDetailResponse {
  success: boolean;
  data: Product;
  message?: string;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Order {
  id: string;
  buyerId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  buyer?: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone: string | null;
    status: string;
  };
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface CreateOrderRequest {
  productId: string;
  quantity: number;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  quantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

export interface CartSummary {
  subtotal: number;
  totalItems: number;
  selectedItems: number;
  selectedTotal: number;
}

export interface FarmerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  imageUrl: string;
}

export interface DailySalesData {
  date: string;
  orders: number;
  revenue: number;
}

export interface MonthlySalesData {
  month: string;
  orders: number;
  revenue: number;
}

export interface TopProduct extends Product {
  totalSold: number;
  revenue: number;
}

export interface FarmerDashboardData {
  stats: FarmerStats;
  recentOrders: Order[];
  topProducts: TopProduct[];
  salesTrend: DailySalesData[];
  monthlyTrend: MonthlySalesData[];
  products: Product[];
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// Then update your User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  phone?: string;
  isVerified?: boolean;
  createdAt?: string;
  profile?: {
    profileImage?: string;
    institution?: {
      id: string;
      name: string;
    };
  };
}