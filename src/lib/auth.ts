import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/authErrors';

export interface SignUpData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
}

// Sign up new user
export const signUpWithEmail = async (userData: SignUpData): Promise<User> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const user = userCredential.user;
    
    // Update user profile with display name
    await updateProfile(user, {
      displayName: userData.fullName
    });
    
    // Store additional user data in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      createdAt: new Date()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    const friendlyMessage = getAuthErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

// Sign in existing user
export const signInWithEmail = async (signInData: SignInData): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      signInData.email, 
      signInData.password
    );
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    const friendlyMessage = getAuthErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

// Sign out user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};
