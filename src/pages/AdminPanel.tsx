import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Globe, 
  Save, 
  Lock,
  Layout,
  Database,
  CheckCircle,
  FileCode,
  Users,
  ShoppingCart,
  TrendingUp,
  Package,
  Cpu,
  Menu,
  X,
  Plus,
  Trash2,
  Moon,
  Sun,
  Server,
  Zap,
  Wallet,
  Settings,
  Bell,
  MessageSquare,
  Gift,
  Search,
  Minus,
  Edit2,
  Clock
} from 'lucide-react';
import { Page, GlobalConfig, PackageConfig, UserProfile, Order } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, increment, onSnapshot, orderBy, limit } from 'firebase/firestore';

interface AdminPanelProps {
  onNavigate: (page: Page) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  config: GlobalConfig;
  onUpdateConfig: (newConfig: GlobalConfig) => void;
  user?: UserProfile | null;
}

type AdminTab = 'dashboard' | 'products' | 'users' | 'server' | 'ui' | 'payments';

export default function AdminPanel({ onNavigate, showToast, config, onUpdateConfig, user: currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingBalance, setIsEditingBalance] = useState<{ uid: string, amount: number } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [localConfig, setLocalConfig] = useState<GlobalConfig>({ ...config });

  useEffect(() => {
    if (!currentUser?.isAdmin) return;

    // Fetch Stats
    const fetchUsers = async () => {
      const userSnap = await getDocs(collection(db, 'users'));
      setAllUsers(userSnap.docs.map(d => d.data() as UserProfile));
    };
    fetchUsers();

    // Listen to recent orders
    const qOrder = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
    const unsubOrders = onSnapshot(qOrder, (snap) => {
      setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => {
      console.error("Admin Orders Listener Error:", error);
    });

    return () => unsubOrders();
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), localConfig);
      onUpdateConfig(localConfig);
      showToast('🚀 System Configuration Updated!', 'success');
    } catch (e) {
      showToast('❌ Error saving configuration', 'error');
    }
  };

  const handleUpdateBalance = async (uid: string, delta: number, isAbsolute: boolean = false) => {
    try {
      const userRef = doc(db, 'users', uid);
      if (isAbsolute) {
        await updateDoc(userRef, { balance: delta });
        showToast('✅ Balance Set Successfully', 'success');
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, balance: delta } : u));
      } else {
        await updateDoc(userRef, { balance: increment(delta) });
        showToast(`✅ Balance ${delta > 0 ? 'Added' : 'Subtracted'} Successfully`, 'success');
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, balance: u.balance + delta } : u));
      }
      setIsEditingBalance(null);
    } catch (e) {
      showToast('❌ Error updating balance', 'error');
    }
  };

  const addPackage = () => {
    const newPkg: PackageConfig = {
      id: Date.now().toString(),
      name: 'NEW PACKAGE',
      price: 10,
      serverAmount: '10'
    };
    setLocalConfig({
      ...localConfig,
      packages: [...localConfig.packages, newPkg]
    });
  };

  const removePackage = (id: string) => {
    setLocalConfig({
      ...localConfig,
      packages: localConfig.packages.filter(p => p.id !== id)
    });
  };

  const updatePackage = (id: string, updates: Partial<PackageConfig>) => {
    setLocalConfig({
      ...localConfig,
      packages: localConfig.packages.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex flex-col min-h-screen px-4 items-center justify-center bg-slate-900 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-600/40">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter">ACCESS DENIED</h1>
          <p className="text-slate-400 text-xs mt-3 uppercase tracking-widest font-bold">Administrator authorization required</p>
          <button onClick={() => onNavigate('home')} className="mt-8 text-blue-500 font-black flex items-center gap-2 mx-auto uppercase text-xs">
            <ArrowLeft size={16} /> Public Gateway
          </button>
        </motion.div>
      </div>
    );
  }

  const isDark = localConfig.isAdminDarkMode;
  const bgMain = isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900';
  const bgCard = isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textHeading = isDark ? 'text-slate-100' : 'text-slate-800';

  const SidebarItem = ({ id, icon: Icon, label }: { id: AdminTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 font-black' 
          : `${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'} font-bold`
      }`}
    >
      <Icon size={20} strokeWidth={activeTab === id ? 3 : 2} />
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className={`flex flex-col min-h-screen ${bgMain} font-sans`}>
      <header className={`fixed top-0 left-0 right-0 z-40 border-b max-w-[480px] mx-auto transition-colors duration-300 ${
        isDark ? 'bg-slate-950/80 border-white/5' : 'bg-white/80 border-slate-200'
      } backdrop-blur-xl px-5 py-4 flex justify-between items-center`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Menu size={24} />
          </button>
          <div className="leading-tight">
            <h2 className={`font-black tracking-tighter uppercase text-sm ${textHeading}`}>ADMIN CORE</h2>
            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">FIREBASE ENGINE</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
              onClick={() => setLocalConfig({...localConfig, isAdminDarkMode: !isDark})}
              className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-white/10 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
           >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
           </button>
           <button 
            onClick={handleSave}
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Save size={16} /> SAVE
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <motion.div 
        className={`fixed top-0 left-0 bottom-0 w-72 ${isDark ? 'bg-slate-900 border-r border-white/5' : 'bg-white border-r border-slate-200'} z-[60] shadow-2xl flex flex-col p-6`}
        initial={{ x: '-100%' }} animate={{ x: isSidebarOpen ? 0 : '-100%' }}
      >
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
               <Cpu size={20} />
             </div>
             <div className={`font-black tracking-tighter ${textHeading}`}>AMS ADMIN</div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem id="dashboard" icon={TrendingUp} label="DASHBOARD" />
          <SidebarItem id="users" icon={Users} label="USER CONTROL" />
          <SidebarItem id="products" icon={Package} label="PACKAGES" />
          <SidebarItem id="server" icon={Server} label="SERVICES" />
          <SidebarItem id="ui" icon={Layout} label="CONTENT" />
          <SidebarItem id="payments" icon={Wallet} label="GATEWAY" />
        </nav>

        <button onClick={() => onNavigate('home')} className="mt-6 flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> EXIT ADMIN
        </button>
      </motion.div>

      <main className="pt-24 px-5 pb-12 max-w-[480px] mx-auto w-full space-y-6">
        
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className={`${bgCard} p-5 rounded-3xl border shadow-sm`}>
                   <Users size={20} className="text-blue-500 mb-3" />
                   <div className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Users</div>
                   <div className={`text-2xl font-black ${textHeading}`}>{allUsers.length}</div>
                </div>
                <div className={`${bgCard} p-5 rounded-3xl border shadow-sm`}>
                   <ShoppingCart size={20} className="text-indigo-500 mb-3" />
                   <div className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Orders</div>
                   <div className={`text-2xl font-black ${textHeading}`}>{recentOrders.length + '+'}</div>
                </div>
             </div>

             {/* Quick Controls */}
             <div className={`${bgCard} p-6 rounded-[2.5rem] border shadow-sm`}>
                <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${textHeading}`}>
                  <Zap size={14} className="text-amber-500" /> Quick Controls
                </h3>
                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-white/5' : 'bg-slate-50/50'} rounded-2xl border ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className="leading-tight">
                    <div className="text-[11px] font-black uppercase tracking-tighter">System Status</div>
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${localConfig.maintenanceMode ? 'text-red-500' : 'text-emerald-500'}`}>
                      {localConfig.maintenanceMode ? 'Maintenance Mode' : 'Online & Active'}
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const newValue = !localConfig.maintenanceMode;
                      setLocalConfig({...localConfig, maintenanceMode: newValue});
                      try {
                        await updateDoc(doc(db, 'settings', 'global'), { maintenanceMode: newValue });
                        showToast(`🚀 Maintenance Mode ${newValue ? 'Enabled' : 'Disabled'}`, 'success');
                      } catch (e) {
                        showToast('❌ Failed to update status', 'error');
                      }
                    }} 
                    className={`w-14 h-7 rounded-full transition-all relative ${localConfig.maintenanceMode ? 'bg-red-500' : 'bg-emerald-500'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${localConfig.maintenanceMode ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
             </div>

             <div className={`${bgCard} p-6 rounded-[2.5rem] border shadow-sm flex flex-col items-center`}>
                <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2 w-full text-center ${textHeading}`}>
                  <Clock size={14} className="text-emerald-500" /> Recent Activity Stream
                </h3>
                <div className="space-y-4 w-full">
                  {recentOrders.map(order => (
                    <div key={order.id} className={`flex flex-col items-center py-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'} last:border-0 text-center gap-1`}>
                      <div className="text-[12px] font-black uppercase tracking-tighter italic">{order.userName}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{order.productName || order.type}</div>
                        <div className="text-[11px] font-black text-emerald-500">৳ {order.amount}</div>
                      </div>
                      <div className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                      } uppercase tracking-[0.2em]`}>{order.status}</div>
                    </div>
                  ))}
                  {recentOrders.length === 0 && <div className="text-center py-8 text-[10px] font-black uppercase tracking-widest text-slate-500">No activity detected</div>}
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${bgCard} border rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold outline-hidden focus:border-blue-500`}
              />
            </div>

            <div className="space-y-3">
              {allUsers.filter(u => (u.email?.toLowerCase().includes(searchQuery.toLowerCase())) || (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))).map(u => (
                <div key={u.uid} className={`${bgCard} p-4 rounded-3xl border shadow-sm flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full border-2 border-white/10" />
                    <div className="leading-tight">
                      <div className="text-[11px] font-black">{u.displayName}</div>
                      <div className="text-[9px] font-bold text-slate-500 truncate max-w-[120px]">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-xs font-black text-emerald-500">৳ {u.balance.toFixed(2)}</div>
                    <button 
                      onClick={() => setIsEditingBalance({ uid: u.uid, amount: 0 })}
                      className="text-[8px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-blue-600/20"
                    >
                      EDIT
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {isEditingBalance && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-xl">
                  <div className={`${bgCard} w-full max-w-sm rounded-[2.5rem] p-8 border shadow-2xl`}>
                    <h2 className="text-xl font-black mb-6 flex items-center gap-3 italic">
                      <Wallet className="text-blue-500" /> Adjust Balance
                    </h2>
                    <div className="flex items-center justify-center gap-6 mb-8">
                       <div className="text-3xl font-black">৳ ADD / REMOVE </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                       <button onClick={() => handleUpdateBalance(isEditingBalance.uid, 50)} className="py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">+ 50 TK</button>
                       <button onClick={() => handleUpdateBalance(isEditingBalance.uid, -50)} className="py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">- 50 TK</button>
                       <button onClick={() => handleUpdateBalance(isEditingBalance.uid, 100)} className="py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">+ 100 TK</button>
                       <button onClick={() => handleUpdateBalance(isEditingBalance.uid, -100)} className="py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">- 100 TK</button>
                    </div>

                    <div className="space-y-2">
                       <label className={`text-[10px] font-black uppercase tracking-widest ${textMuted} mb-1 block`}>Set Exact Balance</label>
                       <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="Amount (e.g. 0)" 
                            className={`flex-1 ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-100 border-slate-200'} border rounded-xl px-4 py-3 text-xs font-black outline-hidden`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                handleUpdateBalance(isEditingBalance.uid, val, true);
                              }
                            }}
                          />
                          <button 
                            onClick={(e) => {
                               const input = (e.currentTarget.previousSibling as HTMLInputElement);
                               handleUpdateBalance(isEditingBalance.uid, Number(input.value), true);
                            }}
                            className="bg-blue-600 text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest"
                          >
                             Set
                          </button>
                       </div>
                    </div>
                    <button onClick={() => setIsEditingBalance(null)} className="w-full mt-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'ui' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
             <div className={`${bgCard} p-6 rounded-3xl border space-y-4 shadow-sm`}>
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2"><Layout size={16} className="text-blue-500" /> Site Identity</h3>
                <div className="space-y-3">
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Branding Name</label>
                      <input type="text" value={localConfig.productName} onChange={e => setLocalConfig({...localConfig, productName: e.target.value})} className={`w-full ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} border rounded-xl px-4 py-3 text-xs font-bold outline-hidden`} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Logo URL</label>
                      <input type="text" value={localConfig.productLogo} onChange={e => setLocalConfig({...localConfig, productLogo: e.target.value})} className={`w-full ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} border rounded-xl px-4 py-3 text-xs font-bold outline-hidden`} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Floating Notice</label>
                      <textarea value={localConfig.notice} onChange={e => setLocalConfig({...localConfig, notice: e.target.value})} className={`w-full ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} border rounded-xl px-4 py-3 text-xs font-bold outline-hidden h-24`} />
                   </div>
                </div>
             </div>

             <div className={`${bgCard} p-6 rounded-3xl border space-y-4 shadow-sm`}>
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2"><Settings size={16} className="text-indigo-500" /> Navigation Links</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-black/10 p-4 rounded-2xl">
                      <div className="text-[11px] font-black uppercase tracking-widest">Show Recent Orders UI</div>
                      <button onClick={() => setLocalConfig({...localConfig, showRecentOrders: !localConfig.showRecentOrders})} className={`w-12 h-6 rounded-full transition-all ${localConfig.showRecentOrders ? 'bg-emerald-500' : 'bg-slate-700'} relative`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localConfig.showRecentOrders ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Support Redirect URL</label>
                      <input type="text" value={localConfig.supportLink} onChange={e => setLocalConfig({...localConfig, supportLink: e.target.value})} className={`w-full ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} border rounded-xl px-4 py-3 text-xs font-bold outline-hidden`} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Offers Redirect URL</label>
                      <input type="text" value={localConfig.offersLink} onChange={e => setLocalConfig({...localConfig, offersLink: e.target.value})} className={`w-full ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} border rounded-xl px-4 py-3 text-xs font-bold outline-hidden`} />
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black uppercase tracking-widest">Revenue Packages</h3>
                <button onClick={addPackage} className="p-2 bg-blue-600 text-white rounded-lg shadow-lg"><Plus size={18} /></button>
             </div>
             {localConfig.packages.map(pkg => (
                <div key={pkg.id} className={`${bgCard} p-4 rounded-3xl border shadow-sm space-y-3`}>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <input type="text" value={pkg.name} onChange={e => updatePackage(pkg.id, { name: e.target.value })} className="bg-transparent font-black text-xs outline-hidden w-full mr-2" />
                    <button onClick={() => removePackage(pkg.id)}><Trash2 size={16} className="text-red-500/50" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Price (৳)</label>
                      <input type="number" value={pkg.price} onChange={e => updatePackage(pkg.id, { price: Number(e.target.value) })} className={`w-full ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} border rounded-xl px-3 py-2 text-xs font-black text-emerald-500`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase pl-1">Server Amnt</label>
                      <input type="text" value={pkg.serverAmount} onChange={e => updatePackage(pkg.id, { serverAmount: e.target.value })} className={`w-full ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'} border rounded-xl px-3 py-2 text-xs font-black text-blue-500`} />
                    </div>
                  </div>
                </div>
             ))}
          </motion.div>
        )}

        {activeTab === 'server' && (
          <motion.div className="space-y-4">
            <div className={`${bgCard} p-6 rounded-3xl border space-y-4 shadow-xl`}>
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 italic"><Server size={18} className="text-blue-500" /> API Protocol</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase pl-1">Provider Tag</label>
                    <input type="text" value={localConfig.providerName} onChange={e => setLocalConfig({...localConfig, providerName: e.target.value})} className={`w-full ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'} rounded-xl px-4 py-3 text-[11px] font-bold`} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase pl-1">Base Endpoint</label>
                    <input type="text" value={localConfig.apiUrl} onChange={e => setLocalConfig({...localConfig, apiUrl: e.target.value})} className={`w-full ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'} rounded-xl px-4 py-3 text-[10px] font-mono`} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase pl-1">Main API Key</label>
                    <input type="text" value={localConfig.apiKey} onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})} className={`w-full ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'} rounded-xl px-4 py-3 text-[11px] font-bold`} />
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div className="space-y-4">
             <div className={`${bgCard} p-6 rounded-3xl border space-y-4 shadow-xl`}>
               <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 italic"><Wallet size={18} className="text-pink-500" /> Rupantor Gateway</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase pl-1">Rupantor Key</label>
                    <input type="text" value={localConfig.rupantorApiKey} onChange={e => setLocalConfig({...localConfig, rupantorApiKey: e.target.value})} className={`w-full ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'} rounded-xl px-4 py-3 text-[10px] font-mono`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase pl-1">Checkout URL</label>
                    <input type="text" value={localConfig.rupantorApiUrl} onChange={e => setLocalConfig({...localConfig, rupantorApiUrl: e.target.value})} className={`w-full ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'} rounded-xl px-4 py-3 text-[10px] font-mono`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase pl-1">Verify URL</label>
                    <input type="text" value={localConfig.rupantorVerifyUrl} onChange={e => setLocalConfig({...localConfig, rupantorVerifyUrl: e.target.value})} className={`w-full ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'} rounded-xl px-4 py-3 text-[10px] font-mono`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase pl-1">Auth Host</label>
                    <input type="text" value={localConfig.siteDomain} onChange={e => setLocalConfig({...localConfig, siteDomain: e.target.value})} className={`w-full ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'} rounded-xl px-4 py-3 text-[10px] font-mono text-emerald-500 font-black`} placeholder={window.location.host} />
                  </div>
               </div>
             </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
