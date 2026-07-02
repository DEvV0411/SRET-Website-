import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Wifi, WifiOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isOnline } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password, rememberMe);
      if (!success) {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Helper helper to automatically load credentials for ease of testing
  const handleQuickLoad = (user: string) => {
    setUsername(user);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 font-body relative overflow-hidden px-4">
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg shadow-2xl p-8 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-md bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <span className="text-white text-2xl font-bold font-heading">⚡</span>
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-white">Outreach Management</h1>
          <p className="text-sm text-slate-400 mt-1">SaaS Centralized MIS Portal (OMP)</p>
        </div>

        {/* Connection Notice Banner */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-md text-xs font-semibold mb-6 ${
          isOnline 
            ? 'bg-secondary/10 border border-secondary/20 text-secondary' 
            : 'bg-accent/10 border border-accent/20 text-accent'
        }`}>
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <div className="flex-1">
            {isOnline 
              ? 'Connected to OMP Cloud Engine' 
              : 'Offline Mode - Logging in from local device storage'}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-md mb-6 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Shield size={16} />
              </span>
              <input
                type="text"
                required
                placeholder="e.g. admin, trainer.rahul"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-md text-sm text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Key size={16} />
              </span>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-md text-sm text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-primary focus:ring-0 cursor-pointer"
              />
              Remember session
            </label>
            <span 
              onClick={() => alert('Please contact Super Admin (Ramanlal Patel) to reset your credentials.')}
              className="hover:text-white cursor-pointer transition-colors"
            >
              Forgot credentials?
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};
