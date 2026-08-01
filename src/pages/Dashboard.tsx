import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, AlertTriangle, Clock, X, ExternalLink, Play, Tv, User, Smartphone, Monitor, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

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

export default function Dashboard() {
  const { user, userData } = useAuth();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [token, setToken] = useState<TokenData | null>(null);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDoc | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<'default' | 'mobile' | 'pc' | 'tv'>('default');
  const initialTab = searchParams.get('tab') === 'profile' ? 'profile' : 'watch';
  const [activeTab, setActiveTab] = useState<'watch' | 'profile'>(initialTab);
  const [openInEdge, setOpenInEdge] = useState<boolean>(true);
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

  if (loading) return <div className="min-h-[80vh] flex items-center justify-center">Loading...</div>;

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-zinc-400 text-xl">
        {t('noToken')}
      </div>
    );
  }

  const isExpired = token.expiresAt.toDate() < new Date();

  const handleOpenLink = (rawUrl: string, useEdge: boolean = openInEdge) => {
    if (!rawUrl) return;
    let url = rawUrl.trim();
    
    // Auto-fix missing protocol for standard domains if no scheme provided
    if (!url.includes('://') && !url.includes(':')) {
      url = `https://${url}`;
    }
    
    let targetUri = url;
    if (useEdge) {
      if (!url.startsWith('microsoft-edge:')) {
        targetUri = `microsoft-edge:${url}`;
      }
    }

    // Launch exact URI using DOM element for maximum protocol & deep-link compatibility
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

  const getDeviceLink = (product: ProductDoc, device: 'default' | 'mobile' | 'pc' | 'tv') => {
    if (device === 'mobile' && product.targetUrlMobile) return product.targetUrlMobile;
    if (device === 'pc' && product.targetUrlPc) return product.targetUrlPc;
    if (device === 'tv' && product.targetUrlTv) return product.targetUrlTv;
    return product.targetUrl;
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-6xl mx-auto w-full pt-2 md:pt-4">
      {activeTab === 'profile' && (
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider">User Profile</h1>
          </div>
          <button 
            onClick={() => handleTabChange('watch')} 
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-blue-400 rounded-lg transition-colors flex items-center gap-2"
          >
            <Tv className="w-4 h-4" />
            <span>Go to Watch</span>
          </button>
        </div>
      )}

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
                      className="w-full p-4 bg-black/50 border border-purple-500/30 rounded-lg text-center"
                    >
                      <p className="text-xl md:text-2xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 break-all select-none">
                        {token.tokenValue}
                      </p>
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
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Current Subscription</h3>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className={`text-2xl font-mono font-bold mb-1 ${isExpired ? 'text-red-400' : 'text-blue-400'}`}>
              {isExpired ? 'Expired' : formatDistanceToNow(token.expiresAt.toDate())}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">Time Remaining until Expiry</div>
            {!isExpired && (
              <div className="w-full bg-white/10 h-1.5 mt-4 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full w-2/3 shadow-[0_0_10px_#60a5fa] animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Security Status</h3>
          <ul className="space-y-4">
            <li className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Profile Status</span>
              <span className="text-green-500 font-bold">VERIFIED</span>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Copy Protection</span>
              <span className="text-blue-500 font-bold">ARMED</span>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Device Link</span>
              <span className="text-gray-500">ACTIVE</span>
            </li>
          </ul>
        </div>

        <div className="mt-auto">
          <div className="p-4 border border-dashed border-white/20 rounded-xl">
            <p className="text-[11px] text-gray-500 leading-relaxed italic">
              "Tokens are unique and bound to this hardware. Any attempt to replicate or share access keys will result in permanent suspension."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center">
                <span className="text-[8px] text-blue-500 italic">i</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-blue-400">Security Policy v2.4</span>
            </div>
          </div>
        </div>
      </aside>
      </div>
      )}

      {activeTab === 'watch' && (
        <div className="flex-1">
          {isExpired ? (
            <div className="text-center p-12 bg-[#11111d] border border-red-500/20 rounded-2xl text-red-500 shadow-md">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Access Denied</h3>
              <p className="text-sm">Your subscription has expired. Please renew your token to access content.</p>
            </div>
          ) : products.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold mb-4 uppercase tracking-wider border-b border-white/5 pb-2">Available Content</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <motion.div 
                    key={product.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedProduct(product)}
                    className="bg-[#11111d] border border-white/5 hover:border-blue-500/30 rounded-xl overflow-hidden shadow-lg cursor-pointer transition-colors group"
                  >
                    <div className="h-40 bg-black/50 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-8 h-8 text-blue-500/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#11111d] to-transparent"></div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-white mb-2">{product.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-3">{product.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-[#11111d] border border-white/5 rounded-2xl text-gray-500 shadow-md">
              No content available at the moment.
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
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Description</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{selectedProduct.description}</p>
                  </div>
                )}
                
                {selectedProduct.rules && (
                  <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 rounded-xl max-w-full overflow-hidden">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Important Rules
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{selectedProduct.rules}</p>
                  </div>
                )}

                {/* Device Selector */}
                <div className="mb-6 p-4 bg-[#11111d] border border-white/5 rounded-xl max-w-full overflow-hidden">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                    <span>Select Device Mode:</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('default')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'default' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Default</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('mobile')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'mobile' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('pc')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'pc' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>PC / Laptop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('tv')}
                      className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${selectedDevice === 'tv' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Smart TV</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2.5 italic flex items-center gap-1 truncate max-w-full">
                    <span>Target link:</span>
                    <span className="font-bold text-white uppercase">{selectedDevice}</span>
                    {getDeviceLink(selectedProduct, selectedDevice) !== selectedProduct.targetUrl && (
                      <span className="text-purple-400 font-normal truncate">(Device specific link active)</span>
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
                        <span>Open in Microsoft Edge App</span>
                      </span>
                      <span className="text-[11px] text-gray-400">Launches Windows Microsoft Edge browser directly</span>
                    </div>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <button 
                      type="button"
                      onClick={() => handleOpenLink(getDeviceLink(selectedProduct, selectedDevice), false)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
                    >
                      <span>Standard Browser</span>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => handleOpenLink(getDeviceLink(selectedProduct, selectedDevice), openInEdge)}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>{openInEdge ? 'Open in Microsoft Edge' : 'Access Content'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
