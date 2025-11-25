import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  fallbackLocation?: { lat: number; lng: number };
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watch = false,
    fallbackLocation = { lat: 28.6139, lng: 77.2090 } // New Delhi
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    error: null,
    loading: false
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      error: null,
      loading: false
    });
  }, []);

  const updateError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unknown geolocation error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
      // Use fallback location on error
      latitude: fallbackLocation.lat,
      longitude: fallbackLocation.lng,
      accuracy: null,
      timestamp: Date.now()
    }));
  }, [fallbackLocation]);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false,
        latitude: fallbackLocation.lat,
        longitude: fallbackLocation.lng,
        timestamp: Date.now()
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      updateError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, updateError, fallbackLocation]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId !== null) return;

    const id = navigator.geolocation.watchPosition(
      updatePosition,
      updateError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, updateError, watchId]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const clearPosition = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      error: null,
      loading: false
    });
  }, []);

  // Auto-start based on options
  useEffect(() => {
    if (watch) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch, getCurrentPosition, startWatching, watchId]);

  // Derived values
  const isLocationAvailable = state.latitude !== null && state.longitude !== null;
  const coordinates = isLocationAvailable 
    ? { lat: state.latitude!, lng: state.longitude! }
    : null;

  return {
    ...state,
    isLocationAvailable,
    coordinates,
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearPosition,
    isWatching: watchId !== null
  };
};
