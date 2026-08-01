import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, AlertTriangle, Clock, X, ExternalLink, Play, Tv, User, Smartphone, Monitor, Globe, Search, Heart, Copy, Check, Bell, ShieldCheck, Sparkles, Filter, Info, ChevronRight } from 'lucide-react';
import { safeToDate, safeFormatDistanceToNow } from '../lib/dateUtils';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface TokenData {
  id: string;
  tokenValue: string;
  expiresAt: Timestamp;
}

interface ProductDoc {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  rules: string;
  targetUrl: string;
  targetUrlMobile?: string;
  targetUrlPc?: string;
  targetUrlTv?: string;
}

interface NoticeSettings {
  message: string;
  enabled: boolean;
  type: 'info' | 'warning' | 'success';
}

interface SystemStatusSettings {
  statusText: string;
  isOnline: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [token, setToken] = useState<TokenData | null>(null);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [notice, setNotice] = useState<NoticeSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusSettings | null>(null);
  const [dismissNotice, setDismissNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDoc | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<'default' | 'mobile' | 'pc' | 'tv'>('default');
  const initialTab = searchParams.get('tab') === 'profile' ? 'profile' : 'watch';
  const [activeTab, setActiveTab] = useState<'watch' | 'profile'>(initialTab);
  const [openInEdge, setOpenInEdge] = useState<boolean>(true);
  const [tokenCopied, setTokenCopied] = useState<boolean>(false);
  
  // Dashboard Search, Filter & Favorites state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'favorites' | 'mobile' | 'pc' | 'tv'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shafiflix_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const tokenRef = useRef<HTMLDivElement>(null);

  // Auto detect user device type
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/TV|SmartTV|GoogleTV|HbbTV|NetCast|AppTV|AndroidTV/i.test(ua)) {
      setSelectedDevice('tv');
    } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      setSelectedDevice('mobile');
    } else {
      setSelectedDevice('pc');
    }
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'profile' || tabParam === 'watch') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'watch' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(productId);
      const updated = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem('shafiflix_favorites', JSON.stringify(updated));
      showToast(isFav ? 'Removed from Favorites' : 'Saved to Favorites!', isFav ? 'info' : 'success');
      return updated;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const userEmail = userData?.email || user?.email;
      try {
        if (userEmail) {
          const q = query(collection(db, 'tokens'), where('assignedTo', '==', userEmail.toLowerCase()));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            setToken({ id: docSnap.id, ...docSnap.data() } as TokenData);
          }
        }

        const pQ = query(collection(db, 'products'));
        const pSnap = await getDocs(pQ);
        const fetchedProducts = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductDoc));
        setProducts(fetchedProducts);

        // Fetch notice and status
        const noticeSnap = await getDoc(doc(db, 'settings', 'notice'));
        if (noticeSnap.exists()) {
          setNotice(noticeSnap.data() as NoticeSettings);
        }

        const statusSnap = await getDoc(doc(db, 'settings', 'status'));
        if (statusSnap.exists()) {
          setSystemStatus(statusSnap.data() as SystemStatusSettings);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, userData]);

  // Anti-copy logic
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
    };

    if (revealed || selectedProduct) {
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [revealed, selectedProduct]);

  if (loading) return <div className="min-h-[80vh] flex items-center justify-center text-blue-400 font-bold">Loading Shafiflix Portal...</div>;

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-zinc-400 text-xl">
        {t('noToken')}
      </div>
    );
  }

  const expDate = safeToDate(token?.expiresAt);
  const isExpired = expDate ? expDate < new Date() : true;

  const handleCopyToken = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token?.tokenValue) return;
    navigator.clipboard.writeText(token.tokenValue);
    setTokenCopied(true);
    showToast('Subscription Token copied to clipboard!', 'success');
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleOpenGatekeeperInEdge = (productId: string, device: string) => {
    const gkUrl = `${window.location.origin}/gatekeeper/${productId}?device=${device}`;
    const edgeUri = `microsoft-edge:${gkUrl}`;

    showToast('Launching Protected Gatekeeper Stream in Microsoft Edge...', 'info');

    const a = document.createElement('a');
    a.href = edgeUri;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  };

  const handleOpenDirectInEdge = (rawUrl: string, useEdge: boolean = openInEdge) => {
    if (!rawUrl) return;
    let url = rawUrl.trim();
    if (!url.includes('://') && !url.includes(':')) {
      url = `https://${url}`;
    }
    const targetUri = useEdge ? `microsoft-edge:${url}` : url;

    showToast(useEdge ? 'Opening stream directly in Microsoft Edge...' : 'Opening stream URL in browser...', 'info');

    const a = document.createElement('a');
    a.href = targetUri;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  };

  const handleQuickCopyLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (!url) return;
    navigator.clipboard.writeText(url);
    showToast('Direct URL copied to clipboard!', 'success');
  };

  const handleCopyGatekeeperLink = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    const gkUrl = `${window.location.origin}/gatekeeper/${productId}`;
    navigator.clipboard.writeText(gkUrl);
    showToast('Shafiflix Gatekeeper Proxy Link copied!', 'success');
  };

  const getDeviceLink = (product: ProductDoc, device: 'default' | 'mobile' | 'pc' | 'tv') => {
    if (device === 'mobile' && product.targetUrlMobile) return product.targetUrlMobile;
    if (device === 'pc' && product.targetUrlPc) return product.targetUrlPc;
    if (device === 'tv' && product.targetUrlTv) return product.targetUrlTv;
    return product.targetUrl;
  };

  // Filtered Products for Dashboard
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter === 'favorites') return favorites.includes(p.id);
    if (categoryFilter === 'mobile') return Boolean(p.targetUrlMobile);
    if (categoryFilter === 'pc') return Boolean(p.targetUrlPc);
    if (categoryFilter === 'tv') return Boolean(p.targetUrlTv);
    return true;
  });

  return (
    <div className="flex flex-col gap-6 h-full max-w-6xl mx-auto w-full pt-2 md:pt-4">
      {/* Broadcast System Notice Banner */}
      {notice && notice.enabled && notice.message && !dismissNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs md:text-sm shadow-xl backdrop-blur-md ${
            notice.type === 'warning'
              ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
              : notice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
            <span className="font-medium leading-relaxed">{notice.message}</span>
          </div>
          <button
            onClick={() => setDismissNotice(true)}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* System Status Pill Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0c14] border border-white/5 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-xl border border-white/10">
            <div className={`w-2 h-2 rounded-full ${systemStatus?.isOnline !== false ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
            <span className="text-xs font-bold text-gray-300">
              {systemStatus?.statusText || t('systemOperational')}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
            <span>Device Mode:</span>
            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 font-bold uppercase text-[10px]">
              {selectedDevice}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('watch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === 'watch' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>{t('watch')} ({products.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t('profile')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">Active Vault</h2>
                  <p className="text-gray-500 text-sm italic">Select a content pack to reveal your access token</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-blue-400 block mb-1">Account Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]'}`}></div>
                    <span className="text-sm font-mono uppercase text-gray-300">{isExpired ? 'ACCESS DENIED' : 'SECURE CONNECTION'}</span>
                  </div>
                </div>
              </div>

              {isExpired ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="group relative bg-[#11111d] border border-red-500/20 rounded-xl overflow-hidden opacity-80 max-w-md mx-auto lg:mx-0"
                >
                  <div className="h-48 bg-gradient-to-t from-[#11111d] to-red-900/40 relative">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <span className="text-xs font-bold uppercase tracking-[0.5em] text-red-500">{t('accessDenied')}</span>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Status</div>
                      <h3 className="text-lg font-bold">Access Revoked</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <button disabled className="w-full py-3 bg-white/5 rounded-lg text-sm font-bold uppercase tracking-wider cursor-not-allowed text-gray-500">
                      Access Denied
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="group relative bg-[#11111d] border border-white/5 rounded-xl overflow-hidden shadow-2xl max-w-md w-full no-select neon-glow transition-all mx-auto lg:mx-0"
                >
                  <div className={`h-48 relative transition-colors duration-500 ${revealed ? 'bg-gradient-to-t from-[#11111d] to-purple-900/40' : 'bg-gradient-to-t from-[#11111d] to-blue-900/40'}`}>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${revealed ? 'text-purple-400' : 'text-blue-400'}`}>Premium Access</div>
                        <h3 className="text-lg font-bold">{t('myToken')}</h3>
                      </div>
                      <Lock className={`w-5 h-5 ${revealed ? 'text-purple-400 opacity-50' : 'text-blue-400 opacity-50'}`} />
                    </div>
                  </div>
                  
                  <div className="p-4" ref={tokenRef}>
                    <AnimatePresence mode="wait">
                      {!revealed ? (
                        <motion.button 
                          key="hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setRevealed(true)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-colors flex items-center justify-center gap-2"
                        >
                          {t('tokenReveal')}
                        </motion.button>
                      ) : (
                        <motion.div
                          key="revealed"
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full p-4 bg-black/60 border border-purple-500/30 rounded-xl flex flex-col items-center gap-3 text-center"
                        >
                          <div className="w-full p-3 bg-purple-950/30 border border-purple-500/20 rounded-lg">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 block mb-1">{t('activeTokenLabel')}</span>
                            <p className="text-xl md:text-2xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 break-all select-text">
                              {token.tokenValue}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyToken}
                            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            {tokenCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            <span>{tokenCopied ? t('tokenCopied') : t('copyToken')}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <aside className="w-full lg:w-72 bg-[#0c0c14] border border-white/5 rounded-2xl p-6 flex flex-col h-fit">
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t('currentSubscription')}</h3>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className={`text-2xl font-mono font-bold mb-1 ${isExpired ? 'text-red-400' : 'text-blue-400'}`}>
                  {isExpired ? t('expired') : safeFormatDistanceToNow(token?.expiresAt, t('expired'))}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">{t('timeRemaining')}</div>
                {!isExpired && (
                  <div className="w-full bg-white/10 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full w-2/3 shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{t('securityStatus')}</h3>
              <ul className="space-y-4">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('profileStatus')}</span>
                  <span className="text-green-500 font-bold">{t('verified')}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('copyProtection')}</span>
                  <span className="text-blue-500 font-bold">{t('armed')}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('deviceLink')}</span>
                  <span className="text-gray-500">{t('active')}</span>
                </li>
              </ul>
            </div>

            <div className="mt-auto">
              <div className="p-4 border border-dashed border-white/20 rounded-xl">
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                  "{t('securityNote')}"
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center">
                    <span className="text-[8px] text-blue-500 italic">i</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-blue-400">Security Policy</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* WATCH CONTENT SECTION */}
      {activeTab === 'watch' && (
        <div className="flex-1 space-y-6">
          {/* Search Bar & Category Pills */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0c0c14] border border-white/5 p-4 rounded-2xl shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 bg-[#11111d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  categoryFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {t('allContent')}
              </button>
              <button
                onClick={() => setCategoryFilter('favorites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1 ${
                  categoryFilter === 'favorites' ? 'bg-pink-600 text-white shadow' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{t('favorites')} ({favorites.length})</span>
              </button>
              <button
                onClick={() => setCategoryFilter('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1 ${
                  categoryFilter === 'mobile' ? 'bg-purple-600 text-white shadow' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t('mobile')}</span>
              </button>
              <button
                onClick={() => setCategoryFilter('pc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1 ${
                  categoryFilter === 'pc' ? 'bg-emerald-600 text-white shadow' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{t('pcLink')}</span>
              </button>
              <button
                onClick={() => setCategoryFilter('tv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1 ${
                  categoryFilter === 'tv' ? 'bg-amber-600 text-white shadow' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{t('smartTv')}</span>
              </button>
            </div>
          </div>

          {isExpired ? (
            <div className="text-center p-12 bg-[#11111d] border border-red-500/20 rounded-2xl text-red-500 shadow-md">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">{t('accessDenied')}</h3>
              <p className="text-sm">{t('accessExpiredMsg')}</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  const isFav = favorites.includes(product.id);

                  return (
                    <motion.div 
                      key={product.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedProduct(product)}
                      className="bg-[#11111d] border border-white/5 hover:border-blue-500/40 rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all group flex flex-col"
                    >
                      <div className="h-44 bg-black/50 relative overflow-hidden shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-10 h-10 text-blue-500/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#11111d] via-transparent to-black/30"></div>

                        {/* Top Badges and Favorite Heart */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                          <div className="flex items-center gap-1">
                            {product.targetUrlMobile && <Smartphone className="w-3.5 h-3.5 text-purple-400 drop-shadow" />}
                            {product.targetUrlPc && <Monitor className="w-3.5 h-3.5 text-emerald-400 drop-shadow" />}
                            {product.targetUrlTv && <Tv className="w-3.5 h-3.5 text-amber-400 drop-shadow" />}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(e, product.id)}
                            className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                              isFav ? 'bg-pink-600/80 text-white' : 'bg-black/50 text-gray-400 hover:text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-white' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-blue-400 transition-colors">{product.title}</h3>
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600/15 to-purple-600/15 hover:from-blue-600/25 hover:to-purple-600/25 text-blue-300 border border-blue-500/20 rounded-xl font-medium text-xs flex items-center justify-between transition-all group-hover:border-blue-500/40 cursor-pointer shadow-sm"
                          >
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{t('viewRulesAndLink')}</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-[#11111d] border border-white/5 rounded-2xl text-gray-500 shadow-md">
              {t('noContentFound')}
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && !isExpired && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-select overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0c0c14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black text-gray-300 hover:text-white rounded-full transition-colors z-30 shadow-lg border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              
              {selectedProduct.imageUrl && (
                <div className="h-48 md:h-64 w-full relative shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-transparent to-transparent z-0" />
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="p-6 md:p-8 overflow-y-auto flex-1 max-w-full">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 break-words">{selectedProduct.title}</h2>
                
                {selectedProduct.description && (
                  <div className="mb-6 max-w-full overflow-hidden">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">{t('description')}</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{selectedProduct.description}</p>
                  </div>
                )}
                
                {selectedProduct.rules && (
                  <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 rounded-xl max-w-full overflow-hidden">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {t('importantRules')}
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{selectedProduct.rules}</p>
                  </div>
                )}

                {/* Device Selector */}
                <div className="mb-6 p-4 bg-[#11111d] border border-white/5 rounded-xl max-w-full overflow-hidden">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                    <span>{t('selectDeviceMode')}</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('default')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'default' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{t('defaultMode')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('mobile')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'mobile' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{t('mobile')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('pc')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'pc' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>{t('pcLaptopMode')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('tv')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'tv' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>{t('smartTv')}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2.5 italic flex items-center gap-1 truncate max-w-full">
                    <span>{t('targetLink')}</span>
                    <span className="font-bold text-white uppercase">{selectedDevice}</span>
                    {getDeviceLink(selectedProduct, selectedDevice) !== selectedProduct.targetUrl && (
                      <span className="text-purple-400 font-normal truncate">{t('deviceSpecificActive')}</span>
                    )}
                  </p>
                </div>
                
                {/* Edge Browser & Launch controls */}
                <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-4">
                  <label className="flex items-center gap-3 cursor-pointer bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl hover:bg-blue-900/20 transition-colors">
                    <input 
                      type="checkbox"
                      checked={openInEdge}
                      onChange={e => setOpenInEdge(e.target.checked)}
                      className="w-4 h-4 text-blue-500 rounded border-gray-700 bg-gray-900 focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{t('openInEdgeLabel')}</span>
                      </span>
                      <span className="text-[11px] text-gray-400">{t('openInEdgeSubtitle')}</span>
                    </div>
                  </label>

                  <button 
                    type="button"
                    onClick={() => handleOpenDirectInEdge(getDeviceLink(selectedProduct, selectedDevice), openInEdge)}
                    className="w-full px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{openInEdge ? t('launchInEdge') : t('openStreamLink')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

