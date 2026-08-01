import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'bn';

interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

const translations: Translations = {
  welcome: { en: 'Welcome to Shafi Flix', bn: 'Shafi Flix এ স্বাগতম' },
  login: { en: 'Sign in with Google', bn: 'গুগল দিয়ে সাইন ইন করুন' },
  adminPanel: { en: 'Admin Panel', bn: 'অ্যাডমিন প্যানেল' },
  myToken: { en: 'My Token', bn: 'আমার টোকেন' },
  logout: { en: 'Logout', bn: 'লগআউট' },
  rulesTitle: { en: 'Terms & Rules', bn: 'শর্তাবলী ও নিয়মাবলী' },
  rulesText: { 
    en: 'By accessing this token, you agree not to share it, screenshot it, or reproduce it in any form. Unauthorized sharing will result in an immediate permanent ban.', 
    bn: 'এই টোকেনটি ব্যবহার করে, আপনি সম্মত হচ্ছেন যে আপনি এটি কারও সাথে শেয়ার করবেন না বা স্ক্রিনশট নিবেন না। অননুমোদিত শেয়ারিং এর ফলে তাৎক্ষণিক স্থায়ী নিষেধাজ্ঞা প্রদান করা হবে।'
  },
  acceptRules: { en: 'I Accept the Rules', bn: 'আমি নিয়মগুলি মেনে নিলাম' },
  tokenReveal: { en: 'Click to Reveal Token', bn: 'টোকেন দেখতে ক্লিক করুন' },
  accessDenied: { en: 'Access Denied – Token Expired', bn: 'অ্যাক্সেস অস্বীকার করা হয়েছে – টোকেনের মেয়াদ শেষ' },
  noToken: { en: 'No token assigned to you yet.', bn: 'আপনার জন্য এখনও কোনো টোকেন বরাদ্দ করা হয়নি।' },
  expiresIn: { en: 'Expires in:', bn: 'মেয়াদ শেষ হবে:' },
  expired: { en: 'Expired', bn: 'মেয়াদোত্তীর্ণ' },
  createToken: { en: 'Create Token', bn: 'টোকেন তৈরি করুন' },
  delete: { en: 'Delete', bn: 'মুছুন' },
  extend: { en: 'Extend', bn: 'মেয়াদ বাড়ান' },
  userEmail: { en: 'User Email', bn: 'ব্যবহারকারীর ইমেইল' },
  duration: { en: 'Duration (Days)', bn: 'মেয়াদ (দিন)' },
  status: { en: 'Status', bn: 'স্ট্যাটাস' }
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[lang] || key;
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
