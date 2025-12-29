
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, User, Product, Sale, ViewType, UserRole } from './types';
import { INITIAL_USERS, INITIAL_PRODUCTS, CATEGORIES } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { 
  Search, Plus, Trash2, Edit3, Save, X, Scan, 
  DollarSign, AlertTriangle, Package, ShoppingCart,
  UserPlus, LogIn, Mail, Lock, User as UserIcon,
  Key, ShieldCheck, Copy, Tag, Hash, Boxes, Users,
  MinusCircle, PlusCircle, Filter, RefreshCw
} from 'lucide-react';
import { getAIPricingAdvice } from './services/geminiService';

const App: React.FC = () => {
  // Helper to calculate suggested price based on cost and margin
  const calculateSuggestedPrice = (cost: number | undefined, margin: number | undefined) => {
    const c = Number(cost) || 0;
    const m = Number(margin) || 0;
    return c * (1 + (m / 100));
  };

  // Persistência com LocalStorage
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('omnistock_v4_storage');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, currentView: 'login', currentUser: null };
      } catch (e) {
        console.error("Erro ao carregar dados salvos", e);
      }
    }
    const defaultOrg = 'OMNI-DEMO';
    return {
      currentUser: null,
      products: INITIAL_PRODUCTS.map(p => ({ ...p, orgCode: defaultOrg })),
      sales: [],
      users: INITIAL_USERS.map(u => ({ ...u, orgCode: defaultOrg })),
      currentView: 'login'
    };
  });

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [authOrgCode, setAuthOrgCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [newSale, setNewSale] = useState<Partial<Sale>>({ quantity: 1 });
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    const { currentUser, currentView, ...toSave } = state;
    localStorage.setItem('omnistock_v4_storage', JSON.stringify(toSave));
  }, [state]);

  const orgProducts = useMemo(() => 
    state.products.filter(p => p.orgCode === state.currentUser?.orgCode)
  , [state.products, state.currentUser]);

  const orgSales = useMemo(() => 
    state.sales.filter(s => s.orgCode === state.currentUser?.orgCode)
  , [state.sales, state.currentUser]);

  const orgUsers = useMemo(() => 
    state.users.filter(u => u.orgCode === state.currentUser?.orgCode)
  , [state.users, state.currentUser]);

  const lowStockCount = useMemo(() => 
    orgProducts.filter(p => p.stockQuantity <= p.minStock).length
  , [orgProducts]);

  const filteredProducts = useMemo(() => 
    orgProducts.filter(p => 
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery)) &&
      (stockFilter === 'all' || 
       (stockFilter === 'low' && p.stockQuantity <= p.minStock && p.stockQuantity > 0) ||
       (stockFilter === 'out' && p.stockQuantity <= 0))
    )
  , [orgProducts, searchQuery, stockFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    const user = state.users.find(u => u.email.toLowerCase() === authEmail.toLowerCase());
    if (user && user.active) {
      setState(prev => ({ 
        ...prev, 
        currentUser: user, 
        currentView: user.role === UserRole.ADMIN ? 'dashboard' : 'products' 
      }));
    } else if (user && !user.active) {
      alert("Usuário inativo.");
    } else {
      alert("Usuário não encontrado.");
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authName) return;
    let finalOrgCode = authOrgCode.toUpperCase().trim();
    if (authRole === UserRole.ADMIN && !finalOrgCode) {
      finalOrgCode = `ORG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    } else if (authRole === UserRole.EMPLOYEE && !finalOrgCode) {
      alert("Código de organização é obrigatório.");
      return;
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: authEmail,
      name: authName,
      role: authRole,
      active: true,
      orgCode: finalOrgCode
    };
    setState(prev => ({ ...prev, users: [...prev.users, newUser], currentUser: newUser, currentView: newUser.role === UserRole.ADMIN ? 'dashboard' : 'products' }));
  };

  const handleLogout = () => setState(prev => ({ ...prev, currentUser: null, currentView: 'login' }));

  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct?.barcode || !state.currentUser) return;
    const cost = Number(editingProduct.costPrice) || 0;
    const margin = Number(editingProduct.margin) || 0;
    const suggested = calculateSuggestedPrice(cost, margin);
    const productData: Product = {
      id: editingProduct.id || Math.random().toString(36).substr(2, 9),
      name: editingProduct.name,
      category: editingProduct.category || CATEGORIES[0],
      barcode: editingProduct.barcode,
      costPrice: cost,
      margin: margin,
      suggestedPrice: suggested,
      sellingPrice: Number(editingProduct.sellingPrice) || suggested,
      stockQuantity: Number(editingProduct.stockQuantity) || 0,
      minStock: Number(editingProduct.minStock) || 0,
      notes: editingProduct.notes || '',
      dateAdded: editingProduct.dateAdded || new Date().toISOString(),
      orgCode: state.currentUser.orgCode
    };
    setState(prev => ({ ...prev, products: editingProduct.id ? prev.products.map(p => p.id === editingProduct.id ? productData : p) : [...prev.products, productData] }));
    setIsModalOpen(false); setEditingProduct(null);
  };

  const handleAdjustStock = (productId: string, amount: number) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + amount) } : p
      )
    }));
  };

  const handleRegisterSale = () => {
    const product = orgProducts.find(p => p.id === newSale.productId);
    if (!product || !newSale.quantity || newSale.quantity > product.stockQuantity || !state.currentUser) {
      alert("Erro na venda ou estoque insuficiente.");
      return;
    }
    const sale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      productName: product.name,
      quantity: newSale.quantity,
      unitPrice: newSale.unitPrice || product.sellingPrice,
      total: (newSale.quantity || 0) * (newSale.unitPrice || product.sellingPrice),
      timestamp: new Date().toISOString(),
      sellerEmail: state.currentUser.email,
      orgCode: state.currentUser.orgCode
    };
    setState(prev => ({ ...prev, sales: [...prev.sales, sale], products: prev.products.map(p => p.id === product.id ? { ...p, stockQuantity: p.stockQuantity - newSale.quantity! } : p) }));
    setIsModalOpen(false); setNewSale({ quantity: 1 });
  };

  if (state.currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 text-white">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Package className="text-blue-500 mx-auto mb-4" size={50} />
            <h1 className="text-3xl font-bold">OmniStock</h1>
            <p className="text-slate-400">Entre no seu sistema de gestão</p>
          </div>
          <form onSubmit={isSigningUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSigningUp && (
              <input required className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4" placeholder="Nome" value={authName} onChange={(e) => setAuthName(e.target.value)} />
            )}
            <input required type="email" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
            {isSigningUp && (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setAuthRole(UserRole.EMPLOYEE)} className={`py-3 rounded-xl border font-bold ${authRole === UserRole.EMPLOYEE ? 'bg-blue-600' : 'text-slate-400'}`}>Funcionário</button>
                <button type="button" onClick={() => setAuthRole(UserRole.ADMIN)} className={`py-3 rounded-xl border font-bold ${authRole === UserRole.ADMIN ? 'bg-amber-600' : 'text-slate-400'}`}>Admin</button>
              </div>
            )}
            <input required className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4" placeholder="Código da Organização" value={authOrgCode} onChange={(e) => setAuthOrgCode(e.target.value)} />
            <button type="submit" className="w-full py-4 rounded-xl font-bold bg-blue-600 shadow-lg">{isSigningUp ? 'Criar Conta' : 'Acessar'}</button>
          </form>
          <button onClick={() => setIsSigningUp(!isSigningUp)} className="w-full mt-4 text-blue-400 text-sm font-bold">{isSigningUp ? 'Já tenho conta' : 'Criar nova organização'}</button>
        </div>
      </div>
    );
  }

  return (
    <Layout user={state.currentUser!} currentView={state.currentView} setView={(v) => setState(p => ({...p, currentView: v}))} onLogout={handleLogout} lowStockCount={lowStockCount}>
      
      {state.currentView === 'dashboard' && <Dashboard products={orgProducts} sales={orgSales} usersCount={orgUsers.length} />}
      
      {(state.currentView === 'products' || state.currentView === 'stock') && (
        <div className="space-y-6 text-black">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Pesquisar..." className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            {state.currentView === 'stock' && (
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setStockFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${stockFilter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>Tudo</button>
                <button onClick={() => setStockFilter('low')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${stockFilter === 'low' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}>Reposição</button>
                <button onClick={() => setStockFilter('out')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${stockFilter === 'out' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}>Esgotado</button>
              </div>
            )}

            <div className="flex gap-2">
              {state.currentUser?.role === UserRole.ADMIN && state.currentView === 'products' && (
                <button onClick={() => { setEditingProduct({ category: CATEGORIES[0] }); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus size={20}/> Novo Item</button>
              )}
              <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><ShoppingCart size={20}/> Venda</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b text-[10px] font-bold uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Quantidade</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.barcode}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{p.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {state.currentView === 'stock' && (
                          <button onClick={() => handleAdjustStock(p.id, -1)} className="text-gray-400 hover:text-red-500"><MinusCircle size={18}/></button>
                        )}
                        <span className={`font-black text-lg ${p.stockQuantity <= p.minStock ? 'text-red-600' : 'text-gray-900'}`}>{p.stockQuantity}</span>
                        {state.currentView === 'stock' && (
                          <button onClick={() => handleAdjustStock(p.id, 1)} className="text-gray-400 hover:text-blue-500"><PlusCircle size={18}/></button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.stockQuantity <= 0 ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Esgotado</span>
                      ) : p.stockQuantity <= p.minStock ? (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Baixo Estoque</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Normal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {state.currentUser?.role === UserRole.ADMIN && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                          {state.currentView === 'products' && (
                             <button onClick={() => { if(confirm("Remover?")) setState(pr => ({...pr, products: pr.products.filter(x => x.id !== p.id)})) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {state.currentView === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-black">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="text-blue-600"/> Membros da Organização ({orgUsers.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.role === UserRole.ADMIN ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-500 shadow-blue-200'} shadow-lg`}>
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <p className="text-[10px] text-gray-500">{u.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${u.role === UserRole.ADMIN ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-black border border-white/20">
            {editingProduct ? (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-2"><Package className="text-blue-600"/> {editingProduct.id ? 'Editar' : 'Novo'} Item</h3>
                  <button onClick={() => { setIsModalOpen(false); setEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl" placeholder="Nome" value={editingProduct.name || ''} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                    <input className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-mono" placeholder="Código de Barras" value={editingProduct.barcode || ''} onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" placeholder="Custo (R$)" value={editingProduct.costPrice || ''} onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })} />
                      <input type="number" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" placeholder="Margem (%)" value={editingProduct.margin || ''} onChange={(e) => setEditingProduct({ ...editingProduct, margin: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Preço Sugerido</p>
                      <p className="text-2xl font-black text-blue-700">R$ {calculateSuggestedPrice(editingProduct.costPrice, editingProduct.margin).toFixed(2)}</p>
                    </div>
                    <input type="number" className="w-full px-4 py-4 border-2 border-emerald-500 rounded-xl font-bold text-xl text-emerald-700" placeholder="Venda Final" value={editingProduct.sellingPrice || ''} onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" placeholder="Estoque Inicial" value={editingProduct.stockQuantity || 0} onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })} />
                      <input type="number" className="w-full px-4 py-3 bg-gray-50 border rounded-xl" placeholder="Mínimo Alerta" value={editingProduct.minStock || 0} onChange={(e) => setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveProduct} className="w-full mt-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={20}/> Salvar Dados</button>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="text-emerald-600"/> Venda Rápida</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                  <select className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={newSale.productId || ''} onChange={(e) => {
                    const prod = orgProducts.find(p => p.id === e.target.value);
                    setNewSale({ ...newSale, productId: e.target.value, unitPrice: prod?.sellingPrice });
                  }}>
                    <option value="">Selecione o Produto...</option>
                    {orgProducts.map(p => <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>{p.name} (Disp: {p.stockQuantity})</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" min="1" className="w-full px-4 py-4 bg-gray-50 border rounded-xl text-center text-xl font-bold" value={newSale.quantity || ''} onChange={(e) => setNewSale({ ...newSale, quantity: Number(e.target.value) })} />
                    <div className="bg-emerald-50 rounded-2xl flex flex-col items-center justify-center border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Total</p>
                      <p className="text-2xl font-black text-emerald-700">R$ {((newSale.quantity || 0) * (newSale.unitPrice || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={handleRegisterSale} className="w-full py-6 bg-emerald-600 text-white font-black text-xl rounded-2xl shadow-xl transition-all active:scale-95">Confirmar Baixa de Estoque</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
