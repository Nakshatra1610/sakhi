# Google Maps Integration Setup Guide

## Overview
This guide explains how to set up Google Maps integration for the Safe Places feature in the Sakhi women's safety web application.

## Prerequisites
- Google Cloud Platform account
- Google Maps JavaScript API enabled
- Valid API key with appropriate permissions

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Distance Matrix API
   - Geocoding API

4. Create credentials:
   - Go to "Credentials" in the left sidebar
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

## Step 2: Configure API Key Restrictions

For security, restrict your API key:

1. In the API key settings, add HTTP referrers:
   ```
   http://localhost:*/*
   https://yourdomain.com/*
   ```

2. Restrict to specific APIs:
   - Maps JavaScript API
   - Places API
   - Distance Matrix API
   - Geocoding API

## Step 3: Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
   ```

## Step 4: Features Included

### 🗺️ Interactive Map
- Real-time map with user location
- Custom markers for different place categories
- Click-to-view place details

### 📍 Location Services
- Automatic user location detection
- Distance calculation to safe places
- Real-time directions integration

### 🏢 Place Categories
- **Police Stations** (Blue markers)
- **Hospitals** (Red markers) 
- **Shelters** (Green markers)
- **Personal Places** (Purple markers)
- **Public Places** (Gray markers)

### 🧭 Navigation Features
- Get directions to any place
- Open in Google Maps app
- Call emergency numbers directly

## Step 5: Usage

1. Navigate to Safe Places page
2. Switch between List and Map views
3. Click on markers to see place details
4. Use "Get Directions" for navigation
5. Add your own safe places

## Development Notes

### Map Configuration
The map is configured with:
- Default center: New Delhi (28.6139, 77.2090)
- Default zoom: 13
- Custom styling to hide business POIs
- User location marker in blue

### Geolocation Fallback
If location access is denied:
- Falls back to New Delhi coordinates
- Still shows all safe places
- Distance calculations use fallback location

### Performance Optimization
- Lazy loading of Google Maps API
- Efficient marker management
- Optimized distance calculations

## Troubleshooting

### Common Issues

1. **Map not loading**
   - Check API key is valid
   - Verify APIs are enabled
   - Check browser console for errors

2. **Location not detected**
   - Browser may block location access
   - Check HTTPS requirement for production
   - Falls back to default location

3. **Directions not working**
   - Ensure coordinates are valid
   - Check Google Maps app is available
   - Verify API permissions

### Error Handling
The app includes comprehensive error handling:
- API loading failures
- Geolocation errors
- Network connectivity issues
- Invalid coordinates

## Security Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Restrict API key usage

2. **Domain Restrictions**
   - Limit API key to specific domains
   - Use HTTPS in production
   - Monitor API usage

3. **Rate Limiting**
   - Implement client-side caching
   - Optimize API calls
   - Monitor quotas

## Cost Optimization

### Free Tier Limits
- Maps JavaScript API: $200 credit/month
- Distance Matrix API: 40,000 elements/month
- Geocoding API: 40,000 requests/month

### Tips to Reduce Costs
1. Cache location data
2. Batch distance calculations  
3. Use static maps where possible
4. Implement request deduplication

## Future Enhancements

- [ ] Offline map support
- [ ] Route optimization for multiple places
- [ ] Real-time traffic information
- [ ] Custom map themes
- [ ] Advanced search and filtering
- [ ] Place photos and reviews
- [ ] Crowd-sourced safety ratings

## Support

For technical issues:
1. Check the browser console for errors
2. Verify API key and permissions
3. Test with a fresh browser session
4. Check network connectivity

## Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
