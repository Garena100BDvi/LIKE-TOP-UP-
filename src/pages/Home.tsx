import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CircleAlert, 
  ChevronLeft, 
  ChevronRight, 
  Gift, 
  Headset, 
  Clock, 
  Flame, 
  ThumbsUp, 
  ArrowRight, 
  CheckCircle,
  User,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { Page, GlobalConfig, Order, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface HomeProps {
  onNavigate: (page: Page) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isLoggedIn: boolean;
  config: GlobalConfig;
  recentOrders: Order[];
  user?: UserProfile | null;
}

const BannerSlider = ({ banners }: { banners: string[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="mx-3.5 relative rounded-2xl overflow-hidden shadow-lg h-40 group">
      <motion.div 
        className="flex h-full"
        animate={{ x: `-${current * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {banners.map((url, idx) => (
          <img key={idx} src={url} alt={`Banner ${idx}`} className="w-full h-full object-cover flex-shrink-0" />
        ))}
      </motion.div>
      
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 shadow-md ${
              current === idx ? 'w-6.5 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      <button 
        onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7.5 h-7.5 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={14} className="text-dark" />
      </button>
      <button 
        onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7.5 h-7.5 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={14} className="text-dark" />
      </button>
    </div>
  );
};

export default function Home({ onNavigate, showToast, isLoggedIn, config, recentOrders, user }: HomeProps) {
  const openLink = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast('Link not configured yet');
    }
  };

  return (
    <div className="flex flex-col">
      <header className="glass-header flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onNavigate('home')}>
          {config.productLogo ? (
            <img src={config.productLogo} className="w-9 h-9 object-contain rounded-lg" alt="Logo" />
          ) : (
            <div className="w-8.5 h-8.5 bg-linear-to-br from-primary to-primary-dark text-white rounded-lg flex items-center justify-center text-base font-extrabold shadow-lg shadow-primary/30">
              {config.productName?.[0] || 'A'}
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="font-black text-lg text-dark tracking-tighter leading-none">
                {config.productName || 'AMS YT'}
              </div>
              <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white p-0.5">
                <CheckCircle size={10} strokeWidth={4} />
              </div>
            </div>
            <div className="font-black text-[13px] text-blue-600 tracking-tighter leading-none">
              GAME SHOP
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isLoggedIn ? (
            <>
              <button 
                onClick={() => onNavigate('login')}
                className="text-[11px] font-bold py-2 px-4 rounded-full bg-dark text-white shadow-md active:scale-95 transition-all"
              >
                Login
              </button>
            </>
          ) : (
            <button 
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 bg-white py-1.5 px-3 rounded-full hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
            >
              <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-white shadow-sm shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-slate-400" />
                )}
              </div>
              <div className="flex flex-col items-start leading-none pr-1">
                <span className="text-[10px] font-black text-dark tracking-tight max-w-[60px] truncate">{user?.displayName || 'User'}</span>
                <span className="text-[9px] font-black text-emerald-600">৳ {(user?.balance || 0).toFixed(2)}</span>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Notice Bar */}
      {config.notice && (
        <div className="m-3.5 mt-2.5 p-3.5 bg-white rounded-xl shadow-sm flex items-center gap-2.5 border-l-4 border-accent">
          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent flex-shrink-0">
            <Bell size={14} className="animate-pulse" />
          </div>
          <div className="text-[11px] font-bold leading-tight text-slate-700 flex-1">
            <marquee scrollamount="3">{config.notice}</marquee>
          </div>
          <span className="bg-accent text-white text-[8px] px-2 py-0.5 rounded-full font-bold tracking-widest shrink-0">
            NOTICE
          </span>
        </div>
      )}

      <BannerSlider banners={config.banners} />

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3 px-3.5 py-4">
        {[
          { id: 'offers', icon: Gift, label: 'OFFERS', color: 'bg-amber-100 text-amber-600', url: config.offersLink },
          { id: 'support', icon: Headset, label: 'SUPPORT', color: 'bg-blue-100 text-blue-600', url: config.supportLink },
        ].map((action) => (
          <button
            key={action.id}
            onClick={() => action.url ? openLink(action.url) : showToast(`🔥 ${action.label} লোড হচ্ছে...`)}
            className="premium-card p-4 flex flex-col items-center justify-center text-center active:scale-95 space-y-2"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${action.color} shadow-sm`}>
              <action.icon size={22} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-black tracking-widest text-slate-700 uppercase">
              {action.label}
              <ExternalLink size={10} className="text-slate-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Top Up Section */}
      <div className="px-3.5 py-2">
        <h3 className="font-extrabold text-sm tracking-tight text-dark flex items-center gap-1.5 mb-3 uppercase tracking-widest">
           Top Up Products
        </h3>
        
        <motion.div 
          onClick={() => onNavigate('recharge')}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="premium-card overflow-hidden cursor-pointer group mb-4"
        >
          <div className="bg-linear-to-br from-slate-800 to-slate-950 p-4.5 flex items-center gap-3.5 relative overflow-hidden">
            <div className="absolute -top-7.5 -right-7.5 w-25 h-25 bg-accent/20 rounded-full blur-2xl" />
            
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0 relative z-10 border border-white/20 shadow-inner">
               {config.productIcon.length > 2 ? (
                 <img src={config.productIcon} className="w-10 h-10 object-contain" />
               ) : (
                 <span className="text-3xl">{config.productIcon}</span>
               )}
            </div>
            
            <div className="relative z-10 flex-1">
              <h3 className="text-lg font-black text-white tracking-tighter mb-0.5 leading-tight">{config.productName}</h3>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Instant Auto Delivery • Pro</div>
            </div>
            
            <span className="absolute top-3 right-3 bg-accent text-white text-[8px] px-2.5 py-1 rounded-full font-black tracking-widest z-10 shadow-lg">
              HOT
            </span>
          </div>
          
          <div className="p-4 flex items-center justify-between bg-white">
            <div className="flex items-baseline gap-2">
              <span className="font-black text-2xl text-accent tracking-tighter">৳ {config.packages[0]?.price || 0}</span>
              <span className="line-through text-slate-300 text-xs font-bold font-mono tracking-tighter">৳ {(config.packages[0]?.price || 0) + 15}</span>
            </div>
            <div className="bg-slate-950 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:bg-primary transition-all shadow-md">
              Buy Now <ShoppingBag size={12} strokeWidth={3} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Section */}
      {config.showRecentOrders && recentOrders.length > 0 && (
        <div className="px-3.5 pb-6">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                <Clock size={16} />
             </div>
             <h3 className="font-black text-sm tracking-tight text-dark uppercase tracking-widest">Recent Orders</h3>
             <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full animate-blink" />
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {recentOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-3 flex items-center justify-between border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
                       <ShoppingBag size={14} className="text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-dark tracking-tight leading-tight">
                        {order.userName?.split(' ')[0] || 'User'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 capitalize">
                        {order.packageName || order.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-600' : 
                      order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                    } uppercase tracking-widest`}>
                      {order.status}
                    </div>
                    <span className="text-[8px] font-bold text-slate-300 font-mono tracking-tighter">
                      {order.createdAt?.toDate ? formatDistanceToNow(order.createdAt.toDate()) + ' ago' : 
                       order.createdAt?.seconds ? formatDistanceToNow(order.createdAt.seconds * 1000) + ' ago' : 
                       'Just now'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
