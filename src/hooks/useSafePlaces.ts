import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  SafePlace, 
  CreateSafePlaceData, 
  PlaceHelpfulness,
  getSafePlaces, 
  addSafePlace, 
  subscribeSafePlaces,
  deleteSafePlace,
  reportSafePlace,
  submitPlaceHelpfulness,
  getUserHelpfulnessForPlace,
  initializeHelpfulnessFields
} from '@/lib/safePlaces';
import { removeSystemPlaces } from '@/lib/initializeFirestore';

interface UseSafePlacesReturn {
  places: SafePlace[];
  loading: boolean;
  error: string | null;
  addPlace: (placeData: CreateSafePlaceData) => Promise<void>;
  deletePlace: (placeId: string) => Promise<void>;
  reportPlace: (placeId: string) => Promise<void>;
  refreshPlaces: () => Promise<void>;
  submitFeedback: (placeId: string, isHelpful: boolean, serviceTags?: string[]) => Promise<void>;
  getUserFeedback: (placeId: string) => Promise<PlaceHelpfulness | null>;
  initializeHelpfulness: () => Promise<void>;
  removeSystemPlaces: () => Promise<void>;
}

export const useSafePlaces = (): UseSafePlacesReturn => {
  const { currentUser } = useAuth();
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load and real-time subscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      setLoading(true);
      setError(null);

      // Set up real-time subscription
      unsubscribe = subscribeSafePlaces(
        currentUser,
        (updatedPlaces) => {
          setPlaces(updatedPlaces);
          setLoading(false);
        },
        (error) => {
          console.error('Safe places subscription error:', error);
          setError(error.message);
          setLoading(false);
        }
      );
    };

    setupSubscription();

    // Cleanup subscription on unmount or user change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const addPlace = async (placeData: CreateSafePlaceData): Promise<void> => {
    try {
      setError(null);
      await addSafePlace(placeData, currentUser);
      // Real-time subscription will automatically update the places list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add place';
      setError(errorMessage);
      throw error;
    }
  };

  const deletePlace = async (placeId: string): Promise<void> => {
    try {
      setError(null);
      await deleteSafePlace(placeId, currentUser);
      // Real-time subscription will automatically update the places list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fail ed to delete place';
      setError(errorMessage);
      throw error;
    }
  };

  const reportPlace = async (placeId: string): Promise<void> => {
    try {
      setError(null);
      await reportSafePlace(placeId, currentUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to report place';
      setError(errorMessage);
      throw error;
    }
  };

  const refreshPlaces = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedPlaces = await getSafePlaces(currentUser);
      setPlaces(updatedPlaces);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh places';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (placeId: string, isHelpful: boolean, serviceTags?: string[]): Promise<void> => {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error('You must be signed in to provide feedback');
      }
      await submitPlaceHelpfulness(placeId, currentUser.uid, isHelpful, serviceTags);
      // Real-time subscription will automatically update the places list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      setError(errorMessage);
      throw error;
    }
  };

  const getUserFeedback = async (placeId: string): Promise<PlaceHelpfulness | null> => {
    try {
      if (!currentUser) {
        return null;
      }
      return await getUserHelpfulnessForPlace(placeId, currentUser.uid);
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return null;
    }
  };

  const initializeHelpfulness = async (): Promise<void> => {
    try {
      setError(null);
      await initializeHelpfulnessFields();
      // Refresh places to get updated data
      await refreshPlaces();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize helpfulness fields';
      setError(errorMessage);
      throw error;
    }
  };

  const removeSystemPlacesFunction = async (): Promise<void> => {
    try {
      setError(null);
      await removeSystemPlaces();
      // Refresh places to remove deleted system places
      await refreshPlaces();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove system places';
      setError(errorMessage);
      throw error;
    }
  };

  return {
    places,
    loading,
    error,
    addPlace,
    deletePlace,
    reportPlace,
    refreshPlaces,
    submitFeedback,
    getUserFeedback,
    initializeHelpfulness,
    removeSystemPlaces: removeSystemPlacesFunction
  };
};
