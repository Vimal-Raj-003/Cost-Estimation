
import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Github, Chrome, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  onLogin: (user: any) => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // 1. App calls Supabase
      // 2. Supabase redirects to Google
      // 3. Google redirects to: https://jsrqyisoilashfylvtbs.supabase.co/auth/v1/callback
      // 4. Supabase redirects FINAL user to: window.location.origin (e.g., localhost:5173)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, 
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // Page will redirect, so no need to stop loading state
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! Please check your email to confirm.' });
        setLoading(false);
      } else if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // onLogin is handled by the onAuthStateChange listener in App.tsx
        // No need to set loading false here as component unmounts
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
        setLoading(false);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#020617] p-6 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 p-10 relative z-10 animate-slide-up">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20 mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            {mode === 'signin' ? 'Enter your credentials to continue' : mode === 'signup' ? 'Join our estimation platform' : 'We\'ll send recovery instructions'}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start space-x-3 animate-fade-in ${
            message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="text" required 
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="email" required 
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => setMode('reset')} className="text-[10px] font-bold text-brand-primary hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="password" required 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Get Started' : 'Send Reset Link'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        {mode !== 'reset' && (
          <div className="mt-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Or continue with</span></div>
            </div>
            
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 py-3 rounded-full font-bold text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
               <Chrome className="w-4 h-4 mr-2" /> Google
            </button>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500 font-medium">
            {mode === 'signin' ? "Don't have an account?" : mode === 'signup' ? "Already have an account?" : "Remembered your password?"}
            <button 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="ml-2 text-brand-primary font-black hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
