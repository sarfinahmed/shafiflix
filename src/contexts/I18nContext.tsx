import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'bn';

interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

const translations: Translations = {
  // Navigation
  watch: { en: 'Watch', bn: 'দেখুন' },
  profile: { en: 'Profile', bn: 'প্রোফাইল' },
  admin: { en: 'Admin', bn: 'অ্যাডমিন' },
  logout: { en: 'Logout', bn: 'লগআউট' },
  
  // Login Page
  welcome: { en: 'Welcome to Shafi Flix', bn: 'Shafi Flix এ স্বাগতম' },
  loginSubtitle: { en: 'Experience cinematic access. Secure & dynamic.', bn: 'সিনেমাটিক অভিজ্ঞতা নিন। নিরাপদ ও স্বাচ্ছন্দ্যময়।' },
  userIdLabel: { en: 'User ID (Email)', bn: 'ইউজার আইডি (ইমেইল)' },
  userIdPlaceholder: { en: 'Enter your ID', bn: 'আপনার ইউজার আইডি লিখুন' },
  accessTokenLabel: { en: 'Access Token', bn: 'অ্যাক্সেস টোকেন' },
  tokenPlaceholder: { en: 'SFX-XXXX-XXXX', bn: 'SFX-XXXX-XXXX' },
  enterVault: { en: 'Enter Vault', bn: 'প্রবেশ করুন' },
  verifying: { en: 'Verifying...', bn: 'যাচাই করা হচ্ছে...' },
  googleAdminSignIn: { en: 'Google Admin Sign-In', bn: 'গুগল অ্যাডমিন সাইন-ইন' },
  
  // Dashboard Header & Status
  systemAnnouncement: { en: 'System Announcement', bn: 'সিস্টেম ঘোষণা' },
  systemOperational: { en: 'All Systems Operational', bn: 'সব সিস্টেম সচল আছে' },
  systemMaintenance: { en: 'System Maintenance Active', bn: 'সিস্টেম রক্ষণাবেক্ষণ চলছে' },
  
  // Profile Tab
  myToken: { en: 'My Subscription Profile', bn: 'আমার সাবস্ক্রিপশন প্রোফাইল' },
  userEmail: { en: 'User Email', bn: 'ব্যবহারকারীর ইমেইল' },
  status: { en: 'Status', bn: 'স্ট্যাটাস' },
  verifiedUser: { en: 'Verified User', bn: 'যাচাইকৃত ব্যবহারকারী' },
  rulesTitle: { en: 'Terms & Security Rules', bn: 'শর্তাবলী ও নিরাপত্তা নিয়মাবলী' },
  rulesText: { 
    en: 'By accessing this subscription, you agree not to share it or reproduce it in any form. Unauthorized sharing will result in an immediate permanent ban.', 
    bn: 'এই সাবস্ক্রিপশনটি ব্যবহার করার মাধ্যমে আপনি সম্মত হচ্ছেন যে এটি অন্য কারও সাথে শেয়ার করা যাবে না। অননুমোদিত শেয়ারিংয়ের ফলে তাৎক্ষণিক স্থায়ী ব্যান করা হবে।'
  },
  acceptRules: { en: 'I Accept the Rules', bn: 'আমি নিয়ম মেনে চলব' },
  tokenReveal: { en: 'Click to Reveal Token', bn: 'টোকেন দেখতে ক্লিক করুন' },
  activeTokenLabel: { en: 'Active Subscription Token', bn: 'সক্রিয় সাবস্ক্রিপশন টোকেন' },
  copyToken: { en: 'Copy Subscription Token', bn: 'সাবস্ক্রিপশন টোকেন কপি করুন' },
  tokenCopied: { en: 'Token Copied!', bn: 'টোকেন কপি করা হয়েছে!' },
  currentSubscription: { en: 'Current Subscription', bn: 'বর্তমান সাবস্ক্রিপশন' },
  timeRemaining: { en: 'Time Remaining until Expiry', bn: 'মেয়াদ শেষ হওয়ার বাকি সময়' },
  expiresIn: { en: 'Expires in:', bn: 'মেয়াদ শেষ হবে:' },
  expired: { en: 'Expired', bn: 'মেয়াদোত্তীর্ণ' },
  securityStatus: { en: 'Security Status', bn: 'নিরাপত্তা স্ট্যাটাস' },
  profileStatus: { en: 'Profile Status', bn: 'প্রোফাইল স্ট্যাটাস' },
  copyProtection: { en: 'Copy Protection', bn: 'কপি প্রোটেকশন' },
  deviceLink: { en: 'Device Link', bn: 'ডিভাইস লিংক' },
  verified: { en: 'VERIFIED', bn: 'যাচাইকৃত' },
  armed: { en: 'ARMED', bn: 'সুরক্ষিত' },
  active: { en: 'ACTIVE', bn: 'সক্রিয়' },
  securityNote: { en: 'Tokens are unique and bound to this hardware. Any attempt to replicate or share access keys will result in permanent suspension.', bn: 'টোকেনগুলি প্রতিটি ডিভাইসের জন্য নির্দিষ্ট। অ্যাক্সেস কি শেয়ার করার চেষ্টা করলে স্থায়ী ব্যান হবে।' },
  
  // Watch Tab & Search
  searchPlaceholder: { en: 'Search movies, TV, channels...', bn: 'মুভি, টিভি বা চ্যানেল খুঁজুন...' },
  allContent: { en: 'All Content', bn: 'সব কনটেন্ট' },
  favorites: { en: 'Favorites', bn: 'পছন্দের তালিকা' },
  mobile: { en: 'Mobile', bn: 'মোবাইল' },
  pcLink: { en: 'PC Link', bn: 'পিসি লিংক' },
  smartTv: { en: 'Smart TV', bn: 'স্মার্ট টিভি' },
  accessDenied: { en: 'Access Denied', bn: 'অ্যাক্সেস অস্বীকার করা হয়েছে' },
  accessExpiredMsg: { en: 'Your subscription has expired. Please renew your token to access content.', bn: 'আপনার সাবস্ক্রিপশনের মেয়াদ শেষ। পুনরায় কনটেন্ট দেখতে টোকেন নবায়ন করুন।' },
  noContentFound: { en: 'No content matches your search or filter.', bn: 'আপনার সার্চ বা ফিল্টারের সাথে কোনো কনটেন্ট মেলেনি।' },
  viewRulesAndLink: { en: 'View Rules & Link', bn: 'নিয়ম ও লিংক দেখুন' },
  
  // Modal Dialog
  description: { en: 'Description', bn: 'বিবরণ' },
  importantRules: { en: 'Important Rules', bn: 'গুরুত্বপূর্ণ নিয়মাবলী' },
  selectDeviceMode: { en: 'Select Device Mode:', bn: 'ডিভাইস মোড নির্বাচন করুন:' },
  defaultMode: { en: 'Default', bn: 'ডিফল্ট' },
  pcLaptopMode: { en: 'PC / Laptop', bn: 'পিসি / ল্যাপটপ' },
  targetLink: { en: 'Target link:', bn: 'টার্গেট লিংক:' },
  deviceSpecificActive: { en: '(Device specific link active)', bn: '(ডিভাইস ভিত্তিক নির্দিষ্ট লিংক সক্রিয়)' },
  openInEdgeLabel: { en: 'Open in Microsoft Edge App', bn: 'Microsoft Edge অ্যাপে খুলুন' },
  openInEdgeSubtitle: { en: 'Launches Windows Microsoft Edge browser directly', bn: 'উইন্ডোজের মাইক্রোসফট এজ ব্রাউজারে সরাসরি চালু হবে' },
  launchInEdge: { en: 'Launch in Microsoft Edge', bn: 'Microsoft Edge এ ওপেন করুন' },
  openStreamLink: { en: 'Open Stream Link', bn: 'স্ট্রীম লিংক ওপেন করুন' },
  
  // Admin Page
  adminPanelTitle: { en: 'Admin Management Panel', bn: 'অ্যাডমিন ম্যানেজমেন্ট প্যানেল' },
  tokenManagement: { en: 'Token Management', bn: 'টোকেন ম্যানেজমেন্ট' },
  productCatalog: { en: 'Product Catalog', bn: 'প্রোডাক্ট ক্যাটালগ' },
  systemSettingsNotices: { en: 'System Settings & Notices', bn: 'সিস্টেম সেটিংস ও নোটিশ' },
  createNewToken: { en: 'Create New Subscription Token', bn: 'নতুন সাবস্ক্রিপশন টোকেন তৈরি করুন' },
  assignEmail: { en: 'Assign User Email', bn: 'ইউজার ইমেইল বরাদ্দ করুন' },
  durationDays: { en: 'Duration (Days)', bn: 'মেয়াদ (দিন)' },
  generateTokenBtn: { en: 'Generate & Save Token', bn: 'টোকেন তৈরি ও সেভ করুন' },
  searchTokens: { en: 'Search assigned email or token...', bn: 'ইমেইল বা টোকেন সার্চ করুন...' },
  filterAll: { en: 'All Tokens', bn: 'সকল টোকেন' },
  filterActive: { en: 'Active', bn: 'সক্রিয়' },
  filterExpiring: { en: 'Expiring Soon', bn: 'শীঘ্রই মেয়াদ শেষ' },
  filterExpired: { en: 'Expired', bn: 'মেয়াদোত্তীর্ণ' },
  addProduct: { en: 'Add New Stream Product', bn: 'নতুন স্ট্রীম প্রোডাক্ট যোগ করুন' },
  editProduct: { en: 'Edit Stream Product', bn: 'স্ট্রীম প্রোডাক্ট এডিট করুন' },
  productTitleLabel: { en: 'Product Title', bn: 'প্রোডাক্টের শিরোনাম' },
  imageUrlLabel: { en: 'Poster Image URL', bn: 'পোস্টার ছবির URL' },
  targetUrlLabel: { en: 'Default Stream Target URL', bn: 'ডিফল্ট স্ট্রীম টার্গেট URL' },
  mobileUrlLabel: { en: 'Mobile Stream Target URL', bn: 'মোবাইল স্ট্রীম টার্গেট URL' },
  pcUrlLabel: { en: 'PC Stream Target URL', bn: 'পিসি স্ট্রীম টার্গেট URL' },
  tvUrlLabel: { en: 'Smart TV Stream Target URL', bn: 'স্মার্ট টিভি স্ট্রীম টার্গেট URL' },
  rulesLabel: { en: 'Streaming Rules & Notes', bn: 'স্ট্রিমিং এর নিয়ম ও নোট' },
  saveProductBtn: { en: 'Save Product', bn: 'প্রোডাক্ট সেভ করুন' },
  updateNoticeBtn: { en: 'Update System Notice', bn: 'সিস্টেম নোটিশ আপডেট করুন' },
  deleteBtn: { en: 'Delete', bn: 'ডিলিট' },
  editBtn: { en: 'Edit', bn: 'এডিট' },
  copyCredentialsBtn: { en: 'Copy User Info', bn: 'ইউজার তথ্য কপি করুন' },
  extendDaysBtn: { en: 'Extend (+7 Days)', bn: 'মেয়াদ বাড়ান (+৭ দিন)' },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('shafiflix_lang');
      return saved === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (newLang: Language) => {
    try {
      localStorage.setItem('shafiflix_lang', newLang);
    } catch (e) {
      console.error(e);
    }
    setLangState(newLang);
  };

  const t = (key: string, fallback?: string) => {
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};
