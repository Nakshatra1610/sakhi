import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc,
  Timestamp,
  GeoPoint,
  FirestoreError,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

export interface SafePlace {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'shelter' | 'personal' | 'public';
  address: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  rating: number;
  distance?: string;
  isVerified: boolean;
  addedBy: 'system' | 'user';
  description?: string;
  // Enhanced Helpfulness system with unified scoring
  helpfulCount?: number; // Number of "helpful" votes
  notHelpfulCount?: number; // Number of "not helpful" votes (for transparency)
  totalFeedback?: number; // Total feedback (helpful + not helpful)
  helpfulnessScore?: number; // Unified score (0-100) combining overall and recent trends
  serviceTags?: string[]; // User-contributed service tags
  recentFeedbackCount?: number; // Feedback in last 30 days
  confidenceLevel?: 'low' | 'medium' | 'high'; // Based on feedback volume
  lastFeedbackUpdate?: Date; // When feedback was last updated
  lastVerified?: Date; // When place info was last verified
  // Firestore specific fields
  userId?: string; // For personal places
  createdAt: Date;
  updatedAt: Date;
  reportCount?: number; // For community moderation
  isActive: boolean; // For soft deletion
}

export interface PlaceHelpfulness {
  id: string;
  placeId: string;
  userId: string;
  isHelpful: boolean; // true for helpful, false for not helpful
  serviceTags?: string[]; // Tags added by this user
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSafePlaceData {
  name: string;
  category: 'personal' | 'public';
  address: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  description?: string;
}

// Firestore collection names
const COLLECTIONS = {
  SAFE_PLACES: 'safePlaces',
  SYSTEM_PLACES: 'systemPlaces', // For pre-defined places (police, hospitals, etc.)
  PLACE_HELPFULNESS: 'placeHelpfulness' // For helpfulness feedback and service tags
};

/**
 * Add a new safe place to Firestore
 */
export const addSafePlace = async (
  placeData: CreateSafePlaceData, 
  user: User | null
): Promise<string> => {
  try {
    const now = new Date();
    
    const safePlaceDoc: Omit<SafePlace, 'id'> = {
      name: placeData.name.trim(),
      category: placeData.category,
      address: placeData.address.trim(),
      coordinates: placeData.coordinates || null,
      phone: placeData.phone?.trim() || null,
      description: placeData.description?.trim() || null,
      rating: 0, // New places start with 0 rating
      isVerified: false, // User places need verification
      addedBy: 'user',
      userId: placeData.category === 'personal' ? user?.uid || null : null,
      createdAt: now,
      updatedAt: now,
      reportCount: 0,
      isActive: true
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.SAFE_PLACES), safePlaceDoc);
    return docRef.id;
  } catch (error: unknown) {
    console.error('Error adding safe place:', error);
    const firestoreError = error as FirestoreError;
    
    // Enhanced error reporting for debugging
    console.error('Firestore error details:', {
      code: firestoreError?.code,
      message: firestoreError?.message,
      stack: firestoreError?.stack
    });
    
    if (firestoreError?.code === 'permission-denied') {
      throw new Error(`Permission denied: ${firestoreError.message}. Please check Firestore security rules or sign in again.`);
    } else if (firestoreError?.code) {
      throw new Error(`Firestore error (${firestoreError.code}): ${firestoreError.message}`);
    } else {
      throw new Error(`Failed to add safe place: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

/**
 * Get all safe places for a user (personal + public + system)
 */
export const getSafePlaces = async (user: User | null): Promise<SafePlace[]> => {
  try {
    const places: SafePlace[] = [];

    // Get system places (police, hospitals, shelters)
    try {
      const systemPlacesQuery = query(
        collection(db, COLLECTIONS.SYSTEM_PLACES),
        where('isActive', '==', true)
      );
      const systemSnapshot = await getDocs(systemPlacesQuery);
      systemSnapshot.forEach(doc => {
        places.push({ id: doc.id, ...doc.data() as Omit<SafePlace, 'id'> });
      });
      } catch (systemError: unknown) {
        console.warn('Could not fetch system places:', systemError);
        // TODO: Remove fallback places - will be replaced by Google Maps API integration
        // When Google Maps API is integrated, we'll fetch real places (hospitals, police stations, etc.)
        // and store them in Firestore, then users can add reviews to those real places
        
        /* COMMENTED OUT - Fallback places system (will be replaced by Google Maps API)
        const error = systemError as FirestoreError;
        if (error?.code === 'permission-denied') {
          const fallbackPlaces = getDefaultSystemPlaces();
          fallbackPlaces.forEach((place, index) => {
            places.push({ id: `fallback-${index}`, ...place });
          });
        }
        */
      }

    // Get public user-contributed places
    try {
      const publicPlacesQuery = query(
        collection(db, COLLECTIONS.SAFE_PLACES),
        where('category', '==', 'public'),
        where('isActive', '==', true)
      );
      const publicSnapshot = await getDocs(publicPlacesQuery);
      publicSnapshot.forEach(doc => {
        places.push({ id: doc.id, ...doc.data() as Omit<SafePlace, 'id'> });
      });
    } catch (publicError: unknown) {
      console.warn('Could not fetch public places:', (publicError as Error)?.message);
    }

    // Get user's personal places (if authenticated)
    if (user) {
      try {
        const personalPlacesQuery = query(
          collection(db, COLLECTIONS.SAFE_PLACES),
          where('category', '==', 'personal'),
          where('userId', '==', user.uid),
          where('isActive', '==', true)
        );
        const personalSnapshot = await getDocs(personalPlacesQuery);
        personalSnapshot.forEach(doc => {
          places.push({ id: doc.id, ...doc.data() as Omit<SafePlace, 'id'> });
        });
      } catch (personalError: unknown) {
        console.warn('Could not fetch personal places:', (personalError as Error)?.message);
      }
    }

    return places;
  } catch (error: unknown) {
    console.error('Error fetching safe places:', error);
    
    // Provide specific error messages for common issues
    const firestoreError = error as FirestoreError;
    if (firestoreError?.code === 'permission-denied') {
      throw new Error('Missing or insufficient permissions. Please check Firestore security rules.');
    } else if (firestoreError?.code === 'unavailable') {
      throw new Error('Firestore is temporarily unavailable. Please try again later.');
    } else {
      throw new Error('Failed to load safe places. Please try again.');
    }
  }
};

/**
 * Real-time listener for safe places
 */
export const subscribeSafePlaces = (
  user: User | null, 
  onUpdate: (places: SafePlace[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  const unsubscribeFunctions: (() => void)[] = [];

  try {
    // Listen to system places
    const systemQuery = query(
      collection(db, COLLECTIONS.SYSTEM_PLACES),
      where('isActive', '==', true)
    );
    
    const unsubscribeSystem = onSnapshot(systemQuery, (snapshot) => {
      updatePlacesFromSnapshots(user, onUpdate);
    }, onError);
    
    unsubscribeFunctions.push(unsubscribeSystem);

    // Listen to public places
    const publicQuery = query(
      collection(db, COLLECTIONS.SAFE_PLACES),
      where('category', '==', 'public'),
      where('isActive', '==', true)
    );
    
    const unsubscribePublic = onSnapshot(publicQuery, (snapshot) => {
      updatePlacesFromSnapshots(user, onUpdate);
    }, onError);
    
    unsubscribeFunctions.push(unsubscribePublic);

    // Listen to personal places (if authenticated)
    if (user) {
      const personalQuery = query(
        collection(db, COLLECTIONS.SAFE_PLACES),
        where('category', '==', 'personal'),
        where('userId', '==', user.uid),
        where('isActive', '==', true)
      );
      
      const unsubscribePersonal = onSnapshot(personalQuery, (snapshot) => {
        updatePlacesFromSnapshots(user, onUpdate);
      }, onError);
      
      unsubscribeFunctions.push(unsubscribePersonal);
    }

    // Return cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  } catch (error) {
    console.error('Error setting up safe places subscription:', error);
    onError(new Error('Failed to setup real-time updates.'));
    return () => {};
  }
};

/**
 * Helper function to aggregate all places from snapshots
 */
const updatePlacesFromSnapshots = async (
  user: User | null, 
  onUpdate: (places: SafePlace[]) => void
) => {
  try {
    const places = await getSafePlaces(user);
    onUpdate(places);
  } catch (error) {
    console.error('Error updating places from snapshots:', error);
  }
};

/**
 * Delete a safe place (user can only delete their own places)
 */
export const deleteSafePlace = async (placeId: string, user: User | null): Promise<void> => {
  if (!user) {
    throw new Error('Authentication required to delete places.');
  }

  try {
    // Soft delete by setting isActive to false
    await updateDoc(doc(db, COLLECTIONS.SAFE_PLACES, placeId), {
      isActive: false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error deleting safe place:', error);
    throw new Error('Failed to delete safe place. Please try again.');
  }
};

/**
 * Report a place (for community moderation)
 */
export const reportSafePlace = async (placeId: string, user: User | null): Promise<void> => {
  if (!user) {
    throw new Error('Authentication required to report places.');
  }

  try {
    const placeRef = doc(db, COLLECTIONS.SAFE_PLACES, placeId);
    // Increment report count - in production, you'd want to track who reported to prevent spam
    await updateDoc(placeRef, {
      reportCount: (await getDocs(query(collection(db, COLLECTIONS.SAFE_PLACES), where('__name__', '==', placeId)))).docs[0]?.data()?.reportCount || 0 + 1,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error reporting safe place:', error);
    throw new Error('Failed to report place. Please try again.');
  }
};

/**
 * Get default system places for initial setup
 */
export const getDefaultSystemPlaces = (): Omit<SafePlace, 'id'>[] => {
  const now = new Date();
  
  return [
    {
      name: 'City Police Station',
      category: 'police',
      address: '123 Main Street, Downtown',
      coordinates: { lat: 28.6129, lng: 77.2295 },
      phone: '+91-100',
      rating: 4.8,
      isVerified: true,
      addedBy: 'system',
      description: '24/7 police station with women helpdesk',
      createdAt: now,
      updatedAt: now,
      isActive: true
    },
    {
      name: 'Central Hospital',
      category: 'hospital',
      address: '456 Healthcare Avenue',
      coordinates: { lat: 28.6219, lng: 77.2085 },
      phone: '+91-108',
      rating: 4.6,
      isVerified: true,
      addedBy: 'system',
      description: 'Multi-specialty hospital with emergency services',
      createdAt: now,
      updatedAt: now,
      isActive: true
    },
    {
      name: "Women's Shelter Home",
      category: 'shelter',
      address: '789 Safety Lane',
      coordinates: { lat: 28.6329, lng: 77.2195 },
      phone: '+91-1091',
      rating: 4.9,
      isVerified: true,
      addedBy: 'system',
      description: 'Safe shelter for women in distress',
      createdAt: now,
      updatedAt: now,
      isActive: true
    },
    {
      name: 'Connaught Place Police Station',
      category: 'police',
      address: 'Connaught Place, New Delhi',
      coordinates: { lat: 28.6315, lng: 77.2167 },
      phone: '+91-11-23341163',
      rating: 4.5,
      isVerified: true,
      addedBy: 'system',
      description: 'Central Delhi police station with tourist helpline',
      createdAt: now,
      updatedAt: now,
      isActive: true
    },
    {
      name: 'All India Institute of Medical Sciences',
      category: 'hospital',
      address: 'Ansari Nagar, AIIMS, New Delhi',
      coordinates: { lat: 28.5672, lng: 77.2100 },
      phone: '+91-11-26588500',
      rating: 4.8,
      isVerified: true,
      addedBy: 'system',
      description: 'Premier medical institute with 24/7 emergency services',
      createdAt: now,
      updatedAt: now,
      isActive: true
    }
  ];
};

/**
 * Submit helpfulness feedback for a place
 */
export const submitPlaceHelpfulness = async (
  placeId: string,
  userId: string,
  isHelpful: boolean,
  serviceTags?: string[]
): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('User must be authenticated to provide feedback');
    }

    // TODO: Remove fallback place check when Google Maps API is integrated
    // Previously checked for fallback places, but those are now removed
    // Google Maps API places will be stored as real Firestore documents
    /* COMMENTED OUT - No longer using fallback places
    if (placeId.startsWith('fallback-')) {
      throw new Error('Cannot rate system default places. Please try rating user-contributed places instead.');
    }
    */

    const now = new Date();

    // Check if user has already provided feedback for this place
    const existingFeedbackQuery = query(
      collection(db, COLLECTIONS.PLACE_HELPFULNESS),
      where('placeId', '==', placeId),
      where('userId', '==', userId)
    );

    const existingFeedbackSnapshot = await getDocs(existingFeedbackQuery);
    
    if (!existingFeedbackSnapshot.empty) {
      // Update existing feedback
      const existingFeedbackDoc = existingFeedbackSnapshot.docs[0];
      await updateDoc(doc(db, COLLECTIONS.PLACE_HELPFULNESS, existingFeedbackDoc.id), {
        isHelpful,
        serviceTags: serviceTags || [],
        updatedAt: now
      });
    } else {
      // Create new feedback
      const feedbackData: Omit<PlaceHelpfulness, 'id'> = {
        placeId,
        userId,
        isHelpful,
        serviceTags: serviceTags || [],
        createdAt: now,
        updatedAt: now
      };

      await addDoc(collection(db, COLLECTIONS.PLACE_HELPFULNESS), feedbackData);
    }

    // Update place's helpfulness stats
    await updatePlaceHelpfulness(placeId);
  } catch (error) {
    console.error('Error submitting helpfulness feedback:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error('This place no longer exists. It may have been removed.');
      } else if (error.message.includes('permission')) {
        throw new Error('You do not have permission to rate this place.');
      } else {
        throw error;
      }
    }
    
    throw new Error('Failed to submit feedback. Please try again.');
  }
};

/**
 * Get user's helpfulness feedback for a specific place
 */
export const getUserHelpfulnessForPlace = async (
  placeId: string,
  userId: string
): Promise<PlaceHelpfulness | null> => {
  try {
    if (!userId) {
      return null;
    }

    const userFeedbackQuery = query(
      collection(db, COLLECTIONS.PLACE_HELPFULNESS),
      where('placeId', '==', placeId),
      where('userId', '==', userId)
    );

    const userFeedbackSnapshot = await getDocs(userFeedbackQuery);
    
    if (userFeedbackSnapshot.empty) {
      return null;
    }

    const doc = userFeedbackSnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      placeId: data.placeId,
      userId: data.userId,
      isHelpful: data.isHelpful,
      serviceTags: data.serviceTags || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting user helpfulness feedback:', error);
    return null;
  }
};

/**
 * Update place's helpfulness statistics and service tags - Enhanced with unified scoring
 */
export const updatePlaceHelpfulness = async (placeId: string): Promise<void> => {
  try {
    // TODO: Remove fallback place check when Google Maps API is integrated
    // Previously checked for fallback places, but those are now removed
    /* COMMENTED OUT - No longer using fallback places
    if (placeId.startsWith('fallback-')) {
      console.warn(`Cannot update helpfulness for fallback place ${placeId} - these are read-only system defaults`);
      throw new Error('Cannot rate system default places. Please try rating user-contributed places instead.');
    }
    */

    // Get all feedback for this place (removed orderBy to avoid index requirement)
    const feedbackQuery = query(
      collection(db, COLLECTIONS.PLACE_HELPFULNESS),
      where('placeId', '==', placeId)
    );

    const feedbackSnapshot = await getDocs(feedbackQuery);
    
    if (feedbackSnapshot.empty) {
      // Check if place document exists before updating
      const placeRef = doc(db, COLLECTIONS.SAFE_PLACES, placeId);
      const placeSnapshot = await getDoc(placeRef);
      
      if (!placeSnapshot.exists()) {
        console.error(`Place document ${placeId} does not exist, cannot reset helpfulness`);
        throw new Error(`Place with ID ${placeId} not found`);
      }

      // No feedback, reset to defaults
      await updateDoc(placeRef, {
        helpfulCount: 0,
        totalFeedback: 0,
        serviceTags: [],
        helpfulnessScore: 0, // New unified score (0-100)
        lastFeedbackUpdate: new Date(),
        updatedAt: new Date()
      });
      return;
    }

    // Calculate unified helpfulness statistics
    let helpfulCount = 0;
    let notHelpfulCount = 0;
    const allServiceTags: string[] = [];
    const totalFeedback = feedbackSnapshot.docs.length;
    const recentFeedback = []; // Track recent feedback for trending

    feedbackSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Count helpful vs not helpful
      if (data.isHelpful) {
        helpfulCount++;
      } else {
        notHelpfulCount++;
      }
      
      // Collect all service tags
      if (data.serviceTags && Array.isArray(data.serviceTags)) {
        allServiceTags.push(...data.serviceTags);
      }
      
      // Track recent feedback (last 30 days) for trending calculation
      const feedbackAge = Date.now() - (data.updatedAt?.toDate()?.getTime() || 0);
      if (feedbackAge <= 30 * 24 * 60 * 60 * 1000) { // 30 days
        recentFeedback.push(data);
      }
    });

    // Calculate unified helpfulness score (0-100)
    // Weighted formula: 70% overall helpfulness + 30% recent trend
    const overallHelpfulnessRate = totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0;
    
    let recentHelpfulnessRate = 0;
    if (recentFeedback.length > 0) {
      const recentHelpfulCount = recentFeedback.filter(f => f.isHelpful).length;
      recentHelpfulnessRate = (recentHelpfulCount / recentFeedback.length) * 100;
    } else {
      recentHelpfulnessRate = overallHelpfulnessRate; // Use overall if no recent feedback
    }
    
    const unifiedScore = Math.round(
      (overallHelpfulnessRate * 0.7) + (recentHelpfulnessRate * 0.3)
    );

    // Enhanced tag analysis with frequency and recency weighting
    const tagCounts = allServiceTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top service tags with minimum threshold based on total feedback
    const minTagVotes = Math.max(1, Math.floor(totalFeedback * 0.2)); // At least 20% of users must mention the tag
    const topServiceTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= minTagVotes)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 6) // Increased to 6 for better visibility
      .map(([tag, _]) => tag);

    // Calculate additional metrics for better insights
    const helpfulnessMetrics = {
      helpfulCount,
      notHelpfulCount: notHelpfulCount,
      totalFeedback,
      helpfulnessScore: unifiedScore,
      serviceTags: topServiceTags,
      recentFeedbackCount: recentFeedback.length,
      lastFeedbackUpdate: new Date(),
      updatedAt: new Date(),
      // Confidence level based on feedback volume
      confidenceLevel: totalFeedback >= 10 ? 'high' : totalFeedback >= 5 ? 'medium' : 'low'
    };

    // Check if place document exists before updating
    const placeRef = doc(db, COLLECTIONS.SAFE_PLACES, placeId);
    const placeSnapshot = await getDoc(placeRef);
    
    if (!placeSnapshot.exists()) {
      console.error(`Place document ${placeId} does not exist, cannot update helpfulness`);
      throw new Error(`Place with ID ${placeId} not found`);
    }

    // Update place document with comprehensive metrics
    await updateDoc(placeRef, helpfulnessMetrics);

    console.log(`Updated helpfulness for place ${placeId}:`, {
      helpful: helpfulCount,
      notHelpful: notHelpfulCount,
      score: unifiedScore,
      tags: topServiceTags.length
    });

  } catch (error) {
    console.error('Error updating place helpfulness:', error);
    throw error instanceof Error ? error : new Error('Failed to update place helpfulness');
  }
};

/**
 * Initialize helpfulness fields for existing places that don't have them
 */
export const initializeHelpfulnessFields = async (): Promise<void> => {
  try {
    // Get all safe places
    const placesQuery = query(
      collection(db, COLLECTIONS.SAFE_PLACES),
      where('isActive', '==', true)
    );
    
    const placesSnapshot = await getDocs(placesQuery);
    
    const batch = writeBatch(db);
    let updatedCount = 0;
    
    placesSnapshot.docs.forEach(placeDoc => {
      const placeData = placeDoc.data();
      
      // Check if helpfulness fields are missing or incomplete
      if (placeData.totalFeedback === undefined || 
          placeData.helpfulCount === undefined || 
          placeData.helpfulnessScore === undefined) {
        
        // Initialize with default values
        const defaultHelpfulness = {
          helpfulCount: 0,
          notHelpfulCount: 0,
          totalFeedback: 0,
          helpfulnessScore: 0,
          serviceTags: [],
          recentFeedbackCount: 0,
          lastFeedbackUpdate: new Date(),
          confidenceLevel: 'low',
          updatedAt: new Date()
        };
        
        batch.update(doc(db, COLLECTIONS.SAFE_PLACES, placeDoc.id), defaultHelpfulness);
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Initialized helpfulness fields for ${updatedCount} places`);
    } else {
      console.log('All places already have helpfulness fields initialized');
    }
    
  } catch (error) {
    console.error('Error initializing helpfulness fields:', error);
    throw error instanceof Error ? error : new Error('Failed to initialize helpfulness fields');
  }
};

/**
 * Mark place as recently verified (admin function)
 */
export const markPlaceAsVerified = async (placeId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.SAFE_PLACES, placeId), {
      lastVerified: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error marking place as verified:', error);
    throw error instanceof Error ? error : new Error('Failed to mark place as verified');
  }
};


