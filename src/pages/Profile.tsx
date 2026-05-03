import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  User, 
  Wallet, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Shield, 
  Bell, 
  Gift,
  Zap,
  CheckCircle,
  Layout,
  Camera,
  Download,
  Edit2
} from 'lucide-react';
import { Page, UserProfile } from '../types';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileProps {
  onNavigate: (page: Page) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onLogout: () => void;
  user?: UserProfile | null;
}

export default function Profile({ onNavigate, showToast, onLogout, user }: ProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    { id: 'add_money', label: 'Add Money / Top Up', icon: Wallet, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'my_orders', label: 'Order History', icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
  ];

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      if (file.size > 100 * 1024) { // 100KB limit for base64 storage in Firestore for this demo
        showToast('❌ Image too large! Max 100KB for now.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            photoURL: base64String
          });
          showToast('📸 Profile photo updated!', 'success');
        } catch (error) {
          showToast('❌ Failed to update photo', 'error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#f8fafc]">
      <header className="flex justify-between items-center px-5 py-4 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-dark text-white rounded-xl flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20">
            A
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-black text-lg text-dark tracking-tighter leading-none italic uppercase">AMS CORE</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                <CheckCircle size={10} strokeWidth={4} />
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => onNavigate('home')} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-dark transition-all active:scale-90">
          <ArrowLeft size={18} />
        </button>
      </header>

      <div className="p-3 pt-4 space-y-5">
        {/* Compact Professional Card */}
        <div className="bg-white rounded-[1.8rem] p-5 relative overflow-hidden shadow-lg border border-slate-50">
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-slate-50 cursor-pointer"
                onClick={handleImageClick}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-lg border-2 border-white flex items-center justify-center shadow-sm">
                <Camera size={10} />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-dark tracking-tighter uppercase italic truncate">
                {user?.displayName || 'Player'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="bg-emerald-500 w-1.5 h-1.5 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Verified Account</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
             <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 text-center">
                <div className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 leading-none">Wallet</div>
                <div className="text-base font-black text-emerald-500 italic">৳{user?.balance?.toFixed(0) || '0'}</div>
             </div>
             <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 text-center">
                <div className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 leading-none">Rank</div>
                <div className="text-base font-black text-primary italic uppercase">PRO</div>
             </div>
          </div>
        </div>

        {/* Action Menu - Compact */}
        <div className="space-y-2.5">
          {user?.isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="w-full bg-slate-900 px-4 py-3.5 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-900/10 group active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Layout size={18} />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest italic">Admin Console</span>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
            </button>
          )}

          <div className="bg-white rounded-[1.8rem] p-2 shadow-sm border border-slate-100 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-slate-50 active:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color} shadow-sm group-hover:scale-105 transition-transform`}>
                    <item.icon size={18} />
                  </div>
                  <span className="text-[11px] font-black text-dark tracking-tight uppercase italic">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-1">
          <button
            onClick={onLogout}
            className="w-full py-4 rounded-2xl bg-white border border-red-100 text-red-500 font-black flex items-center justify-center gap-2 hover:bg-red-50 transition-all shadow-sm uppercase tracking-widest text-[10px] active:scale-[0.98]"
          >
            <LogOut size={16} /> Logout Account
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5 opacity-30 py-2">
           <div className="text-[8px] font-black uppercase tracking-[0.4em] font-mono">AMS GATEWAY V.1</div>
           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Secured by ams network</p>
        </div>
      </div>
    </div>
  );
}
