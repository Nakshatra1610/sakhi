import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  query, 
  where,
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { getCurrentLocation, getGoogleMapsLink } from '@/lib/location';

const COLLECTIONS = {
  SOS_ALERTS: 'sosAlerts',
  SOS_UPDATES: 'sosUpdates',
  SOS_EVIDENCE: 'sosEvidence'
};

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  contactIds: string[];
  contactNames: string[];
  contactPhones: string[];
  triggeredAt: Date;
  status: 'active' | 'resolved' | 'cancelled';
  mode: 'silent' | 'loud';
  initialLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  batteryLevel?: number;
  isRecording: boolean;
  hasMovedSignificantly: boolean; // Moved >500m
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface SOSUpdate {
  id: string;
  alertId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  batteryLevel?: number;
  timestamp: Date;
}

export interface SOSSettings {
  userId: string;
  shakeToActivate: boolean;
  countdownSeconds: number; // 0-10
  mode: 'silent' | 'loud' | 'smart';
  autoCallEmergency: boolean;
  audioRecording: boolean;
  photoCapture: boolean;
  photoCaptureInterval: number; // seconds
  selectedContactIds: string[]; // empty = all contacts
  requirePinToDeactivate: boolean;
  deactivationPin?: string;
}

export interface CreateSOSData {
  contacts: {
    id: string;
    name: string;
    phoneNumber: string;
  }[];
  mode: 'silent' | 'loud';
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  batteryLevel?: number;
  notes?: string;
}

/**
 * Trigger SOS Emergency Alert
 */
export const triggerSOS = async (
  sosData: CreateSOSData,
  user: User | null
): Promise<string> => {
  console.log('triggerSOS: Starting...', { hasUser: !!user, contactCount: sosData.contacts?.length });
  
  if (!user) {
    console.error('triggerSOS: No user provided');
    throw new Error('You must be logged in to trigger SOS');
  }

  if (!sosData.contacts || sosData.contacts.length === 0) {
    console.error('triggerSOS: No contacts provided');
    throw new Error('You must have at least one trusted contact to trigger SOS');
  }

  try {
    console.log('triggerSOS: Creating alert document...');
    const now = new Date();

    const alert: Omit<SOSAlert, 'id'> = {
      userId: user.uid,
      userName: user.displayName || 'User',
      contactIds: sosData.contacts.map(c => c.id),
      contactNames: sosData.contacts.map(c => c.name),
      contactPhones: sosData.contacts.map(c => c.phoneNumber),
      triggeredAt: now,
      status: 'active',
      mode: sosData.mode,
      initialLocation: sosData.currentLocation,
      lastKnownLocation: sosData.currentLocation,
      batteryLevel: sosData.batteryLevel,
      isRecording: true,
      hasMovedSignificantly: false,
      createdAt: now,
      ...(user.phoneNumber && { userPhone: user.phoneNumber }),
      ...(sosData.notes && { notes: sosData.notes })
    };

    console.log('triggerSOS: Writing to Firestore collection:', COLLECTIONS.SOS_ALERTS);
    const docRef = await addDoc(collection(db, COLLECTIONS.SOS_ALERTS), alert);
    console.log('triggerSOS: Document created with ID:', docRef.id);
    
    // Send initial SOS notifications
    console.log('triggerSOS: Sending notifications...');
    await sendSOSNotifications(sosData, docRef.id, user);
    console.log('triggerSOS: Notifications sent');
    
    // Play alarm sound if loud mode
    if (sosData.mode === 'loud') {
      console.log('triggerSOS: Playing alarm (loud mode)');
      playAlarmSound();
    }

    // Start vibration pattern
    console.log('triggerSOS: Starting vibration...');
    vibrateDevice('sos');
    
    console.log('triggerSOS: SOS alert successfully triggered');
    return docRef.id;
  } catch (error) {
    console.error('triggerSOS: Error occurred:', error);
    throw new Error(`Failed to trigger SOS alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update SOS location
 */
export const updateSOSLocation = async (
  alertId: string,
  location: { latitude: number; longitude: number; accuracy: number; timestamp: Date },
  batteryLevel?: number
): Promise<void> => {
  try {
    const alertRef = doc(db, COLLECTIONS.SOS_ALERTS, alertId);
    
    // Get current alert to check if moved significantly
    const alertDoc = await getDocs(
      query(collection(db, COLLECTIONS.SOS_ALERTS), where('__name__', '==', alertId))
    );
    
    if (!alertDoc.empty) {
      const alertData = alertDoc.docs[0].data();
      const initialLocation = alertData.initialLocation;
      
      // Calculate distance moved
      const distance = calculateDistance(
        initialLocation.latitude,
        initialLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      // Update alert
      await updateDoc(alertRef, {
        lastKnownLocation: location,
        batteryLevel,
        hasMovedSignificantly: distance > 0.5 // >500 meters
      });

      // Create location update record
      const update: Omit<SOSUpdate, 'id'> = {
        alertId,
        location,
        batteryLevel,
        timestamp: new Date()
      };

      await addDoc(collection(db, COLLECTIONS.SOS_UPDATES), update);

      // Send location update to contacts if moved significantly
      if (distance > 0.5) {
        await sendLocationUpdateNotification(alertId, location);
      }
    }
  } catch (error) {
    console.error('Error updating SOS location:', error);
    throw new Error('Failed to update SOS location');
  }
};

/**
 * Resolve SOS (I'm safe)
 */
export const resolveSOSAlert = async (
  alertId: string,
  pin?: string
): Promise<void> => {
  try {
    // TODO: Verify PIN if required
    
    const alertRef = doc(db, COLLECTIONS.SOS_ALERTS, alertId);
    
    await updateDoc(alertRef, {
      status: 'resolved',
      resolvedAt: new Date()
    });

    // Send "All Clear" notification
    await sendAllClearNotification(alertId);
    
    // Stop alarm sound
    stopAlarmSound();
    
  } catch (error) {
    console.error('Error resolving SOS:', error);
    throw new Error('Failed to resolve SOS alert');
  }
};

/**
 * Cancel SOS alert
 */
export const cancelSOSAlert = async (
  alertId: string,
  pin?: string
): Promise<void> => {
  try {
    // TODO: Verify PIN if required
    
    const alertRef = doc(db, COLLECTIONS.SOS_ALERTS, alertId);
    
    await updateDoc(alertRef, {
      status: 'cancelled',
      resolvedAt: new Date()
    });

    // Stop alarm sound
    stopAlarmSound();
    
  } catch (error) {
    console.error('Error canceling SOS:', error);
    throw new Error('Failed to cancel SOS alert');
  }
};

/**
 * Subscribe to active SOS alerts
 */
export const subscribeToActiveSOSAlerts = (
  user: User | null,
  onUpdate: (alerts: SOSAlert[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!user) {
    onUpdate([]);
    return () => {};
  }

  try {
    const alertsQuery = query(
      collection(db, COLLECTIONS.SOS_ALERTS),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          triggeredAt: doc.data().triggeredAt?.toDate() || new Date(),
          resolvedAt: doc.data().resolvedAt?.toDate(),
          initialLocation: {
            ...doc.data().initialLocation,
            timestamp: doc.data().initialLocation?.timestamp?.toDate() || new Date()
          },
          lastKnownLocation: doc.data().lastKnownLocation ? {
            ...doc.data().lastKnownLocation,
            timestamp: doc.data().lastKnownLocation?.timestamp?.toDate() || new Date()
          } : undefined,
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as SOSAlert));
        
        onUpdate(alerts);
      },
      (error) => {
        console.error('Error in SOS alerts subscription:', error);
        onError(new Error('Failed to sync SOS alerts'));
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up SOS subscription:', error);
    onError(new Error('Failed to setup SOS subscription'));
    return () => {};
  }
};

/**
 * Get SOS history
 */
export const getSOSHistory = async (
  user: User | null,
  days: number = 30
): Promise<SOSAlert[]> => {
  if (!user) {
    return [];
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const historyQuery = query(
      collection(db, COLLECTIONS.SOS_ALERTS),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(historyQuery);
    const history = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        triggeredAt: doc.data().triggeredAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
        initialLocation: {
          ...doc.data().initialLocation,
          timestamp: doc.data().initialLocation?.timestamp?.toDate() || new Date()
        },
        lastKnownLocation: doc.data().lastKnownLocation ? {
          ...doc.data().lastKnownLocation,
          timestamp: doc.data().lastKnownLocation?.timestamp?.toDate() || new Date()
        } : undefined,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as SOSAlert))
      .filter(item => item.triggeredAt >= cutoffDate)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

    return history;
  } catch (error) {
    console.error('Error fetching SOS history:', error);
    throw new Error('Failed to load SOS history');
  }
};

/**
 * Send SOS notifications to all contacts
 */
const sendSOSNotifications = async (
  sosData: CreateSOSData,
  alertId: string,
  user: User
): Promise<void> => {
  try {
    const location = sosData.currentLocation;
    const mapsLink = getGoogleMapsLink(location.latitude, location.longitude);
    const userName = user.displayName || 'Your contact';
    const userPhone = user.phoneNumber || 'Unknown';
    const batteryText = sosData.batteryLevel ? `${Math.round(sosData.batteryLevel * 100)}%` : 'Unknown';
    
    const message = `🚨 EMERGENCY SOS ALERT 🚨

${userName} has triggered an EMERGENCY alert!

📍 Location:
${mapsLink}

🕐 Time: ${new Date().toLocaleString()}
🔋 Battery: ${batteryText}
📞 Phone: ${userPhone}

This is URGENT. Please check on them immediately!

${sosData.notes ? `Note: ${sosData.notes}` : ''}

Reply or call back NOW.`;

    // Send via SMS
    const phoneNumbers = sosData.contacts.map(c => c.phoneNumber).join(',');
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl, '_blank');
  } catch (error) {
    console.error('Error sending SOS notifications:', error);
  }
};

/**
 * Send location update notification
 */
const sendLocationUpdateNotification = async (
  alertId: string,
  location: { latitude: number; longitude: number; accuracy: number; timestamp: Date }
): Promise<void> => {
  try {
    const alertDoc = await getDocs(
      query(collection(db, COLLECTIONS.SOS_ALERTS), where('__name__', '==', alertId))
    );
    
    if (alertDoc.empty) return;
    
    const alertData = alertDoc.docs[0].data();
    const mapsLink = getGoogleMapsLink(location.latitude, location.longitude);
    
    const message = `🚨 SOS LOCATION UPDATE

${alertData.userName} has moved to a new location!

📍 New Location:
${mapsLink}

🕐 Updated: ${new Date().toLocaleString()}

Please continue monitoring.`;

    const phoneNumbers = alertData.contactPhones?.join(',') || '';
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl, '_blank');
  } catch (error) {
    console.error('Error sending location update:', error);
  }
};

/**
 * Send "All Clear" notification
 */
const sendAllClearNotification = async (alertId: string): Promise<void> => {
  try {
    const alertDoc = await getDocs(
      query(collection(db, COLLECTIONS.SOS_ALERTS), where('__name__', '==', alertId))
    );
    
    if (alertDoc.empty) return;
    
    const alertData = alertDoc.docs[0].data();
    
    const message = `✅ SOS RESOLVED - ALL CLEAR

${alertData.userName} has marked themselves as SAFE.

The emergency is over. No further action needed.

🕐 Resolved: ${new Date().toLocaleString()}`;

    const phoneNumbers = alertData.contactPhones?.join(',') || '';
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl, '_blank');
  } catch (error) {
    console.error('Error sending all clear notification:', error);
  }
};

/**
 * Calculate distance between two coordinates in kilometers
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Play alarm sound
 */
let alarmAudio: HTMLAudioElement | null = null;

const playAlarmSound = () => {
  try {
    // Create audio element with alarm sound
    alarmAudio = new Audio();
    // Using a free emergency siren sound (you can replace with custom sound)
    alarmAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVK3n77BfHAU+ltrywnIlBSh+zPLaizsID2Gy7+mjUBELTKXh8bllHAY2jdXzzn0vBSl9y/DdkEAKFF607e6oVRQJRp/g8r5sIAUxh9Hz04IzBh5twO/jmUgND1St5++wXxwFPpba8sJyJQUofszy2os7CA9hsu/po1ARC0yl4fG5ZRwGNo3V8859LwUpfcvw3ZBBChVgreTxrWE=';
    alarmAudio.loop = true;
    alarmAudio.volume = 1.0;
    alarmAudio.play().catch(err => console.error('Error playing alarm:', err));
  } catch (error) {
    console.error('Error creating alarm sound:', error);
  }
};

/**
 * Stop alarm sound
 */
const stopAlarmSound = () => {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio = null;
  }
};

/**
 * Vibrate device in SOS pattern
 */
const vibrateDevice = (pattern: 'sos' | 'alert') => {
  if ('vibrate' in navigator) {
    if (pattern === 'sos') {
      // SOS pattern: ... --- ... (short-short-short long-long-long short-short-short)
      navigator.vibrate([200, 100, 200, 100, 200, 200, 500, 100, 500, 100, 500, 200, 200, 100, 200, 100, 200]);
    } else {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }
};

/**
 * Get battery level
 */
export const getBatteryLevel = async (): Promise<number | undefined> => {
  try {
    if ('getBattery' in navigator) {
      // @ts-expect-error - Battery API is experimental
      const battery = await navigator.getBattery();
      return battery.level;
    }
    return undefined;
  } catch (error) {
    console.error('Error getting battery level:', error);
    return undefined;
  }
};

/**
 * Check if device supports shake detection
 */
export const supportsShakeDetection = (): boolean => {
  return 'DeviceMotionEvent' in window;
};

/**
 * Start shake detection
 */
export const startShakeDetection = (onShake: () => void): (() => void) => {
  if (!supportsShakeDetection()) {
    console.warn('Shake detection not supported');
    return () => {};
  }

  let lastX = 0, lastY = 0, lastZ = 0;
  let lastTime = 0;

  const handleMotion = (event: DeviceMotionEvent) => {
    const current = event.accelerationIncludingGravity;
    if (!current) return;

    const currentTime = new Date().getTime();
    
    if ((currentTime - lastTime) > 100) {
      const diffTime = currentTime - lastTime;
      lastTime = currentTime;

      const x = current.x ?? 0;
      const y = current.y ?? 0;
      const z = current.z ?? 0;

      const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

      if (speed > 3000) {
        // Shake detected!
        onShake();
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    }
  };

  window.addEventListener('devicemotion', handleMotion);

  return () => {
    window.removeEventListener('devicemotion', handleMotion);
  };
};
