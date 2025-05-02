import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAP1G1TrpWmqrbRz0b5Z3ixzsIQG37EFWU",
  authDomain: "partnership-ledger.firebaseapp.com",
  projectId: "partnership-ledger",
  storageBucket: "partnership-ledger.appspot.com",
  messagingSenderId: "770828624713",
  appId: "1:770828624713:android:1aef4f0f2335d5493b7098"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Function to check Firebase connection
export const checkFirebaseConnection = async () => {
  try {
    console.log('Checking Firebase connection...');
    // Try to access Firestore to verify connection
    const testDoc = doc(db, '_connection_test', 'test');
    await setDoc(testDoc, { timestamp: new Date().toISOString() });
    console.log('Firebase connection successful!');
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
};

export { app, db, auth, getAuth };
