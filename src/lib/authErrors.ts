import { FirebaseError } from 'firebase/app';

/**
 * Maps Firebase authentication error codes to user-friendly messages
 */
export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/invalid-phone-number':
        return 'Please enter a valid phone number.';
      case 'auth/missing-email':
        return 'Please enter your email address.';
      case 'auth/missing-password':
        return 'Please enter your password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked by browser. Please allow pop-ups and try again.';
      case 'auth/internal-error':
        return 'An internal error occurred. Please try again.';
      case 'auth/timeout':
        return 'Request timed out. Please try again.';
      case 'auth/quota-exceeded':
        return 'Service quota exceeded. Please try again later.';
      default:
        console.error('Unhandled Firebase Auth error:', error.code, error.message);
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  console.error('Unknown error type:', error);
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters long.' };
  }
  return { isValid: true };
};

/**
 * Validates phone number format (basic validation)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's a reasonable length (7-15 digits)
  return cleaned.length >= 7 && cleaned.length <= 15;
};
