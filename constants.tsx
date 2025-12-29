
import { Product, User, UserRole, Sale } from './types';

// Adding the mandatory orgCode to initial state definitions
export const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@omnistock.com', name: 'Administrador Global', role: UserRole.ADMIN, active: true, orgCode: 'OMNI-DEMO' },
  { id: '2', email: 'vendedor@omnistock.com', name: 'Vendedor João', role: UserRole.EMPLOYEE, active: true, orgCode: 'OMNI-DEMO' },
  { id: '3', email: 'inativo@omnistock.com', name: 'Ex-Funcionário', role: UserRole.EMPLOYEE, active: false, orgCode: 'OMNI-DEMO' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Teclado Mecânico RGB',
    category: 'Periféricos',
    barcode: '789123456001',
    costPrice: 150.00,
    margin: 40,
    suggestedPrice: 210.00,
    sellingPrice: 220.00,
    stockQuantity: 15,
    minStock: 5,
    dateAdded: '2023-10-01',
    notes: 'Produto de alta rotatividade',
    orgCode: 'OMNI-DEMO'
  },
  {
    id: 'p2',
    name: 'Monitor 24" 144Hz',
    category: 'Monitores',
    barcode: '789123456002',
    costPrice: 800.00,
    margin: 30,
    suggestedPrice: 1040.00,
    sellingPrice: 1100.00,
    stockQuantity: 4,
    minStock: 5, // Alerta!
    dateAdded: '2023-11-15',
    notes: 'Estoque crítico',
    orgCode: 'OMNI-DEMO'
  }
];

export const CATEGORIES = ['Eletrônicos', 'Periféricos', 'Monitores', 'Hardware', 'Acessórios'];
