// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add your web app's Firebase configuration
// You can find this in your Firebase project console
const firebaseConfig = {
  apiKey: "AIzaSyBr4nyvYq-i5CYWzD-defnRAhSzAZlBtrs",
  authDomain: "sakhi-5f142.firebaseapp.com",
  projectId: "sakhi-5f142",
  storageBucket: "sakhi-5f142.firebasestorage.app",
  messagingSenderId: "841614303629",
  appId: "1:841614303629:web:daf525988fa688b27addc4",
  measurementId: "G-8LJKEJCVHY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;