import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-campus-950 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-campus-400 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent-500 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-campus-400 to-accent-500 flex items-center justify-center mb-8">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Smart Campus<br />Resource Booking
          </h1>
          <p className="text-campus-300 text-lg leading-relaxed">
            Book rooms, labs, and equipment across campus. Real-time availability, 
            conflict-free scheduling, and usage analytics.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {['12 Resources', '500+ Bookings', '99.9% Uptime'].map((stat) => (
              <div key={stat} className="bg-campus-900/50 rounded-xl p-3 border border-campus-800">
                <p className="text-white font-mono text-xs">{stat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-campus-400 to-accent-500 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-lg">Smart Campus</h1>
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-8">Sign in to manage your bookings</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-campus-500 focus:ring-2 focus:ring-campus-200 outline-none transition text-sm"
                  placeholder="you@campus.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-campus-500 focus:ring-2 focus:ring-campus-200 outline-none transition text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-campus-600 hover:bg-campus-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-campus-600 hover:text-campus-700 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
