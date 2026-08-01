import { useState, useEffect, FormEvent } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useI18n } from '../contexts/I18nContext';
import { Plus, Trash2, Clock, ShieldCheck, Copy, Check, Smartphone, Monitor, Tv, Globe } from 'lucide-react';
import { format } from 'date-fns';

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

export default function Admin() {
  const { t } = useI18n();
  const [tokens, setTokens] = useState<TokenDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  
  // Token state
  const [newEmail, setNewEmail] = useState('');
  const [duration, setDuration] = useState<number>(7);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const handleCopyToken = (tokenId: string, tokenValue: string) => {
    navigator.clipboard.writeText(tokenValue);
    setCopiedTokenId(tokenId);
    setTimeout(() => {
      setCopiedTokenId(null);
    }, 2000);
  };

  // Product state
  const [productTitle, setProductTitle] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productRules, setProductRules] = useState('');
  const [productTargetUrl, setProductTargetUrl] = useState('');
  const [productTargetUrlMobile, setProductTargetUrlMobile] = useState('');
  const [productTargetUrlPc, setProductTargetUrlPc] = useState('');
  const [productTargetUrlTv, setProductTargetUrlTv] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'products'>('tokens');

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

  useEffect(() => {
    fetchTokens();
    fetchProducts();
  }, []);

  const generateRandomToken = () => {
    return 'SFX-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleCreateToken = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    await addDoc(collection(db, 'tokens'), {
      assignedTo: newEmail,
      tokenValue: generateRandomToken(),
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      durationDays: duration
    });

    setNewEmail('');
    fetchTokens();
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!productTitle || !productTargetUrl) return;

    await addDoc(collection(db, 'products'), {
      title: productTitle,
      imageUrl: productImageUrl,
      description: productDescription,
      rules: productRules,
      targetUrl: productTargetUrl,
      targetUrlMobile: productTargetUrlMobile,
      targetUrlPc: productTargetUrlPc,
      targetUrlTv: productTargetUrlTv,
      createdAt: Timestamp.now()
    });

    setProductTitle('');
    setProductImageUrl('');
    setProductDescription('');
    setProductRules('');
    setProductTargetUrl('');
    setProductTargetUrlMobile('');
    setProductTargetUrlPc('');
    setProductTargetUrlTv('');
    fetchProducts();
  };

  const handleDeleteToken = async (id: string) => {
    await deleteDoc(doc(db, 'tokens', id));
    fetchTokens();
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
    fetchProducts();
  };

  const handleExtend = async (id: string, currentExpiresAt: Timestamp, extraDays: number) => {
    const newExpiresAt = new Date(currentExpiresAt.toDate());
    newExpiresAt.setDate(newExpiresAt.getDate() + extraDays);
    
    await updateDoc(doc(db, 'tokens', id), {
      expiresAt: Timestamp.fromDate(newExpiresAt)
    });
    fetchTokens();
  };

  const handleExpireNow = async (id: string) => {
    await updateDoc(doc(db, 'tokens', id), {
      expiresAt: Timestamp.fromDate(new Date(Date.now() - 1000))
    });
    fetchTokens();
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">{t('adminPanel')}</h1>
        </div>
        <div className="flex space-x-2 bg-[#0c0c14] p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('tokens')}
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'tokens' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Tokens
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Products
          </button>
        </div>
      </div>

      {activeTab === 'tokens' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Token Form */}
          <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-6 h-fit shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-gray-200 uppercase tracking-widest">{t('createToken')}</h2>
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('duration')}</label>
                <select 
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors appearance-none"
                >
                  <option value={7}>7 Days</option>
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase tracking-widest rounded-lg px-4 py-3 transition-colors flex items-center justify-center space-x-2 mt-4 shadow-[0_0_15px_rgba(219,39,119,0.3)]"
              >
                <Plus className="w-5 h-5" />
                <span>{t('createToken')}</span>
              </button>
            </form>
          </div>

          {/* Tokens List */}
          <div className="lg:col-span-2 space-y-4">
            {tokens.map(token => {
              const isExpired = token.expiresAt.toDate() < new Date();
              
              return (
                <div key={token.id} className="bg-[#11111d] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md transition-colors hover:border-white/10">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">{token.assignedTo}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg text-blue-400 font-bold tracking-widest">{token.tokenValue}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyToken(token.id, token.tokenValue)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors border border-white/5 flex items-center gap-1 text-xs"
                        title="Copy token"
                      >
                        {copiedTokenId === token.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-[10px] text-green-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Exp: {format(token.expiresAt.toDate(), 'PPP')}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isExpired ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                        {isExpired ? t('expired') : 'Active'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleExtend(token.id, token.expiresAt, 7)}
                      className="text-xs font-bold uppercase px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                    >
                      +7 Days
                    </button>
                    {!isExpired && (
                      <button 
                        onClick={() => handleExpireNow(token.id)}
                        className="text-xs font-bold uppercase px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                      >
                        Expire
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteToken(token.id)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {tokens.length === 0 && (
              <div className="text-center p-12 bg-[#11111d] border border-white/5 rounded-2xl text-gray-500 shadow-md">
                No tokens created yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Product Form */}
          <div className="bg-[#0c0c14] border border-white/5 rounded-2xl p-6 h-fit shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-gray-200 uppercase tracking-widest">Create Product</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                <textarea 
                  value={productDescription}
                  onChange={e => setProductDescription(e.target.value)}
                  className="w-full bg-[#11111d] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rules</label>
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
                  <span>Default Target URL (All Devices) *</span>
                </label>
                <input 
                  type="text" 
                  required
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

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-lg px-4 py-3 transition-colors flex items-center justify-center space-x-2 mt-4 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                <Plus className="w-5 h-5" />
                <span>Create Product</span>
              </button>
            </form>
          </div>

          {/* Products List */}
          <div className="lg:col-span-2 space-y-4">
            {products.map(product => (
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
                      <div className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 break-all max-w-full overflow-hidden">
                        <span className="font-bold uppercase text-[10px] text-blue-300 block mb-0.5">Default Link:</span>
                        <span className="truncate block max-w-full">{product.targetUrl}</span>
                      </div>
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
                  <div className="flex items-center justify-end mt-4">
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 flex items-center gap-2 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-center p-12 bg-[#11111d] border border-white/5 rounded-2xl text-gray-500 shadow-md">
                No products created yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
