import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle, 
  Shield, 
  Zap,
  Info
} from 'lucide-react';
import { Page, RechargeOption, GlobalConfig, UserProfile } from '../types';
import { db } from '../services/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'; 

interface RechargeProps {
  onNavigate: (page: Page) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isLoggedIn: boolean;
  config: GlobalConfig;
  balance: number;
  user: UserProfile | null;
}

const PAYMENT_METHODS = [
  { id: 'wallet', name: 'Wallet', sub: 'Internal Balance', color: 'bg-indigo-100 text-indigo-700', icon: 'W' },
  { id: 'instant', name: 'Instant Pay', sub: 'BKash/Nagad/Rocket', color: 'bg-pink-100 text-pink-700', icon: 'I' },
];

export default function Recharge({ onNavigate, showToast, isLoggedIn, config, balance, user }: RechargeProps) {
  const PACKAGES: RechargeOption[] = config.packages.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    subText: 'FF All Server'
  }));

  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[0] || { id: 'default', name: 'Select Package', price: 0 });
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);
  const [uid, setUid] = useState('');
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Sync selected package if config changes
  React.useEffect(() => {
    if (PACKAGES.length > 0 && (selectedPkg.id === 'default' || !PACKAGES.find(p => p.id === selectedPkg.id))) {
      setSelectedPkg(PACKAGES[0]);
    }
  }, [config.packages]);

  const API_KEY = 'bbedce6fb4c92aeada7ec53ac4dfbee6';

  const checkPlayerName = async () => {
    if (!uid || uid.length < 6) {
      showToast('⚠️ Please enter a valid Player UID', 'error');
      return;
    }

    setIsCheckingName(true);
    setPlayerName(null);
    
    try {
      const targetUrl = `https://ffabff.drakleafx.com//index.php?action=check_name&uid=${uid}&api_key=${API_KEY}`;
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();
      
      if (data.success && data.name) {
        setPlayerName(data.name);
        showToast('✅ Player found successfully', 'success');
      } else {
        showToast('❌ Invalid UID or Player not found', 'error');
      }
    } catch (error) {
      console.error('API Error:', error);
      showToast('❌ Server error. Please try again.', 'error');
    } finally {
      setIsCheckingName(false);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      showToast('⚠️ Please login first', 'error');
      return;
    }
    
    if (!uid || uid.length < 6) {
      showToast('⚠️ Please enter a valid Player UID first', 'error');
      return;
    }

    const pkgConfig = config.packages.find(p => p.id === selectedPkg.id);
    if (!pkgConfig) {
      showToast('❌ Invalid Package Selection', 'error');
      return;
    }

    // Handle Instant Pay Redirection
    if (selectedPayment.id === 'instant') {
      setIsOrdering(true);
      showToast('🔗 Redirecting to Secure Gateway...', 'info');
      try {
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: selectedPkg.price,
            apiKey: config.rupantorApiKey,
            apiUrl: config.rupantorApiUrl,
            siteDomain: config.siteDomain || window.location.origin,
            metadata: {
              uid: uid,
              package_id: selectedPkg.id,
              player_name: playerName || 'Unknown',
              userId: user.uid
            }
          })
        });
        const data = await response.json();
        if (data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          showToast(`❌ Gateway Error: ${data.message || 'Unknown'}`, 'error');
        }
      } catch (err) {
        console.error('Checkout Error:', err);
        showToast('❌ Failed to connect to payment gateway', 'error');
      } finally {
        setIsOrdering(false);
      }
      return;
    }

    if (balance < selectedPkg.price) {
      showToast('⚠️ Insufficient Balance! Please add money first.', 'error');
      return;
    }

    setIsOrdering(true);
    showToast('🚀 Processing your Order with Auto AI Server...', 'info');
    
    try {
      const serverAmount = pkgConfig.serverAmount;
      const targetUrl = `${config.apiUrl}${uid}/${config.apiKey}?amount=${serverAmount}`;
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();
      
      const isSuccess = data.success === true || data.success === 'true' || data.status === 'success' || data.status === 'completed';

      const orderRef = doc(collection(db, 'orders'));
      const orderData = {
        userId: user.uid,
        userName: user.displayName,
        amount: selectedPkg.price,
        status: isSuccess ? 'completed' : 'pending',
        type: 'recharge',
        productName: selectedPkg.name,
        targetId: uid,
        targetName: playerName || 'Unknown',
        createdAt: serverTimestamp(),
      };

      await setDoc(orderRef, orderData);

      // Deduct balance from user profile in Firestore
      if (isSuccess) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          balance: increment(-selectedPkg.price)
        });
        showToast('✅ ORDER COMPLETE! আপনার লাইক পাঠানো হয়েছে।', 'success');
      } else {
        showToast(`❌ API Response: ${data.status || 'Failed'}.`, 'error');
      }
      
      setTimeout(() => onNavigate('my_orders'), 2000);
    } catch (error) {
      console.error('Order API Error:', error);
      showToast('❌ Connection Error. Please contact support.', 'error');
    } finally {
      setIsOrdering(false);
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
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-[11px] font-bold py-2 px-4 rounded-full border-2 border-slate-200 hover:border-dark transition-all"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </header>

      <div className="p-3.5">
        {/* AI Delivery Badge */}
        <div className="bg-linear-to-br from-slate-800 to-slate-950 text-white text-center py-3 px-4 rounded-xl mb-4 font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse-green shrink-0" />
          Free Fire LIKE TopUp AI Delivery
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse-green shrink-0" />
        </div>

        {/* Step 1: Packages */}
        <div className="premium-card p-4 mb-3 border-slate-100">
          <div className="flex items-center gap-2 font-black text-xs text-dark mb-3 tracking-tight">
            <span className="w-5.5 h-5.5 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">1</span>
            Select LIKE Package
          </div>
          <div className="space-y-2">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                  selectedPkg.id === pkg.id 
                    ? 'border-primary bg-primary/5 shadow-inner' 
                    : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedPkg.id === pkg.id ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
                  }`}>
                    {selectedPkg.id === pkg.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-dark leading-none mb-0.5">{pkg.name}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{pkg.subText}</div>
                  </div>
                </div>
                <div className={`font-black text-lg ${selectedPkg.id === pkg.id ? 'text-primary' : 'text-accent'}`}>
                  <span className="text-xs font-bold mr-0.5">৳</span> {pkg.price}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Account Info */}
        <div className="premium-card p-4 mb-3 border-slate-100">
          <div className="flex items-center gap-2 font-black text-xs text-dark mb-3 tracking-tight">
            <span className="w-5.5 h-5.5 bg-primary text-white rounded-full flex items-center justify-center text-[10px]">2</span>
            Account Info
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Player UID</label>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Enter Player UID"
                  value={uid}
                  onChange={(e) => setUid(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all tracking-widest placeholder:tracking-normal placeholder:font-medium"
                />
                <button 
                  onClick={checkPlayerName}
                  disabled={isCheckingName}
                  className={`w-full h-11 bg-linear-to-br from-blue-600 to-indigo-700 text-white rounded-xl text-[11px] font-black shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70 disabled:grayscale transform hover:-translate-y-0.5`}
                >
                  {isCheckingName ? (
                    <div className="flex items-center gap-2">
                       <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       <span>CHECKING PLAYER...</span>
                    </div>
                  ) : (
                    <>
                      <Search size={14} strokeWidth={3} />
                      <span>CHECK PLAYER NAME</span>
                    </>
                  )
                }
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {playerName && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle size={18} />
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Player Name</div>
                      <div className="font-black tracking-tight">{playerName}</div>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Step 3: Payment Methods */}
        <div className="premium-card p-4 mb-4 border-slate-100">
          <div className="flex items-center gap-2 font-black text-xs text-dark mb-4 tracking-tight">
            <span className="w-5.5 h-5.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
            Payment Methods
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PAYMENT_METHODS.map((method) => (
              <button 
                key={method.id}
                onClick={() => setSelectedPayment(method)}
                className={`flex flex-col border-2 rounded-xl overflow-hidden transition-all text-center ${
                  selectedPayment.id === method.id 
                    ? `border-${method.id === 'wallet' ? 'primary' : 'pink-500'} ring-2 ring-${method.id === 'wallet' ? 'primary/10' : 'pink-500/10'}` 
                    : 'border-slate-100'
                }`}
              >
                <div className="flex-1 p-3 bg-slate-50/50 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-full p-2 shadow-sm mb-2 flex items-center justify-center">
                     <div className={`w-full h-full ${method.color} rounded-full flex items-center justify-center text-[11px] font-black`}>{method.icon}</div>
                  </div>
                  <div className="font-extrabold text-[10px] text-dark leading-tight uppercase">{method.name}</div>
                  <div className="text-[7px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">{method.sub}</div>
                </div>
                <div className={`py-1.5 text-[9px] font-black uppercase tracking-tight ${selectedPayment.id === method.id ? (method.id === 'wallet' ? 'bg-primary text-white' : 'bg-pink-600 text-white') : 'bg-slate-200 text-slate-500'}`}>
                  {method.id === 'wallet' ? 'Pay With Wallet' : 'Instant Checkout'}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-2 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
               <Info size={12} className="text-slate-400" />
               প্রোডাক্ট কিনতে আপনার প্রয়োজন <span className="text-red-500 font-black">৳ {selectedPkg.price.toFixed(2)}</span> টাকা।
            </div>
            {!isLoggedIn ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
                 <div className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[8px] font-black">!</div>
                 Please Login To Purchase
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase text-slate-400 leading-none">Your Balance</div>
                    <div className="text-xs font-black text-dark tracking-tight">৳ {balance.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">Active</div>
              </div>
            )}
          </div>

          {!isLoggedIn ? (
            <button 
              onClick={() => onNavigate('login')}
              className="w-full bg-red-600 text-white font-black py-4 rounded-xl shadow-lg shadow-red-600/20 mt-4 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              LOGIN
            </button>
          ) : (
            <button 
              onClick={handleOrder}
              className="w-full bg-linear-to-br from-primary to-primary-dark text-white font-black py-4 rounded-xl shadow-lg shadow-primary/30 mt-4 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Zap size={16} fill="white" />
              BUY NOW (৳ {selectedPkg.price.toFixed(0)})
            </button>
          )}
        </div>

        {/* Product Information Section */}
        <div className="premium-card p-4 mb-4 border-slate-100">
          <div className="font-black text-base text-dark mb-4 tracking-tight border-b border-slate-100 pb-2">
            Product Information
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📢</span>
              <span className="font-black text-dark tracking-tight">অর্ডার করার আগে পড়ে নিন!</span>
            </div>

            <div className="flex gap-3">
              <span className="text-lg flex-shrink-0">✅</span>
              <p className="text-[11px] font-bold text-dark leading-relaxed">
                ফ্রী ফায়ার এর সকল সার্ভারের আইডিতে এক দিনে এক আইডিতে ১০০ এবং ২০০ লাইক করে নিতে পারবেন। 
                <span className="text-red-600"> তবে এক আইডিতে যেকোনো একটা অর্ডার করা যাবে প্রতিদিন। (১টি আইডিতে ২৪ ঘন্টা পরপর ১ বার লাইক নেওয়া যাবে)</span>
              </p>
            </div>

            <div className="flex gap-3">
              <span className="text-lg flex-shrink-0">❌</span>
              <p className="text-[11px] font-bold text-dark leading-relaxed">
                ভুলেও গেস্ট আইডিতে অর্ডার করবেন না।
              </p>
            </div>

            <div className="flex gap-3">
              <span className="text-lg flex-shrink-0">👉</span>
              <p className="text-[11px] font-bold text-dark leading-relaxed">
                ডেলিভারি টাইম ১ ঘন্টা থেকে ৬ ঘণ্টা পর্যন্ত।
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-bold text-slate-400 mt-4 flex items-center justify-center gap-1.5 uppercase tracking-widest">
          <Shield size={12} className="text-slate-300" /> Secure AI Delivery • Instant Top-Up
        </p>
      </div>
    </div>
  );
}
