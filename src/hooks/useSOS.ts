import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  SOSAlert,
  CreateSOSData,
  triggerSOS,
  updateSOSLocation,
  resolveSOSAlert,
  cancelSOSAlert,
  subscribeToActiveSOSAlerts,
  getSOSHistory,
  getBatteryLevel,
  startShakeDetection,
  supportsShakeDetection
} from '@/lib/sos';
import { getCurrentLocation } from '@/lib/location';

interface UseSOSReturn {
  activeAlerts: SOSAlert[];
  history: SOSAlert[];
  loading: boolean;
  error: string | null;
  isShakeEnabled: boolean;
  activateSOSWithCountdown: (countdown: number, mode: 'silent' | 'loud') => Promise<void>;
  activateSOS: (sosData: CreateSOSData) => Promise<string>;
  resolveAlert: (alertId: string, pin?: string) => Promise<void>;
  cancelAlert: (alertId: string, pin?: string) => Promise<void>;
  loadHistory: (days?: number) => Promise<void>;
  enableShakeDetection: () => void;
  disableShakeDetection: () => void;
}

export const useSOS = (): UseSOSReturn => {
  const { currentUser } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [history, setHistory] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShakeEnabled, setIsShakeEnabled] = useState(false);
  
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shakeDetectionStopRef = useRef<(() => void) | null>(null);

  // Real-time subscription to active SOS alerts
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      setLoading(true);
      setError(null);

      unsubscribe = subscribeToActiveSOSAlerts(
        currentUser,
        (updatedAlerts) => {
          setActiveAlerts(updatedAlerts);
          setLoading(false);
          
          // Start location tracking if there are active alerts
          if (updatedAlerts.length > 0) {
            startLocationTracking(updatedAlerts[0].id);
          } else {
            stopLocationTracking();
          }
        },
        (error) => {
          console.error('SOS subscription error:', error);
          setError(error.message);
          setLoading(false);
        }
      );
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      stopLocationTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Start continuous location tracking for active SOS
  const startLocationTracking = useCallback((alertId: string) => {
    // Clear any existing interval
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    // Update location every 30 seconds
    locationUpdateIntervalRef.current = setInterval(async () => {
      try {
        const location = await getCurrentLocation();
        const battery = await getBatteryLevel();
        
        await updateSOSLocation(alertId, location, battery);
      } catch (err) {
        console.error('Error updating SOS location:', err);
      }
    }, 30000); // Every 30 seconds
  }, []);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
  }, []);

  // Enable shake detection
  const enableShakeDetection = useCallback(() => {
    if (!supportsShakeDetection()) {
      alert('Shake detection is not supported on this device');
      return;
    }

    if (shakeDetectionStopRef.current) {
      return; // Already enabled
    }

    const stopShake = startShakeDetection(() => {
      // Shake detected - trigger SOS with countdown
      console.log('Shake detected - triggering SOS');
    });

    shakeDetectionStopRef.current = stopShake;
    setIsShakeEnabled(true);
  }, []);

  // Disable shake detection
  const disableShakeDetection = useCallback(() => {
    if (shakeDetectionStopRef.current) {
      shakeDetectionStopRef.current();
      shakeDetectionStopRef.current = null;
      setIsShakeEnabled(false);
    }
  }, []);

  // Cleanup shake detection on unmount
  useEffect(() => {
    return () => {
      disableShakeDetection();
    };
  }, [disableShakeDetection]);

  // Activate SOS with countdown
  const activateSOSWithCountdown = async (
    countdown: number,
    mode: 'silent' | 'loud'
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      let timeLeft = countdown;
      
      const countdownInterval = setInterval(() => {
        timeLeft--;
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          // Trigger SOS
          activateSOS({
            contacts: [], // Will be filled from primary contact
            mode,
            currentLocation: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() }
          })
            .then(() => resolve())
            .catch(reject);
        }
      }, 1000);

      // Store interval ID for potential cancellation
      interface WindowWithSOS extends Window {
        __sosCountdownInterval?: NodeJS.Timeout;
      }
      (window as WindowWithSOS).__sosCountdownInterval = countdownInterval;
    });
  };

  // Activate SOS immediately
  const activateSOS = async (sosData: CreateSOSData): Promise<string> => {
    try {
      console.log('useSOS: Starting SOS activation...', sosData);
      setError(null);
      
      // Get current location
      let location = sosData.currentLocation;
      if (!location || (location.latitude === 0 && location.longitude === 0)) {
        console.log('useSOS: Fetching real location...');
        try {
          location = await getCurrentLocation();
          console.log('useSOS: Got real location:', location);
        } catch (locErr) {
          console.error('useSOS: Failed to get location:', locErr);
          throw new Error('Unable to get your current location. Please enable location services and try again.');
        }
      }

      // Check if user is logged in
      if (!currentUser) {
        console.error('useSOS: No user logged in');
        throw new Error('You must be logged in to trigger SOS');
      }
      console.log('useSOS: User authenticated:', currentUser.uid);

      // Get battery level
      console.log('useSOS: Getting battery level...');
      const battery = await getBatteryLevel();
      console.log('useSOS: Battery level:', battery);

      console.log('useSOS: Calling triggerSOS...');
      const alertId = await triggerSOS(
        { ...sosData, currentLocation: location, batteryLevel: battery },
        currentUser
      );
      console.log('useSOS: SOS triggered successfully! Alert ID:', alertId);
      
      return alertId;
    } catch (err) {
      console.error('useSOS: Failed to activate SOS:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate SOS';
      setError(errorMessage);
      throw err;
    }
  };

  // Resolve SOS alert
  const resolveAlert = async (alertId: string, pin?: string): Promise<void> => {
    try {
      setError(null);
      await resolveSOSAlert(alertId, pin);
      stopLocationTracking();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve SOS';
      setError(errorMessage);
      throw err;
    }
  };

  // Cancel SOS alert
  const cancelAlert = async (alertId: string, pin?: string): Promise<void> => {
    try {
      setError(null);
      await cancelSOSAlert(alertId, pin);
      stopLocationTracking();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel SOS';
      setError(errorMessage);
      throw err;
    }
  };

  // Load SOS history
  const loadHistory = async (days: number = 30): Promise<void> => {
    try {
      setError(null);
      const historyData = await getSOSHistory(currentUser, days);
      setHistory(historyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    activeAlerts,
    history,
    loading,
    error,
    isShakeEnabled,
    activateSOSWithCountdown,
    activateSOS,
    resolveAlert,
    cancelAlert,
    loadHistory,
    enableShakeDetection,
    disableShakeDetection
  };
};
