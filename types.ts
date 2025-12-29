
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  password?: string;
  orgCode: string; // Código que vincula o usuário a uma "instância" de inventário
}

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  costPrice: number;
  margin: number;
  suggestedPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStock: number;
  dateAdded: string;
  notes: string;
  orgCode: string; // Vincula o produto à organização
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  timestamp: string;
  sellerEmail: string;
  orgCode: string; // Vincula a venda à organização
}

export type ViewType = 'dashboard' | 'products' | 'sales' | 'stock' | 'users' | 'login';

export interface AppState {
  currentUser: User | null;
  products: Product[];
  sales: Sale[];
  users: User[];
  currentView: ViewType;
}
