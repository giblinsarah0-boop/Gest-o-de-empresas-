
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Boxes, 
  Users, 
  LogOut,
  Bell
} from 'lucide-react';
import { User, UserRole, ViewType } from '../types';

interface LayoutProps {
  user: User;
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onLogout: () => void;
  children: React.ReactNode;
  lowStockCount: number;
}

const Layout: React.FC<LayoutProps> = ({ user, currentView, setView, onLogout, children, lowStockCount }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN] },
    { id: 'products', label: 'Produtos', icon: <Package size={20} />, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { id: 'sales', label: 'Vendas', icon: <ShoppingCart size={20} />, roles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
    { id: 'stock', label: 'Estoque', icon: <Boxes size={20} />, roles: [UserRole.ADMIN] },
    { id: 'users', label: 'Usuários', icon: <Users size={20} />, roles: [UserRole.ADMIN] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">OmniStock <span className="text-white">v1.0</span></h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Enterprise ERP</p>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-400">Logado como:</p>
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${user.role === UserRole.ADMIN ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
              {user.role}
            </span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {menuItems.find(i => i.id === currentView)?.label || currentView}
          </h2>
          
          <div className="flex items-center gap-4">
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 animate-pulse">
                <Bell size={16} />
                <span className="text-xs font-bold">{lowStockCount} Alertas de Estoque</span>
              </div>
            )}
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
