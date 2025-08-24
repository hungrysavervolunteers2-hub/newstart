import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    const userProfile: UserProfile = {
      id: result.user.uid,
      name,
      email,
      role: email === 'projectify198@gmail.com' ? 'admin' : 'user'
    };
    
    await setDoc(doc(db, 'users', result.user.uid), userProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const fetchUserProfile = async (user: User) => {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        // Create profile for existing users
        const profile: UserProfile = {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          role: user.email === 'projectify198@gmail.com' ? 'admin' : 'user'
        };
        await setDoc(doc(db, 'users', user.uid), profile);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};