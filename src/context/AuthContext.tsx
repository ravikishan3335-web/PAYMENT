import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { PaymentRecord, PaymentDetails } from '../types/payment';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  cloudReceipts: PaymentRecord[];
  saveReceiptToCloud: (record: PaymentRecord) => Promise<void>;
  deleteReceiptFromCloud: (receiptId: string) => Promise<void>;
  updateReceiptInCloud: (receiptId: string, updated: PaymentDetails) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cloudReceipts, setCloudReceipts] = useState<PaymentRecord[]>([]);

  // Validate connection to Firestore on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn('Firebase client is offline or connecting...');
        }
      }
    }
    testConnection();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Ensure user profile document exists
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not update user doc:', err);
        }
      } else {
        setCloudReceipts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore Receipts when user is authenticated
  useEffect(() => {
    if (!user) {
      setCloudReceipts([]);
      return;
    }

    const receiptsPath = `users/${user.uid}/receipts`;
    const colRef = collection(db, receiptsPath);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const records: PaymentRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          records.push({
            id: data.id || docSnap.id,
            createdAt: data.createdAt || Date.now(),
            fileName: data.fileName || 'receipt.png',
            fileSize: data.fileSize || '',
            thumbnail: data.thumbnail || '',
            imageSrc: data.imageSrc || '',
            payment: {
              name: data.name || '',
              sender: data.sender || '',
              receiver: data.receiver || '',
              amount: data.amount || '',
              date: data.date || '',
              time: data.time || '',
              transactionId: data.transactionId || '',
              upiId: data.upiId || '',
              paymentMethod: data.paymentMethod || '',
              bankWallet: data.bankWallet || '',
              status: data.status || '',
            },
          });
        });

        // Sort latest first
        records.sort((a, b) => b.createdAt - a.createdAt);
        setCloudReceipts(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, receiptsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Google Sign-In with popup
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  // Email & Password Sign-In
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Email login failed:', err);
      throw err;
    }
  };

  // Email & Password Sign-Up
  const signupWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
    } catch (err: any) {
      console.error('Email sign-up failed:', err);
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Cloud receipt actions
  const saveReceiptToCloud = async (record: PaymentRecord) => {
    if (!user) return;
    const path = `users/${user.uid}/receipts/${record.id}`;
    const docRef = doc(db, 'users', user.uid, 'receipts', record.id);
    const p = record.payment;

    try {
      await setDoc(docRef, {
        id: record.id,
        userId: user.uid,
        createdAt: record.createdAt || Date.now(),
        fileName: record.fileName || '',
        fileSize: record.fileSize || '',
        thumbnail: record.thumbnail || '',
        name: p.name || '',
        sender: p.sender || '',
        receiver: p.receiver || '',
        amount: p.amount || '',
        date: p.date || '',
        time: p.time || '',
        transactionId: p.transactionId || '',
        upiId: p.upiId || '',
        paymentMethod: p.paymentMethod || '',
        bankWallet: p.bankWallet || '',
        status: p.status || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteReceiptFromCloud = async (receiptId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/receipts/${receiptId}`;
    const docRef = doc(db, 'users', user.uid, 'receipts', receiptId);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const updateReceiptInCloud = async (receiptId: string, updated: PaymentDetails) => {
    if (!user) return;
    const path = `users/${user.uid}/receipts/${receiptId}`;
    const docRef = doc(db, 'users', user.uid, 'receipts', receiptId);
    try {
      await setDoc(
        docRef,
        {
          name: updated.name || '',
          sender: updated.sender || '',
          receiver: updated.receiver || '',
          amount: updated.amount || '',
          date: updated.date || '',
          time: updated.time || '',
          transactionId: updated.transactionId || '',
          upiId: updated.upiId || '',
          paymentMethod: updated.paymentMethod || '',
          bankWallet: updated.bankWallet || '',
          status: updated.status || '',
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        cloudReceipts,
        saveReceiptToCloud,
        deleteReceiptFromCloud,
        updateReceiptInCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
