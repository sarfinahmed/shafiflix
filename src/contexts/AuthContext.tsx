import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface UserData {
  email: string;
  isAdmin: boolean;
  rulesAccepted: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithToken: (email: string, token: string) => Promise<void>;
  logOut: () => Promise<void>;
  acceptRules: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial check for token session in localStorage
    const storedEmail = localStorage.getItem('shafiflix_user_email');
    if (storedEmail) {
      const isAdmin = storedEmail.toLowerCase() === 'piccisarfin@gmail.com';
      setUserData({
        email: storedEmail,
        isAdmin,
        rulesAccepted: true
      });
      setUser({ uid: 'token-user-' + storedEmail, email: storedEmail, isAnonymous: true } as User);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (!currentUser.isAnonymous) {
          const isAdmin = currentUser.email?.toLowerCase() === 'piccisarfin@gmail.com';
          const userDocRef = doc(db, 'users', currentUser.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const existingData = userDocSnap.data() as UserData;
              setUserData({
                ...existingData,
                email: currentUser.email || '',
                isAdmin: isAdmin || existingData.isAdmin,
                rulesAccepted: isAdmin ? true : existingData.rulesAccepted
              });
            } else {
              const newUserData: UserData = {
                email: currentUser.email || '',
                isAdmin,
                rulesAccepted: isAdmin
              };
              await setDoc(userDocRef, newUserData);
              setUserData(newUserData);
            }
          } catch (error: any) {
            console.error("Firebase Auth/Firestore error:", error);
            setUserData({
              email: currentUser.email || '',
              isAdmin,
              rulesAccepted: isAdmin
            });
          }
        } else {
          // Anonymous user (Token Login)
          const localEmail = localStorage.getItem('shafiflix_user_email');
          if (localEmail) {
            const isAdmin = localEmail.toLowerCase() === 'piccisarfin@gmail.com';
            setUserData({
              email: localEmail,
              isAdmin,
              rulesAccepted: true
            });
          }
        }
      } else {
        // If no Firebase Auth user, check if we have a valid token session in localStorage
        const localEmail = localStorage.getItem('shafiflix_user_email');
        if (localEmail) {
          const isAdmin = localEmail.toLowerCase() === 'piccisarfin@gmail.com';
          setUserData({
            email: localEmail,
            isAdmin,
            rulesAccepted: true
          });
          setUser({ uid: 'token-user-' + localEmail, email: localEmail, isAnonymous: true } as User);
        } else {
          setUser(null);
          setUserData(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        console.log('Google Sign-In popup closed by user.');
        return;
      }
      throw error;
    }
  };

  const loginWithToken = async (email: string, token: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();
    
    // Special admin access without token requirement
    if (normalizedEmail === 'piccisarfin@gmail.com') {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn("Anonymous auth unavailable:", err);
      }
      localStorage.setItem('shafiflix_user_email', normalizedEmail);
      localStorage.setItem('shafiflix_user_token', cleanToken || 'ADMIN_TOKEN');
      const adminData = {
        email: normalizedEmail,
        isAdmin: true,
        rulesAccepted: true
      };
      setUserData(adminData);
      setUser({ uid: 'admin-token-user', email: normalizedEmail, isAnonymous: true } as User);
      return;
    }

    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn("Anonymous auth unavailable, proceeding with session storage:", err);
    }
    
    // Query token doc in Firestore by tokenValue
    let snapshot = await getDocs(query(collection(db, 'tokens'), where('tokenValue', '==', cleanToken)));
    
    if (snapshot.empty) {
      // Fallback query by assignedTo
      snapshot = await getDocs(query(collection(db, 'tokens'), where('assignedTo', '==', normalizedEmail)));
    }

    if (snapshot.empty) {
      throw new Error("Invalid ID or Token");
    }

    // Find the token matching the assignedTo email or value
    const matchedDoc = snapshot.docs.find(docSnap => {
      const data = docSnap.data();
      return data.tokenValue === cleanToken || data.assignedTo?.toLowerCase() === normalizedEmail;
    });

    if (!matchedDoc) {
      throw new Error("Invalid ID or Access Token");
    }

    const tokenDoc = matchedDoc.data();
    if (tokenDoc.assignedTo && tokenDoc.assignedTo.toLowerCase() !== normalizedEmail) {
      throw new Error("Token does not belong to this email ID");
    }

    if (tokenDoc.expiresAt && tokenDoc.expiresAt.toDate() < new Date()) {
      throw new Error("Token expired");
    }
    
    localStorage.setItem('shafiflix_user_email', normalizedEmail);
    localStorage.setItem('shafiflix_user_token', cleanToken);
    
    const userSession = {
      email: normalizedEmail,
      isAdmin: false,
      rulesAccepted: true
    };
    
    setUserData(userSession);
    setUser({ uid: 'token-user-' + normalizedEmail, email: normalizedEmail, isAnonymous: true } as User);
  };

  const logOut = async () => {
    localStorage.removeItem('shafiflix_user_email');
    localStorage.removeItem('shafiflix_user_token');
    setUserData(null);
    setUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut error:", e);
    }
  };

  const acceptRules = async () => {
    if (!user || user.isAnonymous) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { rulesAccepted: true }, { merge: true });
    setUserData(prev => prev ? { ...prev, rulesAccepted: true } : null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, loginWithToken, logOut, acceptRules }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

