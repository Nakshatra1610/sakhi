import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  SafetyCheck,
  CheckInHistoryItem,
  CreateSafetyCheckData,
  createSafetyCheck,
  checkIn,
  extendDeadline,
  cancelSafetyCheck,
  sendEmergencyAlert,
  subscribeToActiveSafetyChecks,
  getCheckInHistory,
  checkAndExpireSafetyChecks
} from '@/lib/safetyCheck';

interface UseSafetyCheckReturn {
  activeChecks: SafetyCheck[];
  history: CheckInHistoryItem[];
  loading: boolean;
  error: string | null;
  createCheck: (checkData: CreateSafetyCheckData) => Promise<string>;
  performCheckIn: (checkId: string) => Promise<void>;
  extendCheckDeadline: (checkId: string, minutes: number) => Promise<void>;
  cancelCheck: (checkId: string) => Promise<void>;
  sendAlert: (checkId: string) => Promise<void>;
  loadHistory: (days?: number) => Promise<void>;
}

export const useSafetyCheck = (): UseSafetyCheckReturn => {
  const { currentUser } = useAuth();
  const [activeChecks, setActiveChecks] = useState<SafetyCheck[]>([]);
  const [history, setHistory] = useState<CheckInHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const expirationCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Periodic expiration check - runs every 30 seconds
  useEffect(() => {
    if (activeChecks.length > 0) {
      // Check immediately
      checkAndExpireSafetyChecks(activeChecks);
      
      // Then check every 30 seconds
      expirationCheckRef.current = setInterval(() => {
        checkAndExpireSafetyChecks(activeChecks);
      }, 30 * 1000);
    }

    return () => {
      if (expirationCheckRef.current) {
        clearInterval(expirationCheckRef.current);
        expirationCheckRef.current = null;
      }
    };
  }, [activeChecks]);

  // Real-time subscription to active safety checks
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      setLoading(true);
      setError(null);

      unsubscribe = subscribeToActiveSafetyChecks(
        currentUser,
        (updatedChecks) => {
          setActiveChecks(updatedChecks);
          setLoading(false);
        },
        (error) => {
          console.error('Safety checks subscription error:', error);
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
  }, [currentUser]);

  // Create new safety check
  const createCheck = async (checkData: CreateSafetyCheckData): Promise<string> => {
    try {
      setError(null);
      
      const checkId = await createSafetyCheck(checkData, currentUser);
      
      return checkId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create safety check';
      setError(errorMessage);
      throw err;
    }
  };

  // Check in (I'm safe)
  const performCheckIn = async (checkId: string): Promise<void> => {
    try {
      setError(null);
      await checkIn(checkId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setError(errorMessage);
      throw err;
    }
  };

  // Extend deadline
  const extendCheckDeadline = async (checkId: string, minutes: number): Promise<void> => {
    try {
      setError(null);
      await extendDeadline(checkId, minutes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extend deadline';
      setError(errorMessage);
      throw err;
    }
  };

  // Cancel safety check
  const cancelCheck = async (checkId: string): Promise<void> => {
    try {
      setError(null);
      await cancelSafetyCheck(checkId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel check';
      setError(errorMessage);
      throw err;
    }
  };

  // Send emergency alert
  const sendAlert = async (checkId: string): Promise<void> => {
    try {
      setError(null);
      await sendEmergencyAlert(checkId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send alert';
      setError(errorMessage);
      throw err;
    }
  };

  // Load check-in history
  const loadHistory = async (days: number = 30): Promise<void> => {
    try {
      setError(null);
      const historyData = await getCheckInHistory(currentUser, days);
      setHistory(historyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    activeChecks,
    history,
    loading,
    error,
    createCheck,
    performCheckIn,
    extendCheckDeadline,
    cancelCheck,
    sendAlert,
    loadHistory
  };
};
