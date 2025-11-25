// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace with YOUR Firebase configuration from Firebase Console
// Go to Project Settings -> Your apps -> Web app -> Config
const firebaseConfig = {
  apiKey: "AIzaSyBdm73Gdj1PfupEs34JHriSSesmEo5Nlic",
  authDomain: "sakhi-app-eb52d.firebaseapp.com",
  projectId: "sakhi-app-eb52d",
  storageBucket: "sakhi-app-eb52d.firebasestorage.app",
  messagingSenderId: "538237236810",
  appId: "1:538237236810:web:47523fad57f0fe0d4218b3"
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