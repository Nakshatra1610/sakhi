/**
 * Overpass API Integration for OpenStreetMap
 * Fetches real police stations, hospitals, and other amenities
 * Completely FREE - no API key required
 */

export interface OSMPlace {
  id: string;
  name: string;
  category: 'police' | 'hospital';
  address: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  distance?: string;
}

// Multiple Overpass API servers for redundancy
const OVERPASS_SERVERS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];

/**
 * Fetch with retry logic using multiple servers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWithRetry(query: string, retries: number = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const serverIndex = i % OVERPASS_SERVERS.length;
    const server = OVERPASS_SERVERS[serverIndex];
    
    try {
      console.log(`Trying server ${serverIndex + 1}/${OVERPASS_SERVERS.length}: ${server}`);
      
      const response = await fetch(server, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout per request
      });

      if (response.ok) {
        return await response.json();
      }
      
      console.warn(`Server ${serverIndex + 1} returned status ${response.status}`);
    } catch (error) {
      console.warn(`Server ${serverIndex + 1} failed:`, error);
      if (i === retries - 1) {
        throw error;
      }
      // Wait 500ms before trying next server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('All servers failed');
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance in human-readable format
 */
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Fetch police stations near a location
 */
export async function fetchNearbyPoliceStations(
  latitude: number,
  longitude: number,
  radiusKm: number = 10 // Increased to 10km for better coverage
): Promise<OSMPlace[]> {
  // Calculate bounding box (more reliable than radius queries)
  const latOffset = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lonOffset = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
  
  const south = latitude - latOffset;
  const north = latitude + latOffset;
  const west = longitude - lonOffset;
  const east = longitude + lonOffset;
  
  // Simplified bounding box query - more reliable than radius
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="police"](${south},${west},${north},${east});
      way["amenity"="police"](${south},${west},${north},${east});
      relation["amenity"="police"](${south},${west},${north},${east});
    );
    out center;
  `;

  console.log('Police query bbox:', { south, north, west, east, radiusKm });
  console.log('Police query:', query);

  try {
    const data = await fetchWithRetry(query);
    const places: OSMPlace[] = [];

    console.log('Overpass API response for police:', data.elements?.length || 0, 'elements');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.elements.forEach((element: any) => {
      if (element.tags && (element.tags.amenity === 'police' || element.tags.office === 'government')) {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;

        if (lat && lon) {
          const distance = calculateDistance(latitude, longitude, lat, lon);
          
          places.push({
            id: `osm-police-${element.id}`,
            name: element.tags.name || 'Police Station',
            category: 'police',
            address: element.tags['addr:full'] || 
                     element.tags['addr:street'] || 
                     `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            coordinates: { lat, lng: lon },
            phone: element.tags.phone || element.tags['contact:phone'],
            distance: formatDistance(distance),
          });
        }
      }
    });

    console.log('Parsed police stations:', places.length);

    // Sort by distance
    return places.sort((a, b) => {
      const distA = parseFloat(a.distance || '999');
      const distB = parseFloat(b.distance || '999');
      return distA - distB;
    });
  } catch (error) {
    console.error('Error fetching police stations:', error);
    return [];
  }
}

/**
 * Fetch hospitals near a location
 */
export async function fetchNearbyHospitals(
  latitude: number,
  longitude: number,
  radiusKm: number = 10 // Increased to 10km for better coverage
): Promise<OSMPlace[]> {
  // Calculate bounding box (more reliable than radius queries)
  const latOffset = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lonOffset = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
  
  const south = latitude - latOffset;
  const north = latitude + latOffset;
  const west = longitude - lonOffset;
  const east = longitude + lonOffset;
  
  // Simplified bounding box query - searches for multiple healthcare types
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](${south},${west},${north},${east});
      way["amenity"="hospital"](${south},${west},${north},${east});
      relation["amenity"="hospital"](${south},${west},${north},${east});
      node["amenity"="clinic"](${south},${west},${north},${east});
      way["amenity"="clinic"](${south},${west},${north},${east});
      node["amenity"="doctors"](${south},${west},${north},${east});
    );
    out center;
  `;

  console.log('Hospital query bbox:', { south, north, west, east, radiusKm });
  console.log('Hospital query:', query);

  try {
    const data = await fetchWithRetry(query);
    const places: OSMPlace[] = [];

    console.log('Overpass API response for hospitals:', data.elements?.length || 0, 'elements');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.elements.forEach((element: any) => {
      if (element.tags && (element.tags.amenity === 'hospital' || element.tags.amenity === 'clinic' || element.tags.amenity === 'doctors' || element.tags.healthcare)) {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;

        if (lat && lon) {
          const distance = calculateDistance(latitude, longitude, lat, lon);
          
          places.push({
            id: `osm-hospital-${element.id}`,
            name: element.tags.name || 
                  (element.tags.amenity === 'clinic' ? 'Medical Clinic' : 'Hospital'),
            category: 'hospital',
            address: element.tags['addr:full'] || 
                     element.tags['addr:street'] || 
                     `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            coordinates: { lat, lng: lon },
            phone: element.tags.phone || 
                   element.tags['contact:phone'] || 
                   element.tags.emergency,
            distance: formatDistance(distance),
          });
        }
      }
    });

    console.log('Parsed hospitals:', places.length);

    // Sort by distance
    return places.sort((a, b) => {
      const distA = parseFloat(a.distance || '999');
      const distB = parseFloat(b.distance || '999');
      return distA - distB;
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }
}

/**
 * Fetch both police stations and hospitals
 */
export async function fetchNearbySafePlaces(
  latitude: number,
  longitude: number,
  radiusKm: number = 3 // Reduced from 5 to 3km for better performance
): Promise<{ police: OSMPlace[]; hospitals: OSMPlace[] }> {
  try {
    console.log('Fetching nearby police stations...');
    const police = await fetchNearbyPoliceStations(latitude, longitude, radiusKm);
    
    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Fetching nearby hospitals...');
    const hospitals = await fetchNearbyHospitals(latitude, longitude, radiusKm);

    return { police, hospitals };
  } catch (error) {
    console.error('Error fetching nearby safe places:', error);
    // Return empty arrays instead of throwing
    return { police: [], hospitals: [] };
  }
}
