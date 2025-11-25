import React, { useState, useEffect } from 'react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuth } from '@/hooks/useAuth';
import { SessionContext, SessionContextType } from '@/contexts/SessionContextType';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionProviderProps {
  children: React.ReactNode;
  timeoutDuration?: number;
  warningDuration?: number;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ 
  children, 
  timeoutDuration = 10 * 60 * 1000, // 10 minutes
  warningDuration = 2 * 60 * 1000    // 2 minutes warning
}) => {
  const { currentUser } = useAuth();
  const [isWarningShown, setIsWarningShown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const { extendSession, getRemainingTime } = useSessionTimeout({
    timeoutDuration,
    warningDuration,
    onWarning: () => {
      setIsWarningShown(true);
      setRemainingTime(warningDuration);
    },
    onTimeout: () => {
      setIsWarningShown(false);
    }
  });

  // Update remaining time when warning is shown
  useEffect(() => {
    if (!isWarningShown) return;

    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        setIsWarningShown(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isWarningShown, getRemainingTime]);

  const handleExtendSession = () => {
    extendSession();
    setIsWarningShown(false);
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const value: SessionContextType = {
    extendSession: handleExtendSession,
    getRemainingTime,
    isWarningShown
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      
      {/* Session Warning Dialog */}
      {currentUser && (
        <Dialog open={isWarningShown} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Session Expiring Soon</DialogTitle>
                  <DialogDescription className="mt-1">
                    Your session will expire due to inactivity
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-mono font-bold">
                  {formatTime(remainingTime)}
                </span>
                <span className="text-sm text-muted-foreground">remaining</span>
              </div>
              
              <div className="text-sm text-muted-foreground text-center">
                For your security, you'll be automatically logged out if inactive.
                <br />
                Click "Stay Logged In" to extend your session.
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsWarningShown(false)}
                >
                  Log Out Now
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleExtendSession}
                >
                  Stay Logged In
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </SessionContext.Provider>
  );
};
