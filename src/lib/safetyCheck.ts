import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

const COLLECTIONS = {
  SAFETY_CHECKS: 'safetyChecks',
  CHECK_IN_HISTORY: 'checkInHistory'
};

export interface SafetyCheck {
  id: string;
  userId: string;
  userName: string;
  contactIds: string[];
  contactNames: string[];
  contactPhones: string[];
  startTime: Date;
  checkInDeadline: Date;
  duration: number; // Duration in minutes
  isActive: boolean;
  hasCheckedIn: boolean;
  status: 'active' | 'checked-in' | 'expired' | 'alerted';
  lastNotificationTime?: Date;
  checkInTime?: Date;
  notes?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  createdAt: Date;
}

export interface CheckInHistoryItem {
  id: string;
  userId: string;
  checkId: string;
  startTime: Date;
  checkInDeadline: Date;
  actualCheckInTime?: Date;
  status: 'completed' | 'missed' | 'alerted';
  duration: number;
  contactNames: string[];
}

export interface CreateSafetyCheckData {
  contacts: {
    id: string;
    name: string;
    phoneNumber: string;
  }[];
  duration: number; // in minutes
  notes?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
}

/**
 * Create a new safety check
 */
export const createSafetyCheck = async (
  checkData: CreateSafetyCheckData,
  user: User | null
): Promise<string> => {
  if (!user) {
    throw new Error('You must be logged in to create a safety check');
  }

  try {
    const now = new Date();
    const deadline = new Date(now.getTime() + checkData.duration * 60000);

    const check: Omit<SafetyCheck, 'id'> = {
      userId: user.uid,
      userName: user.displayName || 'User',
      contactIds: checkData.contacts.map(c => c.id),
      contactNames: checkData.contacts.map(c => c.name),
      contactPhones: checkData.contacts.map(c => c.phoneNumber),
      startTime: now,
      checkInDeadline: deadline,
      duration: checkData.duration,
      isActive: true,
      hasCheckedIn: false,
      status: 'active',
      createdAt: now,
      ...(checkData.notes && { notes: checkData.notes }),
      ...(checkData.currentLocation && { currentLocation: checkData.currentLocation })
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.SAFETY_CHECKS), check);
    
    // Send initial notification to user
    await sendSafetyCheckStartNotification(checkData, docRef.id, user);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating safety check:', error);
    throw new Error('Failed to create safety check');
  }
};

/**
 * Check in (mark as safe)
 */
export const checkIn = async (checkId: string): Promise<void> => {
  try {
    const checkRef = doc(db, COLLECTIONS.SAFETY_CHECKS, checkId);
    
    await updateDoc(checkRef, {
      isActive: false,
      hasCheckedIn: true,
      status: 'checked-in',
      checkInTime: new Date()
    });

    // Send check-in notification to contacts
    await sendCheckInNotification(checkId);
    
  } catch (error) {
    console.error('Error checking in:', error);
    throw new Error('Failed to check in');
  }
};

/**
 * Extend the check-in deadline
 */
export const extendDeadline = async (
  checkId: string,
  additionalMinutes: number
): Promise<void> => {
  try {
    const checkRef = doc(db, COLLECTIONS.SAFETY_CHECKS, checkId);
    
    // Get current deadline and extend it
    const checkDoc = await getDocs(
      query(collection(db, COLLECTIONS.SAFETY_CHECKS), where('__name__', '==', checkId))
    );
    
    if (checkDoc.empty) {
      throw new Error('Safety check not found');
    }

    const currentData = checkDoc.docs[0].data();
    const currentDeadline = currentData.checkInDeadline?.toDate() || new Date();
    const newDeadline = new Date(currentDeadline.getTime() + additionalMinutes * 60000);
    
    await updateDoc(checkRef, {
      checkInDeadline: newDeadline,
      duration: currentData.duration + additionalMinutes
    });
    
  } catch (error) {
    console.error('Error extending deadline:', error);
    throw new Error('Failed to extend deadline');
  }
};

/**
 * Cancel a safety check
 */
export const cancelSafetyCheck = async (checkId: string): Promise<void> => {
  try {
    const checkRef = doc(db, COLLECTIONS.SAFETY_CHECKS, checkId);
    
    await updateDoc(checkRef, {
      isActive: false,
      status: 'checked-in'
    });
    
  } catch (error) {
    console.error('Error canceling safety check:', error);
    throw new Error('Failed to cancel safety check');
  }
};

/**
 * Send emergency alert manually
 */
export const sendEmergencyAlert = async (checkId: string): Promise<void> => {
  try {
    const checkRef = doc(db, COLLECTIONS.SAFETY_CHECKS, checkId);
    
    await updateDoc(checkRef, {
      isActive: false,
      status: 'alerted'
    });

    // Send emergency notifications
    await sendEmergencyNotifications(checkId);
    
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    throw new Error('Failed to send emergency alert');
  }
};

/**
 * Check and expire safety checks that have passed their deadline
 */
export const checkAndExpireSafetyChecks = async (checks: SafetyCheck[]): Promise<void> => {
  const now = new Date();
  
  for (const check of checks) {
    if (check.checkInDeadline <= now && check.isActive && !check.hasCheckedIn) {
      try {
        // Mark as expired and send alerts
        await updateDoc(doc(db, COLLECTIONS.SAFETY_CHECKS, check.id), {
          isActive: false,
          status: 'alerted'
        });
        
        // Send emergency notifications to contacts
        await sendEmergencyNotifications(check.id);
        
        console.log(`Safety check ${check.id} expired - alerts sent`);
      } catch (error) {
        console.error(`Error expiring safety check ${check.id}:`, error);
      }
    }
  }
};

/**
 * Subscribe to active safety checks
 */
export const subscribeToActiveSafetyChecks = (
  user: User | null,
  onUpdate: (checks: SafetyCheck[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!user) {
    onUpdate([]);
    return () => {};
  }

  try {
    const checksQuery = query(
      collection(db, COLLECTIONS.SAFETY_CHECKS),
      where('userId', '==', user.uid),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(
      checksQuery,
      async (snapshot) => {
        const checks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          checkInDeadline: doc.data().checkInDeadline?.toDate() || new Date(),
          lastNotificationTime: doc.data().lastNotificationTime?.toDate(),
          checkInTime: doc.data().checkInTime?.toDate(),
          currentLocation: doc.data().currentLocation ? {
            ...doc.data().currentLocation,
            timestamp: doc.data().currentLocation?.timestamp?.toDate() || new Date()
          } : undefined,
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as SafetyCheck));
        
        // Check and expire any checks that have passed their deadline
        await checkAndExpireSafetyChecks(checks);
        
        onUpdate(checks);
      },
      (error) => {
        console.error('Error in safety checks subscription:', error);
        onError(new Error('Failed to sync safety checks'));
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up safety checks subscription:', error);
    onError(new Error('Failed to setup safety checks subscription'));
    return () => {};
  }
};

/**
 * Get check-in history
 */
export const getCheckInHistory = async (
  user: User | null,
  days: number = 30
): Promise<CheckInHistoryItem[]> => {
  if (!user) {
    return [];
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const historyQuery = query(
      collection(db, COLLECTIONS.SAFETY_CHECKS),
      where('userId', '==', user.uid),
      where('isActive', '==', false)
    );

    const snapshot = await getDocs(historyQuery);
    const history = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const startTime = data.startTime?.toDate() || new Date();
        
        return {
          id: doc.id,
          userId: data.userId,
          checkId: doc.id,
          startTime,
          checkInDeadline: data.checkInDeadline?.toDate() || new Date(),
          actualCheckInTime: data.checkInTime?.toDate(),
          status: data.status === 'checked-in' ? 'completed' : 
                  data.status === 'alerted' ? 'alerted' : 'missed',
          duration: data.duration || 0,
          contactNames: data.contactNames || []
        } as CheckInHistoryItem;
      })
      .filter(item => item.startTime >= cutoffDate)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return history;
  } catch (error) {
    console.error('Error fetching check-in history:', error);
    throw new Error('Failed to load check-in history');
  }
};

/**
 * Send initial safety check start notification (via SMS)
 */
const sendSafetyCheckStartNotification = async (
  checkData: CreateSafetyCheckData,
  checkId: string,
  user: User
): Promise<void> => {
  try {
    const userName = user.displayName || 'User';
    const duration = checkData.duration;
    const durationText = duration < 60 
      ? `${duration} minutes` 
      : `${Math.floor(duration / 60)} hour${duration >= 120 ? 's' : ''}`;
    
    const message = `Safety Check Started by ${userName}\n\nI've started a safety check for ${durationText}. I'll check in when I'm safe. If you don't hear from me, please check on me.\n\n${checkData.notes ? `Note: ${checkData.notes}` : ''}`;
    
    // For now, we'll use the SMS protocol to open the default SMS app
    // In production, you might want to use a service like Twilio
    const phoneNumbers = checkData.contacts.map(c => c.phoneNumber).join(',');
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl, '_blank');
  } catch (error) {
    console.error('Error sending safety check notification:', error);
  }
};

/**
 * Send check-in notification (user is safe)
 */
const sendCheckInNotification = async (checkId: string): Promise<void> => {
  try {
    // Get the check data
    const checkDoc = await getDocs(
      query(collection(db, COLLECTIONS.SAFETY_CHECKS), where('__name__', '==', checkId))
    );
    
    if (checkDoc.empty) return;
    
    const checkData = checkDoc.docs[0].data();
    const message = `✅ Safety Check - I'm Safe!\n\n${checkData.userName} has checked in and confirmed they are safe. No need to worry!`;
    
    const phoneNumbers = checkData.contactPhones?.join(',') || '';
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl, '_blank');
  } catch (error) {
    console.error('Error sending check-in notification:', error);
  }
};

/**
 * Send emergency notifications (deadline missed or manual alert)
 */
const sendEmergencyNotifications = async (checkId: string): Promise<void> => {
  try {
    // Get the check data
    const checkDoc = await getDocs(
      query(collection(db, COLLECTIONS.SAFETY_CHECKS), where('__name__', '==', checkId))
    );
    
    if (checkDoc.empty) return;
    
    const checkData = checkDoc.docs[0].data();
    const location = checkData.currentLocation;
    
    let message = `🚨 SAFETY CHECK ALERT 🚨\n\n${checkData.userName} has NOT checked in as expected!\n\nPlease try to contact them immediately.`;
    
    if (location) {
      const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      message += `\n\nLast known location:\n${mapsUrl}`;
    }
    
    const phoneNumbers = checkData.contactPhones?.join(',') || '';
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl, '_blank');
  } catch (error) {
    console.error('Error sending emergency notifications:', error);
  }
};