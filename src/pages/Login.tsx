import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Key, Mail, ShieldAlert } from 'lucide-react';

export default function Login() {
  const { user, userData, signInWithGoogle, loginWithToken } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      if (userData.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [userData, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Sign-In failed');
      }
    }
  };

  const handleTokenLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === 'piccisarfin@gmail.com') {
        await loginWithToken(email, token || 'ADMIN');
        return;
      }

      if (!token) {
        setError('Token is required');
        setLoading(false);
        return;
      }

      await loginWithToken(email, token);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or expired token');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-3 sm:p-4 my-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full bg-[#11111d] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div 
          onClick={handleGoogleSignIn}
          title="Admin Sign In with Google"
          className="w-10 h-10 mx-auto bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer hover:scale-105 transition-transform"
        >
          <span className="text-2xl font-black italic text-white">S</span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 uppercase">
            {t('welcome')}
          </h1>
          <p className="text-gray-400 text-[11px] sm:text-xs italic">
            {t('loginSubtitle')}
          </p>
        </div>
        
        <form onSubmit={handleTokenLogin} className="space-y-3 pt-1 text-left">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t('userIdLabel')}</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#050508] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t('userIdPlaceholder')}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t('accessTokenLabel')}</label>
            <div className="relative">
              <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full bg-[#050508] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                placeholder={t('tokenPlaceholder')}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-lg p-[1px] mt-4 inline-block shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#050508] px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors group-hover:bg-[#0c0c14]">
              {loading ? (
                <span className="text-white text-xs font-bold tracking-widest uppercase animate-pulse">{t('verifying')}</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-blue-400 group-hover:text-purple-400 transition-colors" />
                  <span className="text-white text-xs font-bold tracking-widest uppercase">{t('enterVault')}</span>
                </>
              )}
            </div>
          </button>
        </form>

        <div className="pt-2 flex justify-center border-t border-white/5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-wider"
          >
            {t('googleAdminSignIn')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
