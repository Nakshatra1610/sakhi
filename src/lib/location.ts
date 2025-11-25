import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

const COLLECTIONS = {
  LOCATION_SHARES: 'locationShares',
  LOCATION_UPDATES: 'locationUpdates',
  SHARE_HISTORY: 'shareHistory'
};

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface LocationShare {
  id: string;
  userId: string;
  userName: string;
  sharedWith: string[]; // Array of contact IDs
  contactNames: string[]; // Array of contact names for display
  contactPhones: string[]; // Array of phone numbers for notifications
  startTime: Date;
  endTime?: Date; // If null, sharing indefinitely
  duration?: number; // Duration in minutes
  isActive: boolean;
  currentLocation: LocationCoordinates;
  destination?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  shareType: 'timed' | 'until-arrival' | 'indefinite';
  checkInRequired: boolean;
  checkInTime?: Date;
  batteryLevel?: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface LocationUpdate {
  id: string;
  shareId: string;
  location: LocationCoordinates;
  batteryLevel?: number;
  timestamp: Date;
}

export interface ShareHistoryItem {
  id: string;
  userId: string;
  sharedWith: string[];
  contactNames: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // Actual duration in minutes
  shareType: string;
  completedSuccessfully: boolean;
  checkedIn: boolean;
}

export interface CreateShareData {
  sharedWith: {
    id: string;
    name: string;
    phoneNumber: string;
  }[];
  duration?: number; // in minutes
  shareType: 'timed' | 'until-arrival' | 'indefinite';
  destination?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  checkInRequired: boolean;
  currentLocation: LocationCoordinates;
}

/**
 * Create a new location share
 */
export const createLocationShare = async (
  shareData: CreateShareData,
  user: User | null
): Promise<string> => {
  if (!user) {
    throw new Error('You must be signed in to share location');
  }

  try {
    const now = new Date();
    const endTime = shareData.duration 
      ? new Date(now.getTime() + shareData.duration * 60000)
      : undefined;

    // Build the share object with proper typing (avoiding undefined values for Firestore)
    const share: Omit<LocationShare, 'id'> = {
      userId: user.uid,
      userName: user.displayName || 'User',
      sharedWith: shareData.sharedWith.map(c => c.id),
      contactNames: shareData.sharedWith.map(c => c.name),
      contactPhones: shareData.sharedWith.map(c => c.phoneNumber),
      startTime: now,
      isActive: true,
      currentLocation: shareData.currentLocation,
      shareType: shareData.shareType,
      checkInRequired: shareData.checkInRequired,
      lastUpdated: now,
      createdAt: now,
      // Only include optional fields if they have values (Firestore doesn't allow undefined)
      ...(endTime && { endTime }),
      ...(shareData.duration && { duration: shareData.duration }),
      ...(shareData.destination && { destination: shareData.destination })
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.LOCATION_SHARES), share);
    
    // Send notification to contacts
    await sendLocationShareNotification(shareData, docRef.id, user);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating location share:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Missing or insufficient permissions')) {
        throw new Error('Firestore permission denied. Please check your Firebase security rules.');
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Database access denied. Please ensure Firestore is enabled in Firebase Console.');
      }
      if (error.message.includes('invalid data') || error.message.includes('Unsupported field')) {
        throw new Error(`Invalid data: ${error.message}`);
      }
      throw new Error(`Failed to share location: ${error.message}`);
    }
    
    throw new Error('Failed to share location. Please try again.');
  }
};

/**
 * Update location for an active share
 */
export const updateShareLocation = async (
  shareId: string,
  location: LocationCoordinates,
  batteryLevel?: number
): Promise<void> => {
  try {
    // Update the main share document
    await updateDoc(doc(db, COLLECTIONS.LOCATION_SHARES, shareId), {
      currentLocation: location,
      batteryLevel,
      lastUpdated: new Date()
    });

    // Create a location update record for history/tracking
    const update: Partial<LocationUpdate> = {
      shareId,
      location,
      batteryLevel,
      timestamp: new Date()
    };

    await addDoc(collection(db, COLLECTIONS.LOCATION_UPDATES), update);
  } catch (error) {
    console.error('Error updating location:', error);
    throw new Error('Failed to update location');
  }
};

/**
 * Stop sharing location
 */
export const stopLocationShare = async (
  shareId: string,
  checkedIn: boolean = false
): Promise<void> => {
  try {
    const shareRef = doc(db, COLLECTIONS.LOCATION_SHARES, shareId);
    
    // Build update object without undefined values
    const updateData: {
      isActive: boolean;
      endTime: Date;
      checkInTime?: Date;
    } = {
      isActive: false,
      endTime: new Date()
    };

    // Only add checkInTime if checkedIn is true
    if (checkedIn) {
      updateData.checkInTime = new Date();
    }
    
    await updateDoc(shareRef, updateData);

    // TODO: Send "stopped sharing" notification to contacts
    
  } catch (error) {
    console.error('Error stopping location share:', error);
    throw new Error('Failed to stop sharing');
  }
};

/**
 * Check in (I've arrived safely)
 */
export const checkIn = async (shareId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.LOCATION_SHARES, shareId), {
      checkInTime: new Date(),
      isActive: false,
      endTime: new Date()
    });

    // TODO: Send "arrived safely" notification to contacts
    
  } catch (error) {
    console.error('Error checking in:', error);
    throw new Error('Failed to check in');
  }
};

/**
 * Get active location shares for a user
 */
export const getActiveShares = async (user: User | null): Promise<LocationShare[]> => {
  if (!user) {
    return [];
  }

  try {
    const sharesQuery = query(
      collection(db, COLLECTIONS.LOCATION_SHARES),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(sharesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime?.toDate() || new Date(),
      endTime: doc.data().endTime?.toDate(),
      checkInTime: doc.data().checkInTime?.toDate(),
      currentLocation: {
        ...doc.data().currentLocation,
        timestamp: doc.data().currentLocation?.timestamp?.toDate() || new Date()
      },
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    } as LocationShare));
  } catch (error) {
    console.error('Error fetching active shares:', error);
    throw new Error('Failed to load active shares');
  }
};

/**
 * Check and expire shares that have passed their endTime
 */
export const checkAndExpireShares = async (shares: LocationShare[]): Promise<void> => {
  const now = new Date();
  
  for (const share of shares) {
    // If share has an endTime and it has passed, expire it
    if (share.endTime && share.endTime <= now && share.isActive) {
      try {
        await stopLocationShare(share.id, false);
        console.log(`Auto-expired share ${share.id}`);
      } catch (error) {
        console.error(`Error auto-expiring share ${share.id}:`, error);
      }
    }
  }
};

/**
 * Subscribe to active location shares
 */
export const subscribeToActiveShares = (
  user: User | null,
  onUpdate: (shares: LocationShare[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!user) {
    onUpdate([]);
    return () => {};
  }

  try {
    const sharesQuery = query(
      collection(db, COLLECTIONS.LOCATION_SHARES),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(
      sharesQuery,
      async (snapshot) => {
        const shares = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          endTime: doc.data().endTime?.toDate(),
          checkInTime: doc.data().checkInTime?.toDate(),
          currentLocation: {
            ...doc.data().currentLocation,
            timestamp: doc.data().currentLocation?.timestamp?.toDate() || new Date()
          },
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as LocationShare));
        
        // Check and expire any shares that have passed their endTime
        await checkAndExpireShares(shares);
        
        onUpdate(shares);
      },
      (error) => {
        console.error('Error in shares subscription:', error);
        onError(new Error('Failed to sync location shares'));
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up shares subscription:', error);
    onError(error instanceof Error ? error : new Error('Failed to subscribe to shares'));
    return () => {};
  }
};

/**
 * Get share history
 */
export const getShareHistory = async (
  user: User | null,
  days: number = 7
): Promise<ShareHistoryItem[]> => {
  if (!user) {
    return [];
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const historyQuery = query(
      collection(db, COLLECTIONS.LOCATION_SHARES),
      where('userId', '==', user.uid),
      where('isActive', '==', false)
    );

    const snapshot = await getDocs(historyQuery);
    const history = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const startTime = data.startTime?.toDate() || new Date();
        const endTime = data.endTime?.toDate() || new Date();
        
        return {
          id: doc.id,
          userId: data.userId,
          sharedWith: data.sharedWith || [],
          contactNames: data.contactNames || [],
          startTime,
          endTime,
          duration: Math.floor((endTime.getTime() - startTime.getTime()) / 60000),
          shareType: data.shareType || 'timed',
          completedSuccessfully: !!data.checkInTime || data.shareType === 'indefinite',
          checkedIn: !!data.checkInTime
        } as ShareHistoryItem;
      })
      .filter(item => item.endTime >= cutoffDate)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return history;
  } catch (error) {
    console.error('Error fetching share history:', error);
    throw new Error('Failed to load share history');
  }
};

/**
 * Get current geolocation
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
      },
      (error) => {
        let message = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Watch location (continuous tracking)
 */
export const watchLocation = (
  onLocationUpdate: (location: LocationCoordinates) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp)
      });
    },
    (error) => {
      let message = 'Failed to watch location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location unavailable';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out';
          break;
      }
      onError(new Error(message));
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

/**
 * Get battery level
 */
export const getBatteryLevel = async (): Promise<number | undefined> => {
  try {
    if ('getBattery' in navigator) {
      // @ts-expect-error - Battery API is experimental
      const battery = await navigator.getBattery();
      return Math.round(battery.level * 100);
    }
    return undefined;
  } catch (error) {
    console.error('Error getting battery level:', error);
    return undefined;
  }
};

/**
 * Generate Google Maps link
 */
export const getGoogleMapsLink = (latitude: number, longitude: number): string => {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

/**
 * Send location share notification via SMS
 */
const sendLocationShareNotification = async (
  shareData: CreateShareData,
  shareId: string,
  user: User
): Promise<void> => {
  try {
    const location = shareData.currentLocation;
    const mapsLink = getGoogleMapsLink(location.latitude, location.longitude);
    const userName = user.displayName || 'Your contact';
    
    // Calculate end time
    const endTime = shareData.duration 
      ? new Date(Date.now() + shareData.duration * 60000)
      : null;
    const timeText = endTime 
      ? `for ${shareData.duration} minutes (until ${endTime.toLocaleTimeString()})`
      : 'indefinitely';
    
    // Create message text
    const message = `🚨 SAFETY ALERT from ${userName}

I'm sharing my live location with you ${timeText}.

📍 Current Location:
${mapsLink}

This is an emergency location share. Please keep track of my location.

Reply if you receive this message.`;

    // Send SMS to each contact
    for (const contact of shareData.sharedWith) {
      // Format phone number for SMS (remove spaces, dashes)
      const phoneNumber = contact.phoneNumber.replace(/[\s-]/g, '');
      
      // Create SMS URL
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      
      // Open SMS app
      window.open(smsUrl, '_blank');
      
      // Add small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error - notification failure shouldn't stop location sharing
  }
};

/**
 * Calculate distance between two points (in meters)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};