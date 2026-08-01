import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Shield, Tv, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const { user, userData, logOut } = useAuth();
  const { lang, setLang, t } = useI18n();
  const location = useLocation();

  const isAdminRoute = location.pathname === '/admin';
  const isWatchActive = location.pathname === '/dashboard' && (!location.search || location.search.includes('watch'));
  const isProfileActive = location.pathname === '/dashboard' && location.search.includes('profile');

  return (
    <>
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-2 md:mb-8 md:border-b border-white/10 md:pb-4 z-50 relative"
      >
        <div className="flex justify-between items-center w-full">
          <Link to={userData?.isAdmin ? "/admin" : "/dashboard?tab=watch"} className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)] group-hover:scale-105 transition-transform">
              <span className="text-xl md:text-2xl font-black italic text-white">S</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 uppercase drop-shadow-md">
              Shafi <span className="text-white">Flix</span>
            </h1>
          </Link>
          
          <div className="flex gap-3 md:gap-6 items-center text-xs md:text-sm font-medium tracking-widest uppercase">
            {user && userData && (
              <div className="hidden md:flex gap-6 items-center">
                {!isAdminRoute && (
                  <>
                    <Link to="/dashboard?tab=watch" className={`transition-colors flex items-center gap-1.5 ${isWatchActive ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-blue-400'}`}>
                      <Tv className="w-4 h-4" />
                      <span>{t('watch')}</span>
                    </Link>
                    <Link to="/dashboard?tab=profile" className={`transition-colors flex items-center gap-1.5 ${isProfileActive ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-purple-400'}`}>
                      <User className="w-4 h-4" />
                      <span>{t('profile')}</span>
                    </Link>
                  </>
                )}
                {userData.isAdmin && (
                  <Link to="/admin" className={`transition-colors flex items-center gap-1.5 ${isAdminRoute ? 'text-pink-400 font-bold' : 'text-gray-400 hover:text-pink-400'}`}>
                    <Shield className="w-4 h-4" />
                    <span>{t('admin')}</span>
                  </Link>
                )}
                <button 
                  onClick={logOut}
                  className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}

            <div className="flex gap-1 md:gap-2 ml-2 md:ml-4">
              <button 
                onClick={() => setLang('en')}
                className={`px-1.5 md:px-2 py-1 rounded text-[10px] md:text-xs cursor-pointer transition-colors ${lang === 'en' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('bn')}
                className={`px-1.5 md:px-2 py-1 rounded text-[10px] md:text-xs cursor-pointer transition-colors ${lang === 'bn' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                BN
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Bottom Navigation */}
      {user && userData && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0c14]/95 backdrop-blur-md border-t border-white/10 z-50 px-4 py-3 flex justify-between items-center pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-2xl">
          {!isAdminRoute && (
            <>
              <Link to="/dashboard?tab=watch" className={`flex flex-col items-center gap-1 flex-1 ${isWatchActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <Tv className="w-5 h-5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{t('watch')}</span>
              </Link>
              <Link to="/dashboard?tab=profile" className={`flex flex-col items-center gap-1 flex-1 ${isProfileActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <User className="w-5 h-5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{t('profile')}</span>
              </Link>
            </>
          )}
          {userData.isAdmin && (
            <Link to="/admin" className={`flex flex-col items-center gap-1 flex-1 ${isAdminRoute ? 'text-pink-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <Shield className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{t('admin')}</span>
            </Link>
          )}
          <button onClick={logOut} className="flex flex-col items-center gap-1 flex-1 text-gray-500 hover:text-red-400">
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">{t('logout')}</span>
          </button>
        </div>
      )}
    </>
  );
}
