import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingBag, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Page, Order, UserProfile } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

interface MyOrdersProps {
  onNavigate: (page: Page) => void;
  user: UserProfile | null;
}

export default function MyOrders({ onNavigate, user }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      console.error("Orders Listener Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'pending': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'cancelled': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle size={12} />;
      case 'pending': return <Clock size={12} />;
      case 'cancelled': return <XCircle size={12} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="glass-header flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-8.5 h-8.5 bg-linear-to-br from-primary to-primary-dark text-white rounded-lg flex items-center justify-center text-base font-extrabold shadow-lg shadow-primary/30">
            A
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="font-black text-lg text-dark tracking-tighter leading-none">
                AMS YT
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
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[11px] font-bold py-2 px-4 rounded-full border-2 border-slate-200">
          <ArrowLeft size={14} /> Back
        </button>
      </header>

      <div className="p-3.5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-dark tracking-tight">Order History</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Manage your purchases</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="premium-card p-4 flex flex-col gap-3 border-slate-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[9px] font-black text-slate-300 mb-1 font-mono">#{order.id.slice(-8).toUpperCase()}</div>
                    <div className="font-black text-sm text-dark uppercase tracking-tight">{order.productName || order.type}</div>
                    {order.targetId && (
                      <div className="text-[10px] font-bold text-blue-600 mt-1 flex items-center gap-1 italic">
                        🎯 {order.targetId}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status}
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-dashed border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Clock size={12} className="text-slate-300" /> {order.createdAt instanceof Date ? order.createdAt.toLocaleDateString() : 'Just Now'}
                  </div>
                  <div className="font-black text-base text-emerald-500">৳ {order.amount.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <ShoppingBag size={40} />
            </div>
            <h3 className="font-black text-lg text-slate-600">No orders yet</h3>
            <p className="text-xs text-slate-400 px-10">Start shopping today and your order list will appear here.</p>
            <button 
              onClick={() => onNavigate('home')} 
              className="mt-6 btn-primary"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
