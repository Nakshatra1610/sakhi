import { createContext } from 'react';

export interface SessionContextType {
  extendSession: () => void;
  getRemainingTime: () => number;
  isWarningShown: boolean;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);
