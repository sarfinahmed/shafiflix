import { useState, useEffect, FormEvent } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { Plus, Trash2, Clock, ShieldCheck, Copy, Check, Smartphone, Monitor, Tv, Globe, Edit, X, Search, Bell, Activity, Users, Film, AlertCircle, CopyCheck, RefreshCw } from 'lucide-react';
import { safeToDate, safeFormatDate, safeDifferenceInDays } from '../lib/dateUtils';

interface TokenDoc {
  id: string;
  assignedTo: string;
  tokenValue: string;
  expiresAt: Timestamp;
  durationDays: number;
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
  createdAt: Timestamp;
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

export default function Admin() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [tokens, setTokens] = useState<TokenDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  
  // Notice & System Status state
  const [notice, setNotice] = useState<NoticeSettings>({ message: '', enabled: false, type: 'info' });
  const [systemStatus, setSystemStatus] = useState<SystemStatusSettings>({ statusText: 'All Systems Operational', isOnline: true });
  const [savingNotice, setSavingNotice] = useState(false);

  // Token state
  const [newEmail, setNewEmail] = useState('');
  const [duration, setDuration] = useState<number | ''>(7);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenFilter, setTokenFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  // Product state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productRules, setProductRules] = useState('');
  const [productTargetUrl, setProductTargetUrl] = useState('');
  const [productTargetUrlMobile, setProductTargetUrlMobile] = useState('');
  const [productTargetUrlPc, setProductTargetUrlPc] = useState('');
  const [productTargetUrlTv, setProductTargetUrlTv] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'products' | 'settings'>('tokens');

  const fetchTokens = async () => {
    try {
      const q = query(collection(db, 'tokens'));
      const snapshot = await getDocs(q);
      const fetchedTokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenDoc));
      setTokens(fetchedTokens);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductDoc));
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const noticeSnap = await getDoc(doc(db, 'settings', 'notice'));
      if (noticeSnap.exists()) {
        setNotice(noticeSnap.data() as NoticeSettings);
      }
      const statusSnap = await getDoc(doc(db, 'settings', 'status'));
      if (statusSnap.exists()) {
        setSystemStatus(statusSnap.data() as SystemStatusSettings);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchProducts();
    fetchSettings();
  }, []);

  const handleCopyToken = (tokenId: string, tokenValue: string) => {
    navigator.clipboard.writeText(tokenValue);
    setCopiedTokenId(tokenId);
    showToast('Token copied to clipboard!', 'success');
    setTimeout(() => {
      setCopiedTokenId(null);
    }, 2000);
  };

  const handleCopyFullCredentials = (token: TokenDoc) => {
    const text = `Assigned To: ${token.assignedTo}\nToken: ${token.tokenValue}\nExpires: ${safeFormatDate(token.expiresAt, 'PPP')}`;
    navigator.clipboard.writeText(text);
    showToast('Full user credentials copied!', 'success');
  };

  const handleSaveNotice = async () => {
    setSavingNotice(true);
    try {
      await setDoc(doc(db, 'settings', 'notice'), notice);
      await setDoc(doc(db, 'settings', 'status'), systemStatus);
      showToast('System Notice & Status updated!', 'success');
    } catch (e) {
      showToast('Failed to update settings', 'error');
    }
    setSavingNotice(false);
  };

  const generateRandomToken = () => {
    return 'SFX-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleCreateToken = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    const days = typeof duration === 'number' && duration > 0 ? duration : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const tokenVal = generateRandomToken();
    await addDoc(collection(db, 'tokens'), {
      assignedTo: newEmail.trim().toLowerCase(),
      tokenValue: tokenVal,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      durationDays: days
    });

    showToast(`Token created for ${newEmail.trim()}`, 'success');
    setNewEmail('');
    fetchTokens();
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim()) return;

    if (editingProductId) {
      await updateDoc(doc(db, 'products', editingProductId), {
        title: productTitle.trim(),
        imageUrl: productImageUrl,
        description: productDescription,
        rules: productRules,
        targetUrl: productTargetUrl,
        targetUrlMobile: productTargetUrlMobile,
        targetUrlPc: productTargetUrlPc,
        targetUrlTv: productTargetUrlTv,
      });
      showToast('Product updated successfully!', 'success');
    } else {
      await addDoc(collection(db, 'products'), {
        title: productTitle.trim(),
        imageUrl: productImageUrl,
        description: productDescription,
        rules: productRules,
        targetUrl: productTargetUrl,
        targetUrlMobile: productTargetUrlMobile,
        targetUrlPc: productTargetUrlPc,
        targetUrlTv: productTargetUrlTv,
        createdAt: Timestamp.now()
      });
      showToast('Product created successfully!', 'success');
    }

    handleCancelEditProduct();
    fetchProducts();
  };

  const handleDuplicateProduct = async (product: ProductDoc) => {
    await addDoc(collection(db, 'products'), {
      title: `${product.title} (Copy)`,
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      rules: product.rules || '',
      targetUrl: product.targetUrl || '',
      targetUrlMobile: product.targetUrlMobile || '',
      targetUrlPc: product.targetUrlPc || '',
      targetUrlTv: product.targetUrlTv || '',
      createdAt: Timestamp.now()
    });
    showToast(`Cloned "${product.title}"`, 'info');
    fetchProducts();
  };

  const handleStartEditProduct = (product: ProductDoc) => {
    setEditingProductId(product.id);
    setProductTitle(product.title || '');
    setProductImageUrl(product.imageUrl || '');
    setProductDescription(product.description || '');
    setProductRules(product.rules || '');
    setProductTargetUrl(product.targetUrl || '');
    setProductTargetUrlMobile(product.targetUrlMobile || '');
    setProductTargetUrlPc(product.targetUrlPc || '');
    setProductTargetUrlTv(product.targetUrlTv || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setProductTitle('');
    setProductImageUrl('');
    setProductDescription('');
    setProductRules('');
    setProductTargetUrl('');
    setProductTargetUrlMobile('');
    setProductTargetUrlPc('');
    setProductTargetUrlTv('');
  };

  const handleDeleteToken = async (id: string) => {
    await deleteDoc(doc(db, 'tokens', id));
    showToast('Token deleted', 'info');
    fetchTokens();
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
    showToast('Product deleted', 'info');
    fetchProducts();
  };

  const handleExtend = async (id: string, currentExpiresAt: Timestamp, extraDays: number) => {
    const baseDate = currentExpiresAt.toDate() < new Date() ? new Date() : currentExpiresAt.toDate();
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + extraDays);
    
    await updateDoc(doc(db, 'tokens', id), {
      expiresAt: Timestamp.fromDate(newExpiresAt)
    });
    showToast(`Extended validity by +${extraDays} days!`, 'success');
    fetchTokens();
  };

  const handleExpireNow = async (id: string) => {
    await updateDoc(doc(db, 'tokens', id), {
      expiresAt: Timestamp.fromDate(new Date(Date.now() - 1000))
    });
    showToast('Token expired immediately', 'info');
    fetchTokens();
  };

  // Metrics computation
  const activeTokensCount = tokens.filter(t => {
    const d = safeToDate(t.expiresAt);
    return d ? d > new Date() : false;
  }).length;

  const expiringSoonCount = tokens.filter(t => {
    const daysLeft = safeDifferenceInDays(t.expiresAt);
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  const expiredTokensCount = tokens.filter(t => {
    const d = safeToDate(t.expiresAt);
    return d ? d <= new Date() : true;
  }).length;

  // Filtered tokens
  const filteredTokens = tokens.filter(tok => {
    const matchesSearch = (tok.assignedTo || '').toLowerCase().includes(tokenSearch.toLowerCase()) || 
                          (tok.tokenValue || '').toLowerCase().includes(tokenSearch.toLowerCase());
    if (!matchesSearch) return false;

    const d = safeToDate(tok.expiresAt);
    const isExpired = d ? d <= new Date() : true;
    const daysLeft = safeDifferenceInDays(tok.expiresAt);

    if (tokenFilter === 'active') return !isExpired;
    if (tokenFilter === 'expiring') return !isExpired && daysLeft <= 7;
    if (tokenFilter === 'expired') return isExpired;
    return true;
  });

  // Filtered products
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.targetUrl.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-1 sm:px-0">
      {/* Top Admin Bar & Tab Switching */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4 border-b border-white/10 pb-5 md:pb-6">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 text-pink-500 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">{t('adminPanelTitle')}</h1>
            <p className="text-[11px] sm:text-xs text-gray-400">Shafiflix Service & Token Access Management</p>
          </div>
        </div>
        <div className="grid grid-cols-3 md:flex space-x-0 md:space-x-2 gap-1 md:gap-0 bg-[#0c0c14] p-1.5 rounded-xl border border-white/5 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('tokens')}
            className={`px-2 sm:px-5 py-2.5 md:py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'tokens' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t('tokenManagement')} ({tokens.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-2 sm:px-5 py-2.5 md:py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t('productCatalog')} ({products.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-2 sm:px-5 py-2.5 md:py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'settings' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{t('systemSettingsNotices')}</span>
          </button>
        </div>
      </div>

      {/* Admin Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Tokens</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">{tokens.length}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400 shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Active</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{activeTokensCount}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Expiring (&lt;7d)</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{expiringSoonCount}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Services</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400">{products.length}</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Notice & System Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-6 shadow-lg max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Broadcast Notice & System Status</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                <span>Display Announcement Notice to Users</span>
                <input 
                  type="checkbox"
                  checked={notice.enabled}
                  onChange={e => setNotice(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded bg-gray-900 border-gray-700"
                />
              </label>
              <textarea 
                value={notice.message}
                onChange={e => setNotice(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Type notice for all users (e.g. Server maintenance scheduled at 10 PM. Preferred browser: Microsoft Edge)"
                className="w-full bg-[#11111d] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Notice Badge Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNotice(prev => ({ ...prev, type: 'info' }))}
                  className={`p-2.5 rounded-lg border text-xs font-bold ${notice.type === 'info' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/30 border-white/5 text-gray-400'}`}
                >
                  Information
                </button>
                <button
                  type="button"
                  onClick={() => setNotice(prev => ({ ...prev, type: 'warning' }))}
                  className={`p-2.5 rounded-lg border text-xs font-bold ${notice.type === 'warning' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-black/30 border-white/5 text-gray-400'}`}
                >
                  Warning
                </button>
                <button
                  type="button"
                  onClick={() => setNotice(prev => ({ ...prev, type: 'success' }))}
                  className={`p-2.5 rounded-lg border text-xs font-bold ${notice.type === 'success' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/5 text-gray-400'}`}
                >
                  Success
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <label className="block text-xs font-bold text-gray-400 uppercase">System Operational Status</label>
              <input 
                type="text"
                value={systemStatus.statusText}
                onChange={e => setSystemStatus(prev => ({ ...prev, statusText: e.target.value }))}
                placeholder="e.g. All Systems Operational 🟢"
                className="w-full bg-[#11111d] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleSaveNotice}
              disabled={savingNotice}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2 mt-4"
            >
              <Check className="w-5 h-5" />
              <span>{savingNotice ? 'Saving...' : 'Save Broadcast Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tokens Management Tab */}
      {activeTab === 'tokens' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Token Form */}
          <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-6 h-fit shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-gray-200 uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-500" />
              <span>{t('createNewToken')}</span>
            </h2>
            <form onSubmit={handleCreateToken} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('userEmail')}</label>
                <input 
                  type="email" 
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('durationDays')}</label>
                <input 
                  type="number" 
                  min={1}
                  required
                  value={duration}
                  onChange={e => {
                    const val = e.target.value;
                    setDuration(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                  }}
                  placeholder="Enter custom duration in days"
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors text-sm"
                />
                <div className="flex gap-1.5 flex-wrap mt-2.5">
                  {[1, 7, 15, 30, 60, 90, 365].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-colors ${
                        duration === d
                          ? 'bg-pink-600 border-pink-500 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase tracking-widest rounded-lg px-4 py-3 transition-colors flex items-center justify-center space-x-2 mt-4 shadow-[0_0_15px_rgba(219,39,119,0.3)]"
              >
                <Plus className="w-5 h-5" />
                <span>{t('generateTokenBtn')}</span>
              </button>
            </form>
          </div>

          {/* Tokens List & Filter Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0c0c14] border border-white/5 p-4 rounded-2xl">
              <div className="relative w-full sm:w-auto flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={tokenSearch}
                  onChange={e => setTokenSearch(e.target.value)}
                  placeholder={t('searchTokens')}
                  className="w-full pl-9 pr-4 py-2 bg-[#11111d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'active', 'expiring', 'expired'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTokenFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                      tokenFilter === f
                        ? 'bg-pink-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {f === 'all' ? t('filterAll') : f === 'active' ? t('filterActive') : f === 'expiring' ? t('filterExpiring') : t('filterExpired')}
                  </button>
                ))}
              </div>
            </div>

            {filteredTokens.map(token => {
              const expiresDate = safeToDate(token.expiresAt);
              const isExpired = expiresDate ? expiresDate < new Date() : true;
              const daysRemaining = safeDifferenceInDays(token.expiresAt);
              
              return (
                <div key={token.id} className="bg-[#11111d] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md transition-colors hover:border-white/10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-bold text-sm">{token.assignedTo}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyFullCredentials(token)}
                        className="px-2 py-0.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded text-[10px] font-bold uppercase transition-colors border border-purple-500/20 flex items-center gap-1"
                        title="Copy All Credentials"
                      >
                        <CopyCheck className="w-3 h-3" />
                        <span>Copy All</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base text-blue-400 font-bold tracking-widest">{token.tokenValue}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyToken(token.id, token.tokenValue)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors border border-white/5 flex items-center gap-1 text-xs"
                        title="Copy token"
                      >
                        {copiedTokenId === token.id ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        Exp: {safeFormatDate(token.expiresAt, 'PPP')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isExpired 
                          ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                          : daysRemaining <= 7 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {isExpired 
                          ? 'Expired' 
                          : `${daysRemaining} days remaining`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/5 shrink-0">
                    <button 
                      onClick={() => handleExtend(token.id, token.expiresAt, 7)}
                      className="text-xs font-bold uppercase py-2 sm:py-1.5 px-1 sm:px-2.5 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/5 text-center"
                    >
                      +7d
                    </button>
                    <button 
                      onClick={() => handleExtend(token.id, token.expiresAt, 30)}
                      className="text-xs font-bold uppercase py-2 sm:py-1.5 px-1 sm:px-2.5 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/5 text-center"
                    >
                      +30d
                    </button>
                    <button 
                      onClick={() => handleExtend(token.id, token.expiresAt, 90)}
                      className="text-xs font-bold uppercase py-2 sm:py-1.5 px-1 sm:px-2.5 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/5 text-center"
                    >
                      +90d
                    </button>
                    {!isExpired ? (
                      <button 
                        onClick={() => handleExpireNow(token.id)}
                        className="text-xs font-bold uppercase py-2 sm:py-1.5 px-1 sm:px-2.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-colors border border-amber-500/20 text-center truncate"
                      >
                        Expire
                      </button>
                    ) : (
                      <div className="hidden sm:block"></div>
                    )}
                    <button 
                      onClick={() => handleDeleteToken(token.id)}
                      className="py-2 sm:p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 flex items-center justify-center"
                      title="Delete Token"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredTokens.length === 0 && (
              <div className="text-center p-12 bg-[#11111d] border border-white/5 rounded-2xl text-gray-500 shadow-md">
                No matching tokens found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Management Tab */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit Product Form */}
          <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-6 h-fit shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                {editingProductId ? (
                  <>
                    <Edit className="w-5 h-5 text-blue-400" />
                    <span>Edit Product</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-blue-400" />
                    <span>Create Product</span>
                  </>
                )}
              </h2>
              {editingProductId && (
                <button
                  type="button"
                  onClick={handleCancelEditProduct}
                  className="px-2.5 py-1 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            {editingProductId && (
              <div className="mb-4 p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center justify-between">
                <span>Editing item details</span>
                <span className="font-bold text-white truncate max-w-[150px]">{productTitle}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title *</label>
                <input 
                  type="text" 
                  required
                  value={productTitle}
                  onChange={e => setProductTitle(e.target.value)}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Product Title"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Image URL</label>
                <input 
                  type="url" 
                  value={productImageUrl}
                  onChange={e => setProductImageUrl(e.target.value)}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                  <button
                    type="button"
                    onClick={() => setProductDescription("Shafiflix Premium Exclusive Content. Enjoy high-speed streaming on your verified device with full HD/4K quality.")}
                    className="text-[10px] font-bold uppercase text-blue-400 hover:underline"
                  >
                    + Preset Description
                  </button>
                </div>
                <textarea 
                  value={productDescription}
                  onChange={e => setProductDescription(e.target.value)}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Rules & Terms</label>
                  <button
                    type="button"
                    onClick={() => setProductRules("1. Do not share, copy, inspect, or leak direct video/stream URLs.\n2. Any link tampering, network interception, or URL extraction will result in immediate PERMANENT ACCOUNT BAN without refund.\n3. One active device per session strictly enforced.")}
                    className="text-[10px] font-bold uppercase text-amber-400 hover:underline"
                  >
                    + Strict Rules Preset
                  </button>
                </div>
                <textarea 
                  value={productRules}
                  onChange={e => setProductRules(e.target.value)}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                  placeholder="Rules for using this product..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Default Target URL (Optional)</span>
                </label>
                <input 
                  type="text" 
                  value={productTargetUrl}
                  onChange={e => setProductTargetUrl(e.target.value)}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  placeholder="https://default-link.com/content or custom link"
                />
              </div>

              <div className="pt-2 border-t border-white/5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Device Specific Links (Optional)</p>
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Mobile Link</span>
                  </label>
                  <input 
                    type="text" 
                    value={productTargetUrlMobile}
                    onChange={e => setProductTargetUrlMobile(e.target.value)}
                    className="w-full bg-[#11111d] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-xs"
                    placeholder="https://mobile-link.com/content"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PC / Laptop Link</span>
                  </label>
                  <input 
                    type="text" 
                    value={productTargetUrlPc}
                    onChange={e => setProductTargetUrlPc(e.target.value)}
                    className="w-full bg-[#11111d] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-xs"
                    placeholder="https://pc-link.com/content"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <span>Smart TV Link</span>
                  </label>
                  <input 
                    type="text" 
                    value={productTargetUrlTv}
                    onChange={e => setProductTargetUrlTv(e.target.value)}
                    className="w-full bg-[#11111d] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors text-xs"
                    placeholder="https://tv-link.com/content"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-lg px-4 py-3 transition-colors flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  {editingProductId ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Update Product</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Create Product</span>
                    </>
                  )}
                </button>
                {editingProductId && (
                  <button 
                    type="button"
                    onClick={handleCancelEditProduct}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Products List & Search */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative w-full bg-[#0c0c14] border border-white/5 p-4 rounded-2xl">
              <Search className="w-4 h-4 text-gray-400 absolute left-7 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products by title or URL..."
                className="w-full pl-9 pr-4 py-2 bg-[#11111d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {filteredProducts.map(product => (
              <div key={product.id} className="bg-[#11111d] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-md transition-colors hover:border-white/10 overflow-hidden max-w-full">
                {product.imageUrl && (
                  <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/50">
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
                  <div className="min-w-0 max-w-full">
                    <h3 className="text-xl font-bold text-white mb-2 truncate">{product.title}</h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="space-y-1.5 w-full max-w-full overflow-hidden">
                      {/* Shafiflix Gatekeeper Proxy Link */}
                      <div className="text-xs text-emerald-300 font-mono bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-2 max-w-full overflow-hidden">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold uppercase text-[10px] text-emerald-400 block mb-0.5">🛡️ Shafiflix Gatekeeper Proxy Link (Token Required):</span>
                          <span className="truncate block max-w-full text-white">{`${window.location.origin}/gatekeeper/${product.id}`}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/gatekeeper/${product.id}`);
                            showToast('Gatekeeper Proxy Link copied to clipboard!', 'success');
                          }}
                          className="px-2.5 py-1 bg-emerald-500 text-black font-bold text-[10px] uppercase rounded-lg hover:bg-emerald-400 transition-colors shrink-0"
                        >
                          Copy
                        </button>
                      </div>

                      {product.targetUrl && (
                        <div className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 break-all max-w-full overflow-hidden">
                          <span className="font-bold uppercase text-[10px] text-blue-300 block mb-0.5">Default Raw Destination:</span>
                          <span className="truncate block max-w-full">{product.targetUrl}</span>
                        </div>
                      )}
                      {product.targetUrlMobile && (
                        <div className="text-xs text-purple-400 font-mono bg-purple-500/10 px-2.5 py-1.5 rounded-lg border border-purple-500/20 break-all max-w-full overflow-hidden">
                          <span className="font-bold uppercase text-[10px] text-purple-300 block mb-0.5">📱 Mobile Link:</span>
                          <span className="truncate block max-w-full">{product.targetUrlMobile}</span>
                        </div>
                      )}
                      {product.targetUrlPc && (
                        <div className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 break-all max-w-full overflow-hidden">
                          <span className="font-bold uppercase text-[10px] text-emerald-300 block mb-0.5">💻 PC Link:</span>
                          <span className="truncate block max-w-full">{product.targetUrlPc}</span>
                        </div>
                      )}
                      {product.targetUrlTv && (
                        <div className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 break-all max-w-full overflow-hidden">
                          <span className="font-bold uppercase text-[10px] text-amber-300 block mb-0.5">📺 Smart TV Link:</span>
                          <span className="truncate block max-w-full">{product.targetUrlTv}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-2 mt-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <button 
                      onClick={() => handleDuplicateProduct(product)}
                      className="px-3 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-colors border border-purple-500/20 flex items-center justify-center gap-1.5 shrink-0"
                      title="Duplicate Product"
                    >
                      <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Clone</span>
                    </button>
                    <button 
                      onClick={() => handleStartEditProduct(product)}
                      className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors border border-blue-500/20 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-center p-12 bg-[#11111d] border border-white/5 rounded-2xl text-gray-500 shadow-md">
                No matching products found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

