# Google Maps Integration Setup Guide

## Overview
The SafePlaces feature now includes real-time Google Maps integration with the following capabilities:

- **Interactive Map View**: Toggle between list and map views of safe places
- **Real-time Location**: Automatic user location detection and display
- **Distance Calculation**: Real-time distance calculation to safe places
- **Markers with Info Windows**: Clickable markers with place details
- **Custom Styling**: Optimized map styling for safety applications
- **Responsive Design**: Works on all device sizes

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (for future enhancements)
   - Geocoding API (for address-to-coordinates conversion)
   - Distance Matrix API (for real-time distance calculation)

4. Create credentials (API Key):
   - Go to "Credentials" in the sidebar
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 2. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Other existing environment variables...
```

### 3. API Key Security (Important!)

For production deployment, restrict your API key:

1. In Google Cloud Console, go to "Credentials"
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain (e.g., `yourdomain.com/*`)
4. Under "API restrictions":
   - Select "Restrict key"
   - Choose the APIs you're using

### 4. Test the Integration

1. Add your API key to `.env`
2. Restart the development server: `npm run dev`
3. Navigate to Safe Places page
4. Click on "Map View" tab
5. Grant location permission when prompted

## Features Implemented

### 🗺️ **Interactive Map Component**
- Custom Google Maps integration with React hooks
- Automatic map initialization and cleanup
- Error handling and loading states
- Fallback to demo mode without API key

### 📍 **Location Services**
- Automatic user location detection
- Graceful fallback to default location (New Delhi)
- Custom user location marker
- Privacy-conscious location handling

### 📏 **Distance Calculation**
- Real-time distance calculation using Google Distance Matrix API
- Fallback to straight-line distance calculation
- Metric system (kilometers)
- Automatic updates when user location changes

### 🏷️ **Interactive Markers**
- Custom markers for each safe place category
- Click-to-open info windows
- Animated marker drops
- Category-specific styling and colors

### 🎨 **Map Styling**
- Custom map styles optimized for safety applications
- Reduced visual clutter (hidden business POIs)
- Professional appearance
- Accessible color schemes

## File Structure

```
src/
├── components/
│   ├── SafePlacesMap.tsx          # Full Google Maps integration
│   └── SafePlacesMapDemo.tsx      # Demo version (no API key needed)
├── hooks/
│   └── useGoogleMaps.ts           # Custom Google Maps hook
├── pages/
│   └── SafePlaces.tsx             # Updated with map/list tabs
├── utils/
│   └── mapUtils.ts                # Map utilities and mock data
└── .env.example                   # Environment variables template
```

## Usage Examples

### Basic Map Integration
```tsx
import SafePlacesMap from '@/components/SafePlacesMap';

<SafePlacesMap 
  places={safePlaces} 
  className="h-96 w-full rounded-lg"
  onPlaceClick={(place) => console.log('Clicked:', place)}
/>
```

### Custom Map Configuration
```tsx
const { map, userLocation, addMarker } = useGoogleMaps({
  center: { lat: 28.6139, lng: 77.2090 },
  zoom: 13,
  apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY
});
```

## Next Steps for Real-time Features

### 🔄 **Live Location Tracking**
- Implement geolocation watch for real-time position updates
- Add movement detection for safety monitoring
- Battery-optimized location tracking

### 🚨 **Emergency Integration**
- Nearest hospital/police station routing
- One-click emergency directions
- Emergency contact notification with location

### 🛡️ **Safety Zones**
- Geofencing for safe/unsafe areas
- Automatic alerts when entering/leaving safe zones
- Community-reported safety data integration

### 📱 **Mobile Enhancements**
- Progressive Web App (PWA) capabilities
- Offline map caching
- Native GPS integration

## Troubleshooting

### Common Issues

1. **Map not loading**: Check API key and network connectivity
2. **Location permission denied**: Handle gracefully with fallback location
3. **Distance calculation fails**: Automatic fallback to straight-line distance
4. **Performance on mobile**: Implement marker clustering for large datasets

### Performance Optimization

- Lazy loading of map components
- Marker clustering for many locations
- Debounced search and filtering
- Efficient re-rendering with React.memo

## Security Considerations

- API key restrictions (domain and API limits)
- User location privacy (opt-in only)
- Secure storage of user data
- HTTPS-only in production

---

This integration provides a solid foundation for real-time safety features while maintaining privacy and performance!
