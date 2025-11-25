import { collection, addDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDefaultSystemPlaces } from '@/lib/safePlaces';

/**
 * Initialize Firestore with default system places (police stations, hospitals, shelters)
 * This should be run once when setting up the application
 */
export const initializeSystemPlaces = async (): Promise<void> => {
  try {
    console.log('Checking for existing system places...');
    
    // Check if system places already exist
    const systemPlacesQuery = query(
      collection(db, 'systemPlaces'),
      where('addedBy', '==', 'system')
    );
    
    const existingPlaces = await getDocs(systemPlacesQuery);
    
    if (existingPlaces.size > 0) {
      console.log(`Found ${existingPlaces.size} existing system places. Skipping initialization.`);
      return;
    }

    console.log('No system places found. Initializing default places...');
    
    const defaultPlaces = getDefaultSystemPlaces();
    
    // Add each default place to Firestore
    const promises = defaultPlaces.map(place => 
      addDoc(collection(db, 'systemPlaces'), place)
    );
    
    await Promise.all(promises);
    
    console.log(`Successfully initialized ${defaultPlaces.length} system places.`);
  } catch (error) {
    console.error('Error initializing system places:', error);
    throw new Error('Failed to initialize system places');
  }
};

/**
 * Firestore Security Rules for Safe Places
 * Copy these rules to your Firestore console
 */
export const getFirestoreSecurityRules = (): string => {
  return `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // System places - read-only for all users, write only for admins
    match /systemPlaces/{placeId} {
      allow read: if true; // Anyone can read system places
      allow write: if false; // Only admins should write (use admin SDK)
    }
    
    // User-contributed safe places
    match /safePlaces/{placeId} {
      // Anyone can read public places, authenticated users can read all
      allow read: if resource.data.category == 'public' || 
                     (request.auth != null && 
                      (resource.data.category == 'personal' ? 
                       resource.data.userId == request.auth.uid : true));
      
      // Only authenticated users can create places
      allow create: if request.auth != null &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.category in ['personal', 'public'] &&
                       request.resource.data.addedBy == 'user' &&
                       request.resource.data.isActive == true;
      
      // Users can only update/delete their own personal places
      allow update, delete: if request.auth != null &&
                               resource.data.userId == request.auth.uid &&
                               resource.data.category == 'personal';
    }
  }
}
`;
};

/**
 * Remove all system places (fallback/default places)
 * Use this to clean up before Google Maps API integration
 */
export const removeSystemPlaces = async (): Promise<void> => {
  try {
    console.log('🧹 Removing all system places...');
    
    // Delete from systemPlaces collection
    const systemPlaces = await getDocs(collection(db, 'systemPlaces'));
    const systemDeletePromises = systemPlaces.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(systemDeletePromises);
    
    // Also check safePlaces collection for any system category places
    const systemSafePlacesQuery = query(
      collection(db, 'safePlaces'),
      where('category', '==', 'system')
    );
    const systemSafePlaces = await getDocs(systemSafePlacesQuery);
    const safePlacesDeletePromises = systemSafePlaces.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(safePlacesDeletePromises);
    
    console.log(`✅ Removed ${systemPlaces.size + systemSafePlaces.size} system places.`);
    console.log('Ready for Google Maps API integration!');
  } catch (error) {
    console.error('Error removing system places:', error);
    throw error;
  }
};

/**
 * Development helper to reset all places (use with caution!)
 */
export const resetAllPlaces = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset places in production environment');
  }
  
  console.warn('⚠️  RESETTING ALL PLACES - This will delete all data!');
  
  try {
    // Delete all system places
    const systemPlaces = await getDocs(collection(db, 'systemPlaces'));
    const systemDeletePromises = systemPlaces.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(systemDeletePromises);
    
    // Delete all user places
    const userPlaces = await getDocs(collection(db, 'safePlaces'));
    const userDeletePromises = userPlaces.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(userDeletePromises);
    
    console.log('✅ All places deleted. Run initializeSystemPlaces() to restore defaults.');
  } catch (error) {
    console.error('Error resetting places:', error);
    throw error;
  }
};
