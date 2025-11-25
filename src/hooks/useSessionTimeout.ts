import { useEffect, useRef, useCallback } from 'react';
import { signOutUser } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface UseSessionTimeoutProps {
  timeoutDuration?: number; // in milliseconds
  warningDuration?: number; // warning before timeout
  onTimeout?: () => void;
  onWarning?: () => void;
}

export const useSessionTimeout = ({
  timeoutDuration = 10 * 60 * 1000, // 10 minutes default
  warningDuration = 2 * 60 * 1000,  // 2 minutes warning
  onTimeout,
  onWarning
}: UseSessionTimeoutProps = {}) => {
  const { currentUser } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Reset warning flag
    warningShownRef.current = false;
    lastActivityRef.current = Date.now();

    // Only set timeout if user is logged in
    if (!currentUser) return;

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        
        toast({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${warningDuration / (60 * 1000)} minutes due to inactivity.`,
          variant: "destructive",
          duration: 10000,
        });

        if (onWarning) {
          onWarning();
        }
      }
    }, timeoutDuration - warningDuration);

    // Set actual timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await signOutUser();
        
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity for security reasons.",
          variant: "destructive",
          duration: 5000,
        });

        if (onTimeout) {
          onTimeout();
        }
      } catch (error) {
        console.error('Error during automatic logout:', error);
      }
    }, timeoutDuration);
  }, [currentUser, timeoutDuration, warningDuration, onTimeout, onWarning]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    // Only reset if more than 30 seconds have passed since last activity
    // This prevents excessive timeout resets
    if (now - lastActivityRef.current > 30000) {
      resetTimeout();
    }
  }, [resetTimeout]);

  useEffect(() => {
    // Initialize timeout when user logs in
    if (currentUser) {
      resetTimeout();
    }

    // Activity event listeners
    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart', 
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [currentUser, handleActivity, resetTimeout]);

  // Manual session extension
  const extendSession = useCallback(() => {
    resetTimeout();
    toast({
      title: "Session Extended",
      description: "Your session has been extended successfully.",
      duration: 3000,
    });
  }, [resetTimeout]);

  // Get remaining time
  const getRemainingTime = useCallback(() => {
    if (!currentUser) return 0;
    const elapsed = Date.now() - lastActivityRef.current;
    return Math.max(0, timeoutDuration - elapsed);
  }, [currentUser, timeoutDuration]);

  return {
    extendSession,
    getRemainingTime,
    resetTimeout
  };
};
