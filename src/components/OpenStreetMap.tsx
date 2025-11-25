import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface SafePlace {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'shelter' | 'personal' | 'public';
  address: string;
  coordinates?: { lat: number; lng: number };
  phone?: string;
  rating: number;
  distance?: string;
  isVerified: boolean;
  addedBy: 'system' | 'user';
  description?: string;
}

interface OpenStreetMapProps {
  places: SafePlace[];
  className?: string;
  onPlaceClick?: (place: SafePlace) => void;
  userLocation?: { lat: number; lng: number } | null;
}

// Component to update map view when places change
const MapUpdater: React.FC<{ places: SafePlace[]; userLocation?: { lat: number; lng: number } | null }> = ({ places, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (places.length > 0 || userLocation) {
      const bounds: LatLngExpression[] = [];

      if (userLocation) {
        bounds.push([userLocation.lat, userLocation.lng]);
      }

      places.forEach(place => {
        if (place.coordinates) {
          bounds.push([place.coordinates.lat, place.coordinates.lng]);
        }
      });

      if (bounds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.fitBounds(bounds as any, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [places, userLocation, map]);

  return null;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    police: '#3b82f6',
    hospital: '#ef4444',
    shelter: '#10b981',
    personal: '#8b5cf6',
    public: '#6b7280'
  };
  return colors[category] || '#6b7280';
};

const createCustomIcon = (category: string) => {
  const color = getCategoryColor(category);
  const svgIcon = `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 25 15 25s15-13.75 15-25c0-8.284-6.716-15-15-15z" 
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
};

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ 
  places, 
  className = "h-96 w-full rounded-lg border",
  onPlaceClick,
  userLocation 
}) => {
  const defaultCenter: LatLngExpression = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : [28.6139, 77.2090]; // Default to New Delhi

  const placesWithCoords = places.filter(place => place.coordinates);

  return (
    <div className="space-y-4">
      {!userLocation && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Enable location access for accurate distances and better recommendations.
          </AlertDescription>
        </Alert>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        className={className}
        style={{ height: '100%', minHeight: '400px', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={new Icon({
              iconUrl: `data:image/svg+xml;base64,${btoa(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#ec4899" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `)}`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <strong>Your Location</strong>
            </Popup>
          </Marker>
        )}

        {/* Safe places markers */}
        {placesWithCoords.map((place) => (
          <Marker
            key={place.id}
            position={[place.coordinates!.lat, place.coordinates!.lng]}
            icon={createCustomIcon(place.category)}
            eventHandlers={{
              click: () => onPlaceClick?.(place),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{place.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{place.address}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-gray-100 capitalize">
                    {place.category}
                  </span>
                  {place.distance && (
                    <span className="text-gray-500">{place.distance}</span>
                  )}
                </div>
                {place.phone && (
                  <p className="text-xs text-gray-600 mt-1">📞 {place.phone}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapUpdater places={placesWithCoords} userLocation={userLocation} />
      </MapContainer>

      {placesWithCoords.length === 0 && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            No safe places to display on the map. Add some places to see them here.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OpenStreetMap;
