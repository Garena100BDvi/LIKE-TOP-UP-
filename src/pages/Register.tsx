import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, ArrowLeft, Chrome, CheckCircle, Loader2, Mail, Lock, User, LogIn } from 'lucide-react';
import { Page } from '../types';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface RegisterProps {
  onNavigate: (page: Page) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onAuthSuccess: () => void;
}

export default function Register({ onNavigate, showToast, onAuthSuccess }: RegisterProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      showToast('🚀 Account Created Successfully!', 'success');
      onAuthSuccess();
    } catch (error: any) {
      console.error(error);
      showToast('❌ Registration Failed: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('✅ Welcome to AMS!', 'success');
      onAuthSuccess();
    } catch (error: any) {
      showToast('❌ Google Login Failed', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="glass-header flex justify-between items-center px-4 py-3 bg-white w-full">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-8.5 h-8.5 bg-linear-to-br from-primary to-primary-dark text-white rounded-lg flex items-center justify-center text-base font-extrabold shadow-lg shadow-primary/30">
            A
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="font-black text-lg text-dark tracking-tighter leading-none">AMS YT</div>
              <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-white p-0.5">
                <CheckCircle size={10} strokeWidth={4} />
              </div>
            </div>
            <div className="font-black text-[13px] text-blue-600 tracking-tighter leading-none">GAME SHOP</div>
          </div>
        </div>
        <button onClick={() => onNavigate('login')} className="flex items-center gap-1 text-[11px] font-bold py-2 px-4 rounded-full border-2 border-slate-200">
          <ArrowLeft size={14} /> Back
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm premium-card p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-primary to-primary-dark" />
          
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-linear-to-br from-primary to-primary-dark text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-xl shadow-primary/30 mx-auto mb-4">
              <UserPlus size={32} />
            </div>
            <h2 className="text-2xl font-black text-dark tracking-tighter mb-1 italic">Create Account 🚀</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest bg-slate-100 py-1 rounded-lg">Join the AMS Gaming Community</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Player Name" 
                  required 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-11 pr-5 py-3 text-sm font-bold focus:outline-hidden focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="email" 
                  placeholder="example@mail.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-11 pr-5 py-3 text-sm font-bold focus:outline-hidden focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                  type="password" 
                  placeholder="Min 6 characters" 
                  required 
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-11 pr-5 py-3 text-sm font-bold focus:outline-hidden focus:border-primary transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isBusy}
              className="w-full h-12 bg-dark text-white font-black py-3 rounded-2xl shadow-xl shadow-dark/20 flex items-center justify-center gap-2 hover:bg-slate-900 active:scale-95 transition-all text-sm mb-4"
            >
              {isBusy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} 
              Create Profile
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-0.5 bg-slate-100" />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-0.5 bg-slate-100" />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isBusy}
            className="w-full h-12 bg-white border-2 border-slate-100 text-dark font-black rounded-2xl shadow-sm flex items-center justify-center gap-4 hover:border-primary hover:bg-slate-50 active:scale-95 transition-all text-sm group"
          >
            {isBusy ? <Loader2 className="animate-spin text-primary" size={18} /> : <Chrome className="text-primary group-hover:scale-110 transition-transform" size={18} />}
            Sign up with Google
          </button>

          <p className="mt-8 text-center text-[12px] font-bold text-slate-500">
            Already have an account? <button onClick={() => onNavigate('login')} className="text-primary font-black hover:underline uppercase tracking-tight">Login Now</button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
