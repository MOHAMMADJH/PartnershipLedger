import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth as getFirebaseAuth } from 'firebase/auth';

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

// Initialize auth
// In newer versions of Firebase, we don't need special handling for React Native
// The standard getAuth works for all platforms
const auth = getFirebaseAuth(app);

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

export { app, db, auth, getFirebaseAuth as getAuth };
