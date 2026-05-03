import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Wallet, Plus, Info, ShieldCheck, Zap, CheckCircle } from 'lucide-react';
import { Page, UserProfile, GlobalConfig } from '../types';

interface AddMoneyProps {
  onNavigate: (page: Page) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  config: GlobalConfig;
  user: UserProfile | null;
}

export default function AddMoney({ onNavigate, showToast, config, user }: AddMoneyProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'instant'>('instant');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddMoney = async () => {
    if (!user) {
      showToast('⚠️ Please login first', 'error');
      return;
    }
    if (!amount || parseInt(amount) < 10) {
      showToast('⚠️ Minimum amount is ৳ 10', 'error');
      return;
    }

    setIsProcessing(true);
    showToast(`🚀 Redirecting to Secure Gateway...`, 'info');
    
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          apiKey: config.rupantorApiKey,
          apiUrl: config.rupantorApiUrl,
          siteDomain: config.siteDomain || window.location.origin,
          metadata: {
            userId: user.uid,
            userName: user.displayName,
            type: 'add_money'
          }
        })
      });

      const data = await response.json();
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        const errorMsg = data.message || data.details || 'Unknown Error';
        showToast(`❌ Gateway Error: ${errorMsg}`, 'error');
        console.log("Full Failure Data:", data);
      }
    } catch (err) {
      console.error('Checkout Error:', err);
      showToast('❌ Failed to connect to payment gateway', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-[#f8fafc]">
      <header className="flex justify-between items-center px-4 py-2.5 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-7 h-7 bg-linear-to-br from-primary to-primary-dark text-white rounded-lg flex items-center justify-center text-base font-black shadow-lg shadow-primary/20">
            A
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-black text-sm text-dark tracking-tighter leading-none italic uppercase underline decoration-primary/20">AMS CORE</span>
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white border border-white shadow-sm">
                <CheckCircle size={6} strokeWidth={5} />
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => onNavigate('home')} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-dark transition-all active:scale-90">
          <ArrowLeft size={14} />
        </button>
      </header>

      <div className="p-4 pt-4">
        <div className="bg-white rounded-3xl p-5 mb-4 shadow-xl shadow-slate-200/20 border border-white">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
              <Wallet size={20} strokeWidth={2} />
            </div>
            <div className="text-left">
              <h2 className="text-base font-black text-dark tracking-tighter uppercase italic leading-none">Wallet Refill</h2>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5 opacity-60">Secure Protocol v1.0</p>
            </div>
          </div>

          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Amount (৳)</label>
          <div className="relative mb-4 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg text-slate-300 group-focus-within:text-primary transition-colors">৳</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl pl-10 pr-4 py-3 text-xl font-black text-dark focus:outline-hidden focus:border-primary/5 focus:bg-white transition-all shadow-inner placeholder:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {[50, 100, 200, 500].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-black text-dark hover:bg-white hover:border-primary/20 hover:shadow-sm hover:text-primary transition-all active:scale-95 uppercase"
              >
                +৳{val}
              </button>
            ))}
          </div>

          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Payment Module</label>
          <div className="mb-6">
            <button
              onClick={() => setSelectedMethod('instant')}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group ${
                selectedMethod === 'instant' ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : 'border-slate-50 bg-slate-50/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-105 ${
                selectedMethod === 'instant' ? 'bg-primary text-white' : 'bg-white text-slate-300'
              }`}>
                <Zap size={16} fill="currentColor" />
              </div>
              <div className="text-left flex-1">
                <div className="font-black text-sm text-dark tracking-tight uppercase leading-none italic">Instant Pay</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">BKash / Nagad / Rocket</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === 'instant' ? 'border-primary bg-primary' : 'border-slate-200'
              }`}>
                {selectedMethod === 'instant' && <div className="w-1 h-1 bg-white rounded-full" />}
              </div>
            </button>
          </div>

          <button
            onClick={handleAddMoney}
            disabled={isProcessing}
            className="w-full h-12 bg-linear-to-r from-primary to-primary-dark text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>PROCESSING...</span>
              </div>
            ) : (
              <>
                <Plus size={16} strokeWidth={3} />
                <span>Deposit Funds</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
              <Info size={14} />
            </div>
            <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic pr-2">
               AMS Secure Protocol active. 
               Funds are credited instantly upon verification.
            </p>
          </div>
        </div>


        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="flex gap-4">
            <ShieldCheck size={20} className="text-slate-300" />
            <Zap size={20} className="text-slate-300" />
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure & Instant Processing</p>
        </div>
      </div>
    </div>
  );
}
