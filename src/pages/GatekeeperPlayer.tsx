import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, AlertTriangle, Play, ExternalLink, Globe, Smartphone, Monitor, Tv, ArrowLeft, RefreshCw, EyeOff, Maximize, Minimize, Info } from 'lucide-react';
import { safeToDate, safeFormatDistanceToNow } from '../lib/dateUtils';

interface ProductDoc {
  id: string;
  title: string;
  description: string;
  targetUrl: string;
  targetUrlMobile?: string;
  targetUrlPc?: string;
  targetUrlTv?: string;
  imageUrl?: string;
  rules?: string;
}

interface TokenData {
  tokenValue: string;
  expiresAt: Timestamp;
}

export default function GatekeeperPlayer() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductDoc | null>(null);
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'default' | 'mobile' | 'pc' | 'tv'>('default');
  const [openMode, setOpenMode] = useState<'iframe' | 'launch'>('iframe');
  const [openInEdge, setOpenInEdge] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Dynamic session ticket (changes on every reload to prevent static bookmarking)
  const [sessionTicket] = useState(() => 'SFX-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase());

  useEffect(() => {
    const devParam = searchParams.get('device');
    if (devParam === 'mobile' || devParam === 'pc' || devParam === 'tv') {
      setSelectedDevice(devParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const verifyAccess = async () => {
      setLoading(true);
      const userEmail = userData?.email || user?.email;

      if (!userEmail || !id) {
        setAccessGranted(false);
        setLoading(false);
        return;
      }

      try {
        // Fetch Product
        const prodSnap = await getDoc(doc(db, 'products', id));
        if (!prodSnap.exists()) {
          showToast('Product or stream content not found', 'error');
          setLoading(false);
          return;
        }
        setProduct({ id: prodSnap.id, ...prodSnap.data() } as ProductDoc);

        // If user is Admin, automatically grant access
        if (userData?.role === 'admin') {
          setAccessGranted(true);
          // Try to get token if exists for info display
          const tokenQuery = query(collection(db, 'tokens'), where('assignedTo', '==', userEmail.toLowerCase()));
          const tokenSnap = await getDocs(tokenQuery);
          if (!tokenSnap.empty) {
            setToken(tokenSnap.docs[0].data() as TokenData);
          }
          return;
        }

        // Verify Regular User Token
        let tokenQuery = query(collection(db, 'tokens'), where('assignedTo', '==', userEmail.toLowerCase()));
        let tokenSnap = await getDocs(tokenQuery);

        if (tokenSnap.empty) {
          // Fallback to non-lowercased check
          tokenQuery = query(collection(db, 'tokens'), where('assignedTo', '==', userEmail));
          tokenSnap = await getDocs(tokenQuery);
        }

        if (!tokenSnap.empty) {
          const tDoc = tokenSnap.docs[0].data() as TokenData;
          setToken(tDoc);

          const expDate = safeToDate(tDoc.expiresAt);
          const isExpired = expDate ? expDate < new Date() : true;
          if (!isExpired) {
            setAccessGranted(true);
          } else {
            setAccessGranted(false);
          }
        } else {
          setAccessGranted(false);
        }
      } catch (err) {
        console.error('Error verifying gatekeeper access:', err);
        setAccessGranted(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [id, user, userData]);

  const getTargetUrl = () => {
    if (!product) return '';
    if (selectedDevice === 'mobile' && product.targetUrlMobile) return product.targetUrlMobile;
    if (selectedDevice === 'pc' && product.targetUrlPc) return product.targetUrlPc;
    if (selectedDevice === 'tv' && product.targetUrlTv) return product.targetUrlTv;
    return product.targetUrl;
  };

  const handleLaunchExternal = (useEdge: boolean) => {
    const rawUrl = getTargetUrl();
    if (!rawUrl) return;

    let url = rawUrl.trim();
    if (!url.includes('://') && !url.includes(':')) {
      url = `https://${url}`;
    }

    const targetUri = url;

    showToast('Opening stream in browser...', 'info');

    const a = document.createElement('a');
    a.href = targetUri;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Verifying Shafiflix Gatekeeper Ticket...</p>
      </div>
    );
  }

  if (!accessGranted || !product) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-[#0c0c14] border border-red-500/30 rounded-3xl text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-2">Gatekeeper Access Denied</h2>
          <p className="text-xs text-red-400 max-w-md mx-auto leading-relaxed">
            Direct access to raw links or bookmarks outside Shafiflix Portal is forbidden. You require an active subscription token to stream this content.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  const activeUrl = getTargetUrl();

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6 relative no-select">
      {/* Top Gatekeeper Status Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0c0c14] border border-white/10 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg font-bold text-white truncate max-w-md">{product.title}</h1>
            </div>
            <p className="text-[11px] text-gray-400">Shafiflix Gatekeeper Session Ticket: <span className="font-mono text-blue-400">{sessionTicket}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-gray-400 block uppercase">Token Status</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {safeFormatDistanceToNow(token?.expiresAt, 'ACTIVE') + ' remaining'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setOpenMode('iframe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${openMode === 'iframe' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              In-App Player
            </button>
            <button
              onClick={() => setOpenMode('launch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${openMode === 'launch' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Launch Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Player / Gatekeeper Container */}
      <div className="bg-[#0c0c14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Anti-Piracy Watermark Overlay & Fullscreen Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between">
          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-gray-300 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SHAFIFLIX DRM • USER: {user?.email}</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="pointer-events-auto bg-black/70 hover:bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-white flex items-center gap-1.5 transition-all shadow-lg"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-purple-400" /> : <Maximize className="w-4 h-4 text-blue-400" />}
            <span className="hidden sm:inline text-[11px] font-bold uppercase">{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
          </button>
        </div>

        {openMode === 'iframe' ? (
          <div className="relative aspect-video w-full bg-black flex flex-col items-center justify-center overflow-hidden">
            <iframe
              src={activeUrl}
              title={product.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />

            {/* Note overlay about Netflix / DRM iframe security */}
            <div className="absolute bottom-3 left-3 right-3 z-10 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-300">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>Website Embedding Notice:</strong> Official Netflix / Prime sites enforce <code className="text-amber-300 bg-black/50 px-1 py-0.5 rounded">X-Frame-Options: DENY</code> security headers. If the frame stays blank, launch stream externally.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchExternal(openInEdge)}
                className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Launch Stream</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 md:p-12 text-center space-y-6 bg-gradient-to-b from-[#11111d] to-[#0c0c14]">
            <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
              <Play className="w-8 h-8 fill-current" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{product.title}</h2>
              <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
                {product.description || 'Access content safely via Shafiflix Gatekeeper proxy.'}
              </p>
            </div>

            {/* Device selector */}
            <div className="max-w-md mx-auto bg-[#11111d] border border-white/5 p-4 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Select Device Preset</span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDevice('default')}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${selectedDevice === 'default' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px]">Default</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDevice('mobile')}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${selectedDevice === 'mobile' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[10px]">Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDevice('pc')}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${selectedDevice === 'pc' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-[10px]">PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDevice('tv')}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${selectedDevice === 'tv' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                >
                  <Tv className="w-4 h-4" />
                  <span className="text-[10px]">TV</span>
                </button>
              </div>
            </div>

            {/* Edge Checkbox & Launch */}
            <div className="max-w-md mx-auto space-y-4">
              <label className="flex items-center gap-3 cursor-pointer bg-blue-950/20 border border-blue-500/20 p-3 rounded-xl hover:bg-blue-900/20 transition-colors text-left">
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
                  <span className="text-[10px] text-gray-400">Direct protocol hook for Windows Edge browser</span>
                </div>
              </label>

              <button
                onClick={() => handleLaunchExternal(openInEdge)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Launch Gatekeeper Stream</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Warning Bottom Bar */}
        {product.rules && (
          <div className="p-4 bg-red-950/30 border-t border-red-500/20 flex items-start gap-3 text-xs text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase block text-red-400">Strict Rules & Terms:</span>
              <p className="leading-relaxed opacity-90">{product.rules}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
