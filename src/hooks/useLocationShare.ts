import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  LocationShare,
  LocationCoordinates,
  CreateShareData,
  ShareHistoryItem,
  createLocationShare,
  updateShareLocation,
  stopLocationShare,
  checkIn,
  getActiveShares,
  subscribeToActiveShares,
  getShareHistory,
  getCurrentLocation,
  watchLocation,
  getBatteryLevel,
  checkAndExpireShares
} from '@/lib/location';

interface UseLocationShareReturn {
  activeShares: LocationShare[];
  history: ShareHistoryItem[];
  currentLocation: LocationCoordinates | null;
  batteryLevel: number | undefined;
  loading: boolean;
  error: string | null;
  isTracking: boolean;
  createShare: (shareData: CreateShareData) => Promise<string>;
  stopShare: (shareId: string, checkedIn?: boolean) => Promise<void>;
  checkInShare: (shareId: string) => Promise<void>;
  refreshLocation: () => Promise<LocationCoordinates | null>;
  startTracking: () => void;
  stopTracking: () => void;
  loadHistory: (days?: number) => Promise<void>;
}

export const useLocationShare = (): UseLocationShareReturn => {
  const { currentUser } = useAuth();
  const [activeShares, setActiveShares] = useState<LocationShare[]>([]);
  const [history, setHistory] = useState<ShareHistoryItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const stopWatchRef = useRef<(() => void) | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expirationCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Periodic expiration check - runs every minute
  useEffect(() => {
    if (activeShares.length > 0) {
      // Check immediately
      checkAndExpireShares(activeShares);
      
      // Then check every minute
      expirationCheckRef.current = setInterval(() => {
        checkAndExpireShares(activeShares);
      }, 60 * 1000); // Every 60 seconds
    }

    return () => {
      if (expirationCheckRef.current) {
        clearInterval(expirationCheckRef.current);
        expirationCheckRef.current = null;
      }
    };
  }, [activeShares]);

  // Real-time subscription to active shares
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      setLoading(true);
      setError(null);

      unsubscribe = subscribeToActiveShares(
        currentUser,
        (updatedShares) => {
          setActiveShares(updatedShares);
          setLoading(false);
          
          // Auto-start tracking if there are active shares
          if (updatedShares.length > 0 && !isTracking) {
            startTracking();
          } else if (updatedShares.length === 0 && isTracking) {
            stopTracking();
          }
        },
        (error) => {
          console.error('Shares subscription error:', error);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Get initial location and battery
  useEffect(() => {
    const initLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
      } catch (err) {
        console.error('Error getting initial location:', err);
      }
    };

    const initBattery = async () => {
      const battery = await getBatteryLevel();
      setBatteryLevel(battery);
    };

    initLocation();
    initBattery();
  }, []);

  // Start continuous location tracking
  const startTracking = useCallback(() => {
    if (isTracking) return;

    setIsTracking(true);
    
    // Watch location updates
    const stopWatch = watchLocation(
      (location) => {
        setCurrentLocation(location);
        
        // Update all active shares with new location
        activeShares.forEach(async (share) => {
          try {
            const battery = await getBatteryLevel();
            await updateShareLocation(share.id, location, battery);
            setBatteryLevel(battery);
          } catch (err) {
            console.error('Error updating share location:', err);
          }
        });
      },
      (err) => {
        console.error('Location tracking error:', err);
        setError(err.message);
      }
    );

    stopWatchRef.current = stopWatch;

    // Also update battery level every 5 minutes
    updateIntervalRef.current = setInterval(async () => {
      const battery = await getBatteryLevel();
      setBatteryLevel(battery);
    }, 5 * 60 * 1000);
  }, [isTracking, activeShares]);

  // Stop continuous location tracking
  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    setIsTracking(false);

    if (stopWatchRef.current) {
      stopWatchRef.current();
      stopWatchRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, [isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Create new location share
  const createShare = async (shareData: CreateShareData): Promise<string> => {
    try {
      setError(null);
      
      // Get current location if not provided
      let location = shareData.currentLocation;
      if (!location && currentLocation) {
        location = currentLocation;
      } else if (!location) {
        location = await getCurrentLocation();
        setCurrentLocation(location);
      }

      const shareId = await createLocationShare(
        { ...shareData, currentLocation: location },
        currentUser
      );
      
      // Start tracking automatically
      startTracking();
      
      return shareId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create share';
      setError(errorMessage);
      throw err;
    }
  };

  // Stop sharing location
  const stopShare = async (shareId: string, checkedIn: boolean = false): Promise<void> => {
    try {
      setError(null);
      await stopLocationShare(shareId, checkedIn);
      
      // If no more active shares, stop tracking
      if (activeShares.length <= 1) {
        stopTracking();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop share';
      setError(errorMessage);
      throw err;
    }
  };

  // Check in (arrived safely)
  const checkInShare = async (shareId: string): Promise<void> => {
    try {
      setError(null);
      await checkIn(shareId);
      
      // If no more active shares, stop tracking
      if (activeShares.length <= 1) {
        stopTracking();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setError(errorMessage);
      throw err;
    }
  };

  // Refresh current location manually
  const refreshLocation = async (): Promise<LocationCoordinates | null> => {
    try {
      setError(null);
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      const battery = await getBatteryLevel();
      setBatteryLevel(battery);
      
      return location;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh location';
      setError(errorMessage);
      throw err;
    }
  };

  // Load share history
  const loadHistory = async (days: number = 7): Promise<void> => {
    try {
      setError(null);
      const historyData = await getShareHistory(currentUser, days);
      setHistory(historyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    activeShares,
    history,
    currentLocation,
    batteryLevel,
    loading,
    error,
    isTracking,
    createShare,
    stopShare,
    checkInShare,
    refreshLocation,
    startTracking,
    stopTracking,
    loadHistory
  };
};
