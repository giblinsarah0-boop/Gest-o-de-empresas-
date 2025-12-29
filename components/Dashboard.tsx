
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Product, Sale, UserRole } from '../types';
import { TrendingUp, ShoppingBag, Package, Users } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  usersCount: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ products, sales, usersCount }) => {
  const totalRevenue = useMemo(() => sales.reduce((acc, s) => acc + s.total, 0), [sales]);
  const lowStockProducts = useMemo(() => products.filter(p => p.stockQuantity <= p.minStock), [products]);

  const salesByProductData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(s => {
      map.set(s.productName, (map.get(s.productName) || 0) + s.total);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sales]);

  const salesOverTime = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(s => {
      const date = s.timestamp.split('T')[0];
      map.set(date, (map.get(date) || 0) + s.total);
    });
    return Array.from(map.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Receita Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">R$ {totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Vendas Realizadas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sales.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Package size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Itens em Estoque</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{products.reduce((acc, p) => acc + p.stockQuantity, 0)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Users size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Usuários Ativos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{usersCount}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="font-semibold text-gray-800 mb-6">Faturamento por Produto (Top 5)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={salesByProductData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="font-semibold text-gray-800 mb-6">Evolução de Vendas</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800">Alertas de Reposição Crítica</h3>
          <p className="text-sm text-gray-500">Produtos que atingiram o estoque mínimo configurado</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Estoque Atual</th>
                <th className="px-6 py-4">Mínimo</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lowStockProducts.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-red-600 font-bold">{p.stockQuantity}</td>
                  <td className="px-6 py-4 text-gray-600">{p.minStock}</td>
                  <td className="px-6 py-4">
                    <span className="flex justify-center">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Abaixo do Mínimo</span>
                    </span>
                  </td>
                </tr>
              ))}
              {lowStockProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">Nenhum produto em nível crítico.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
