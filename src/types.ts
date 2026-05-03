export type Page = 'home' | 'recharge' | 'login' | 'register' | 'add_money' | 'my_orders' | 'profile' | 'my_codes' | 'admin';

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  icon: string;
  category: string;
  server: string;
}

export interface RechargeOption {
  id: string;
  name: string;
  price: number;
  subText: string;
}

export interface PackageConfig {
  id: string;
  name: string;
  price: number;
  serverAmount: string;
}

export interface GlobalConfig {
  banners: string[];
  productName: string;
  productIcon: string;
  productLogo?: string;
  notice?: string;
  packages: PackageConfig[];
  apiKey: string;
  providerName: string;
  apiUrl: string;
  isAdminDarkMode: boolean;
  rupantorApiKey: string;
  rupantorApiUrl: string;
  rupantorVerifyUrl: string;
  siteDomain: string;
  showRecentOrders?: boolean;
  supportLink?: string;
  offersLink?: string;
  maintenanceMode?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  type: 'recharge' | 'add_money';
  packageName?: string;
  createdAt: any;
  metadata?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  balance: number;
  isAdmin?: boolean;
}
