/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  Wallet, 
  ShoppingBag, 
  User, 
  Bell, 
  ArrowLeft, 
  LogOut,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gift,
  Headset,
  Clock,
  Flame,
  ThumbsUp,
  CheckCircle,
  Zap,
  Shield,
  Mail,
  Lock,
  Phone,
  Search
} from 'lucide-react';
import { Page, Product, RechargeOption, GlobalConfig, Order, UserProfile } from './types';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, increment, serverTimestamp, query, collection, orderBy, limit } from 'firebase/firestore';

// Components
import Home from './pages/Home';
import Recharge from './pages/Recharge';
import Login from './pages/Login';
import Register from './pages/Register';
import AddMoney from './pages/AddMoney';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

const DEFAULT_CONFIG: GlobalConfig = {
  banners: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800'
  ],
  productName: 'FREE FIRE LIKE',
  productIcon: '👍',
  packages: [
    { id: '1', name: '100 LIKE', price: 20, serverAmount: '100' },
    { id: '2', name: '200 LIKE', price: 40, serverAmount: '200' },
    { id: '3', name: '500 LIKE', price: 80, serverAmount: '500' },
  ],
  rupantorApiKey: 'CA6RRS8KsytUoZ9yIhKwR8zCKvpI1l3lh8mo5JVz8loDZo2cY0',
  rupantorApiUrl: 'https://payment.rupantorpay.com/api/payment/checkout',
  rupantorVerifyUrl: 'https://payment.rupantorpay.com/api/payment/verify-payment',
  siteDomain: '',
  apiKey: 'ak_1777634102278_cnp',
  providerName: 'AMS YT SERVER',
  apiUrl: 'https://fflikeglobal.shop/api/v1/likes/',
  isAdminDarkMode: true,
  showRecentOrders: true,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync Global Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() }));
      } else {
        // Initialize if not exists (only if admin)
        // Note: In real app, this should be a manual step or cloud function
      }
    });
    return () => unsub();
  }, []);

  // Sync Auth and User Profile
  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (firebaseUser) {
        setIsLoggedIn(true);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Setup profile listener
        unsubUser = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: data.displayName || firebaseUser.displayName || 'User',
              photoURL: data.photoURL || firebaseUser.photoURL || '',
              balance: data.balance || 0,
              isAdmin: firebaseUser.email === 'sambin42@gmail.com' || data.isAdmin
            });
            setBalance(data.balance || 0);
          } else {
            // New User Profile Setup (Safe to run multiple times, Firestore handles)
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
              balance: 0,
            };
            setDoc(userRef, newUser, { merge: true });
          }
        }, (error) => {
          console.error("User Snapshot Error:", error);
          if (error.code === 'permission-denied') {
             // Silently handle or logout if profile is inaccessible
          }
        });
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setBalance(0);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  // Sync Recent Orders
  useEffect(() => {
    if (!config.showRecentOrders) return;
    
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setRecentOrders(orders);
    }, (error) => {
      console.error("Recent Orders Listener Error:", error);
    });
    return () => unsub();
  }, [config.showRecentOrders]);

  useEffect(() => {
    // Handle Payment Callbacks
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('payment_success');
    const isCancel = urlParams.get('payment_cancel');
    const paymentId = urlParams.get('payment_id') || urlParams.get('trxID');

    if (isSuccess && paymentId) {
      if (!user) return; // Wait for user to be loaded

      showToast('⌛ Verifying Payment...', 'info');
      
      const verifyPayment = async () => {
        try {
          const currentOrigin = config.siteDomain || window.location.host;
          const verifyApiUrl = `/api/verify-payment?payment_id=${paymentId}&apiKey=${config.rupantorApiKey}&verifyUrl=${encodeURIComponent(config.rupantorVerifyUrl)}&siteDomain=${encodeURIComponent(currentOrigin)}`;
          const response = await fetch(verifyApiUrl);
          const data = await response.json();
          
          if (data.status === 'paid' || data.success || data.payment_status === 'Completed' || data.status === 'success') {
             const amount = parseFloat(data.amount || data.pay_amount || data.amount_taka || 0);
             
             if (amount > 0) {
                // Prevent duplicate credits
                const orderId = `dep_${paymentId}`;
                const orderCheck = await getDoc(doc(db, 'orders', orderId));
                
                if (!orderCheck.exists()) {
                   // Update Balance
                   const userRef = doc(db, 'users', user.uid);
                   await updateDoc(userRef, { balance: increment(amount) });
                   
                   // Log Transaction
                   await setDoc(doc(db, 'orders', orderId), {
                     userId: user.uid,
                     userName: user.displayName,
                     amount: amount,
                     status: 'completed',
                     type: 'deposit',
                     productName: 'Wallet Topup',
                     createdAt: serverTimestamp()
                   });
                   
                   showToast(`✅ ৳ ${amount} Added Successfully!`, 'success');
                } else {
                   showToast('ℹ️ Payment already processed.', 'info');
                }
             } else {
               showToast('⚠️ Payment verified but amount is 0.', 'info');
             }
             window.history.replaceState({}, document.title, "/");
          } else {
             showToast(`❌ Verification Failed: ${data.message || 'Payment not completed'}`, 'error');
             window.history.replaceState({}, document.title, "/");
          }
        } catch (e) {
          console.error("Verification Error:", e);
          showToast('❌ Error verifying payment.', 'error');
        }
      };
      verifyPayment();
    } else if (isCancel) {
      showToast('❌ Payment Cancelled.', 'error');
      window.history.replaceState({}, document.title, "/");
    }
  }, [config]);

  const onDeductBalance = (amount: number) => {
    // Note: Deducting balance should happen via Firestore transaction in real usage
    // For now we rely on the components calling setDoc or similar
  };

  const handleUpdateConfig = (newConfig: GlobalConfig) => {
    // Config handled by Firestore listener now
    setDoc(doc(db, 'settings', 'global'), newConfig);
  };

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    navigate('profile');
  };

  const handleLogout = async () => {
    await auth.signOut();
    showToast('Logged out successfully', 'info');
    navigate('home');
  };

  if (config.maintenanceMode && !user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] p-8 text-center">
        <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-amber-500/10 border-4 border-white animate-bounce">
          <Settings size={42} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-black text-dark tracking-tighter uppercase italic mb-3">SYSTEM OFFLINE</h1>
        <p className="text-slate-400 font-bold text-sm max-w-xs leading-relaxed uppercase tracking-widest opacity-80">
          Maintenance Protocol Active. We are recalibrating our servers for peak performance.
        </p>
        <div className="mt-10 flex items-center gap-3 px-6 py-2.5 bg-white rounded-full border border-slate-100 shadow-lg">
           <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Security Patch in Progress</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-[#f0f2f7] relative pb-20 shadow-xl overflow-x-hidden font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 20, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className={`fixed z-[999] left-1/2 px-6 py-3 rounded-full text-white text-xs font-semibold shadow-2xl transition-all ${
              toast.type === 'success' ? 'bg-green-custom' : toast.type === 'error' ? 'bg-accent' : 'bg-dark'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pages */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {currentPage === 'home' && <Home onNavigate={navigate} showToast={showToast} isLoggedIn={isLoggedIn} config={config} recentOrders={recentOrders} />}
          {currentPage === 'recharge' && <Recharge onNavigate={navigate} showToast={showToast} isLoggedIn={isLoggedIn} config={config} balance={balance} user={user} />}
          {currentPage === 'login' && <Login onNavigate={navigate} showToast={showToast} onAuthSuccess={handleAuthSuccess} />}
          {currentPage === 'register' && <Register onNavigate={navigate} showToast={showToast} onAuthSuccess={handleAuthSuccess} />}
          {currentPage === 'add_money' && <AddMoney onNavigate={navigate} showToast={showToast} config={config} user={user} />}
          {currentPage === 'my_orders' && <MyOrders onNavigate={navigate} user={user} />}
          {currentPage === 'profile' && <Profile onNavigate={navigate} showToast={showToast} onLogout={handleLogout} user={user} />}
          {currentPage === 'admin' && <AdminPanel onNavigate={navigate} showToast={showToast} config={config} onUpdateConfig={handleUpdateConfig} user={user} />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-200 flex justify-around py-2 pb-6 z-200 rounded-t-2xl shadow-2xl">
        {[
          { id: 'home', icon: HomeIcon, label: 'Home' },
          { id: 'add_money', icon: Wallet, label: 'Add Money' },
          { id: 'my_orders', icon: ShoppingBag, label: 'My Orders' },
          { id: 'profile', icon: User, label: 'Profile' },
          ...(user?.isAdmin ? [{ id: 'admin', icon: Lock, label: 'Admin' }] : [])
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'home') navigate('home');
              else if (item.id === 'profile' && !isLoggedIn) navigate('login');
              else if (item.id === 'add_money' && !isLoggedIn) navigate('login');
              else if (item.id === 'my_orders' && !isLoggedIn) navigate('login');
              else if (item.id === 'admin' && (!isLoggedIn || !user?.isAdmin)) {
                if (!isLoggedIn) navigate('login');
                else showToast('Access Denied', 'error');
              }
              else navigate(item.id as Page);
            }}
            className={`flex flex-col items-center gap-1 transition-all ${
              currentPage === item.id || (currentPage === 'home' && item.id === 'home') ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <item.icon size={18} />
              {(currentPage === item.id || (currentPage === 'home' && item.id === 'home')) && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full"
                />
              )}
            </div>
            <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
