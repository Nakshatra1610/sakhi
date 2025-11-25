import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Shield, 
  Building2, 
  Cross,
  Users,
  Filter,
  Map,
  Loader2,
  AlertTriangle,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import OpenStreetMap from "@/components/OpenStreetMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSafePlaces } from "@/hooks/useSafePlaces";
import { useAuth } from "@/hooks/useAuth";
import { CreateSafePlaceData } from "@/lib/safePlaces";
import PlaceHelpfulness from "@/components/PlaceHelpfulness";
import { fetchNearbySafePlaces, OSMPlace } from "@/lib/overpassApi";

// Import SafePlace type from the safePlaces service
import { SafePlace } from "@/lib/safePlaces";

const categoryIcons = {
  police: Shield,
  hospital: Cross,
  shelter: Users,
  personal: MapPin,
  public: Building2
};

const categoryColors = {
  police: 'bg-primary/10 text-primary',
  hospital: 'bg-destructive/10 text-destructive',
  shelter: 'bg-success/10 text-success',
  personal: 'bg-accent/10 text-accent',
  public: 'bg-muted text-muted-foreground'
};

const SafePlaces = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { places, loading, error, addPlace, deletePlace, submitFeedback, getUserFeedback, initializeHelpfulness, removeSystemPlaces } = useSafePlaces();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // OpenStreetMap places state
  const [osmPlaces, setOsmPlaces] = useState<OSMPlace[]>([]);
  const [loadingOSM, setLoadingOSM] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Form state for adding new place
  const [newPlace, setNewPlace] = useState<CreateSafePlaceData>({
    name: '',
    category: currentUser ? 'personal' : 'public',
    address: '',
    phone: '',
    description: ''
  });

  // Reset form category when auth state changes
  useEffect(() => {
    setNewPlace(prev => ({
      ...prev,
      category: currentUser ? 'personal' : 'public'
    }));
  }, [currentUser]);

  // Fetch user location and nearby places from OpenStreetMap
  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        return;
      }

      setLoadingOSM(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);

          try {
            const { police, hospitals } = await fetchNearbySafePlaces(
              location.lat,
              location.lng,
              10 // 10km radius for better coverage
            );
            
            setOsmPlaces([...police, ...hospitals]);
            console.log(`Fetched ${police.length} police stations and ${hospitals.length} hospitals`);
          } catch (error) {
            console.error('Error fetching OSM places:', error);
          } finally {
            setLoadingOSM(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoadingOSM(false);
        }
      );
    };

    fetchNearbyPlaces();
  }, []);

  // Combine user places with OSM places for display
  const allPlaces: SafePlace[] = [
    ...places, 
    ...osmPlaces.map(osm => ({
      id: osm.id,
      name: osm.name,
      category: osm.category,
      address: osm.address,
      coordinates: { lat: osm.coordinates.lat, lng: osm.coordinates.lng },
      phone: osm.phone,
      rating: 5,
      distance: osm.distance,
      isVerified: true,
      addedBy: 'system' as const,
      description: `Real ${osm.category} from OpenStreetMap`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      // Optional feedback properties (OSM places don't have feedback yet)
      totalFeedback: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      helpfulnessScore: 0,
      confidenceLevel: 'low' as const,
    } as SafePlace))
  ];

  console.log('Total places:', allPlaces.length, 'OSM places:', osmPlaces.length, 'User places:', places.length);

  // Filter places based on search and category
  const filteredPlaces = allPlaces.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         place.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Priority order: police > hospital > shelter > public > personal
    const priorityOrder = { police: 1, hospital: 2, shelter: 3, public: 4, personal: 5 };
    const priorityA = priorityOrder[a.category] || 999;
    const priorityB = priorityOrder[b.category] || 999;
    
    // Sort by category priority first
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Within same category, sort by distance if available
    if (a.distance && b.distance) {
      const distanceA = parseFloat(a.distance);
      const distanceB = parseFloat(b.distance);
      if (!isNaN(distanceA) && !isNaN(distanceB)) {
        return distanceA - distanceB;
      }
    }
    
    // Otherwise maintain original order
    return 0;
  });

  const handleAddPlace = async () => {
    if (!newPlace.name.trim() || !newPlace.address.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addPlace(newPlace);
      // Reset form
      setNewPlace({
        name: '',
        category: 'personal',
        address: '',
        phone: '',
        description: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding place:', error);
      // Error is handled by the hook and displayed in the UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    if (!currentUser) return;
    
    try {
      await deletePlace(placeId);
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  };

  const handlePlaceClick = (place: SafePlace) => {
    setSelectedPlace(place);
    setIsDetailsModalOpen(true);
  };

  const handleGetDirections = (place: SafePlace) => {
    if (place.coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
      window.open(url, '_blank');
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getCategoryIcon = (category: SafePlace['category']) => {
    const IconComponent = categoryIcons[category];
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            {/* Title Section - Mobile First */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/')}
                  className="p-1.5 sm:p-2 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Safe Places</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Discover and manage safe locations</p>
                </div>
              </div>
              
              {/* Mobile Add Button */}
              <Button 
                size="sm"
                className="sm:hidden shrink-0 ml-2"
                onClick={() => {
                  setNewPlace({
                    name: '',
                    category: currentUser ? 'personal' : 'public',
                    address: '',
                    phone: '',
                    description: ''
                  });
                  setIsAddModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Desktop Add Button */}
            <Button 
              className="hidden sm:flex"
              onClick={() => {
                setNewPlace({
                  name: '',
                  category: currentUser ? 'personal' : 'public',
                  address: '',
                  phone: '',
                  description: ''
                });
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Place
            </Button>
          </div>

          {/* Search and Filter - Mobile Optimized */}
          <div className="mt-3 sm:mt-4 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <Filter className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="police">Police Stations</SelectItem>
                <SelectItem value="hospital">Hospitals</SelectItem>
                <SelectItem value="shelter">Shelters</SelectItem>
                <SelectItem value="personal">Personal Places</SelectItem>
                <SelectItem value="public">Public Places</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4 sm:mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error}
                {error.includes('permissions') && (
                  <div className="mt-2">
                    <p className="text-xs sm:text-sm">
                      <strong>Quick Fix:</strong> Open Firebase Console → Firestore Database → Rules, 
                      then set: <code className="text-xs">allow read, write: if true;</code>
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}


          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading safe places...</span>
            </div>
          )}

          {/* Results Summary */}
          {!loading && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Found {filteredPlaces.length} safe place{filteredPlaces.length !== 1 ? 's' : ''} 
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              </p>
            </div>
          )}

          {/* Tabs for List and Map View */}
          {!loading && (
            <Tabs defaultValue="list" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md h-10 sm:h-auto">
                <TabsTrigger value="list" className="flex items-center space-x-1 sm:space-x-2 text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">List View</span>
                  <span className="sm:hidden">List</span>
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center space-x-1 sm:space-x-2 text-sm">
                  <Map className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Map View</span>
                  <span className="sm:hidden">Map</span>
                </TabsTrigger>
              </TabsList>

            {/* List View - Mobile Optimized Cards */}
            <TabsContent value="list" className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4">
                {filteredPlaces.map((place) => (
                  <Card 
                    key={place.id} 
                    className="shadow-elegant hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                    onClick={() => handlePlaceClick(place)}
                  >
                    <CardContent className="p-3 sm:p-6">
                      {/* Mobile: Stack vertically, Desktop: Side by side */}
                      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          {/* Header section - Mobile optimized */}
                          <div className="flex items-start space-x-2 sm:space-x-3 mb-3">
                            <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${categoryColors[place.category]}`}>
                              {getCategoryIcon(place.category)}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-foreground truncate">
                                {place.name}
                              </h3>
                              <div className="flex items-center space-x-1 sm:space-x-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs px-1.5 sm:px-2 py-0.5 shrink-0">
                                  {place.category.toUpperCase()}
                                </Badge>
                                {place.isVerified && (
                                  <Badge variant="default" className="text-xs bg-success px-1.5 sm:px-2 py-0.5 shrink-0">
                                    VERIFIED
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Address and Phone - Mobile Optimized */}
                          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <span className="block text-xs sm:text-sm break-words">{place.address}</span>
                                {place.distance && (
                                  <span className="text-primary font-medium text-xs block sm:inline sm:ml-2 mt-1 sm:mt-0">
                                    <span className="hidden sm:inline">• </span>{place.distance}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {place.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                <a 
                                  href={`tel:${place.phone}`}
                                  className="text-primary hover:underline text-xs sm:text-sm break-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {place.phone}
                                </a>
                              </div>
                            )}

                            {/* Enhanced Community Review Panel - Mobile Responsive */}
                            {place.category !== 'personal' && (
                              <div className="mt-4 sm:mt-6">
                                {place.totalFeedback && place.totalFeedback > 0 ? (
                                  <div className="max-w-lg mx-auto bg-gradient-to-r from-primary/5 via-accent/3 to-success/5 border border-primary/15 rounded-lg">
                                    {/* Header Section */}
                                    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-primary/10">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center">
                                          <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary" />
                                          <span className="hidden sm:inline">Community Reviews</span>
                                          <span className="sm:hidden">Reviews</span>
                                        </h4>
                                        <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                                          (place.confidenceLevel || 'low') === 'high' ? 'bg-success/20 text-success border border-success/30' :
                                          (place.confidenceLevel || 'low') === 'medium' ? 'bg-warning/20 text-warning border border-warning/30' :
                                          'bg-muted/50 text-muted-foreground border border-muted/30'
                                        }`}>
                                          {place.totalFeedback} review{place.totalFeedback !== 1 ? 's' : ''}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Main Score Display */}
                                    <div className="px-3 sm:px-4 py-3 sm:py-4">
                                      <div className="flex items-center justify-between">
                                        {/* Score Circle */}
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                          <div className="relative">
                                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                                              <span className="text-xs sm:text-base font-bold text-white">
                                                {place.helpfulnessScore || Math.round((place.helpfulCount || 0) / place.totalFeedback * 100)}
                                              </span>
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center">
                                              <span className="text-xs font-medium text-primary">%</span>
                                            </div>
                                          </div>
                                          
                                          {/* Score Breakdown */}
                                          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                              <div className="flex items-center space-x-1">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success"></div>
                                                <span className="text-xs font-medium text-success">
                                                  {place.helpfulCount || 0} Helpful
                                                </span>
                                              </div>
                                              <div className="flex items-center space-x-1">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-destructive"></div>
                                                <span className="text-xs font-medium text-destructive">
                                                  {place.notHelpfulCount || 0} Not Helpful
                                                </span>
                                              </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              <span className="hidden sm:inline">Community helpfulness score</span>
                                              <span className="sm:hidden">Community score</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Activity Indicators */}
                                        <div className="flex flex-col items-end space-y-1 shrink-0">
                                          {place.lastVerified && 
                                           Math.floor((Date.now() - place.lastVerified.getTime()) / (1000 * 60 * 60 * 24)) <= 30 && (
                                            <div className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 bg-success/10 rounded-full border border-success/20">
                                              <Check className="w-2 h-2 sm:w-3 sm:h-3 text-success" />
                                              <span className="text-xs text-success font-medium">Verified</span>
                                            </div>
                                          )}
                                          
                                          {place.recentFeedbackCount && place.recentFeedbackCount > 0 && (
                                            <div className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 bg-accent/10 rounded-full border border-accent/20">
                                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-accent rounded-full animate-pulse"></div>
                                              <span className="text-xs text-accent font-medium">
                                                <span className="hidden sm:inline">{place.recentFeedbackCount} recent</span>
                                                <span className="sm:hidden">{place.recentFeedbackCount}</span>
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Service Tags Section */}
                                    {place.serviceTags && place.serviceTags.length > 0 && (
                                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-primary/10">
                                        <div className="flex items-center mb-2">
                                          <span className="text-xs font-medium text-muted-foreground">
                                            <span className="hidden sm:inline">What makes this helpful:</span>
                                            <span className="sm:hidden">Helpful for:</span>
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                                          {place.serviceTags.slice(0, 3).map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors">
                                              {tag}
                                            </Badge>
                                          ))}
                                          {place.serviceTags.length > 3 && (
                                            <Badge variant="outline" className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted/30 text-muted-foreground border-muted/40">
                                              +{place.serviceTags.length - 3}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="max-w-xs mx-auto bg-gradient-to-r from-muted/30 to-muted/20 border border-muted/30 rounded-lg">
                                    <div className="px-4 py-4 sm:py-6 text-center flex flex-col items-center justify-center">
                                      <div className="flex items-center justify-center space-x-2 mb-3">
                                        <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                        <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                      </div>
                                      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">No Reviews Yet</h4>
                                      <p className="text-xs text-muted-foreground">
                                        <span className="hidden sm:inline">Be the first to share your experience</span>
                                        <span className="sm:hidden">Be the first to review</span>
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons - Mobile First */}
                        <div className="flex flex-row space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 sm:ml-4 mt-3 sm:mt-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 sm:flex-initial text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetDirections(place);
                            }}
                          >
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Get Directions</span>
                            <span className="sm:hidden">Directions</span>
                          </Button>
                          {place.phone && (
                            <Button 
                              size="sm"
                              className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCall(place.phone!);
                              }}
                            >
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Call Now</span>
                              <span className="sm:hidden">Call</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State - Mobile Optimized */}
              {filteredPlaces.length === 0 && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No places found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-sm mx-auto">
                    Try adjusting your search or add a new safe place.
                  </p>
                  <Button 
                    onClick={() => {
                      setNewPlace({
                        name: '',
                        category: currentUser ? 'personal' : 'public',
                        address: '',
                        phone: '',
                        description: ''
                      });
                      setIsAddModalOpen(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="sm:hidden">Add Safe Place</span>
                    <span className="hidden sm:inline">Add Your First Safe Place</span>
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Map View */}
            <TabsContent value="map" className="space-y-3 sm:space-y-4">
              {loadingOSM && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Loading nearby police stations and hospitals...
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Debug Info */}
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
                  Total: {allPlaces.length} | User: {places.length} | OSM: {osmPlaces.length} | Filtered: {filteredPlaces.length}
                  {userLocation && ` | Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                </AlertDescription>
              </Alert>

              <OpenStreetMap 
                places={filteredPlaces} 
                onPlaceClick={handlePlaceClick}
                userLocation={userLocation}
                className="h-64 sm:h-96 w-full rounded-lg border"
              />
              {filteredPlaces.length === 0 && (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-sm sm:text-base text-muted-foreground px-4">
                    No places to display on the map. Add some places to see them here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          )}
        </div>
      </main>

      {/* Add Place Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add Safe Place</DialogTitle>
            <DialogDescription className="text-sm">
              {currentUser 
                ? "Add a new safe location. Personal places are private to your account, while public places help the community."
                : "As a guest, you can add public places to help the community. Sign up to save personal places to your account."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Place Name</Label>
              <Input
                id="name"
                placeholder="e.g., My Home, Office, Friend's House"
                value={newPlace.name}
                onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
                className="mt-1 h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <Select 
                value={newPlace.category} 
                onValueChange={(value: 'personal' | 'public') => 
                  setNewPlace({...newPlace, category: value})
                }
                disabled={!currentUser}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUser && (
                    <SelectItem value="personal">Personal Place (Only you can see)</SelectItem>
                  )}
                  <SelectItem value="public">Public Place (Visible to all users)</SelectItem>
                </SelectContent>
              </Select>
              {!currentUser && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Guest users can only add public places. Sign up to add personal places.
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter full address..."
                value={newPlace.address}
                onChange={(e) => setNewPlace({...newPlace, address: e.target.value})}
                className="mt-1 min-h-[80px] resize-none"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number (Optional)</Label>
              <Input
                id="phone"
                placeholder="+91-XXXXXXXXXX"
                value={newPlace.phone}
                onChange={(e) => setNewPlace({...newPlace, phone: e.target.value})}
                className="mt-1 h-10"
                type="tel"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Why is this place safe? Any special notes..."
                value={newPlace.description}
                onChange={(e) => setNewPlace({...newPlace, description: e.target.value})}
                className="mt-1 min-h-[80px] resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)} 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPlace}
                disabled={!newPlace.name || !newPlace.address || isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  'Add Place'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Place Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl sm:w-full mx-auto max-h-[90vh] overflow-y-auto">
          {selectedPlace && (
            <>
              <DialogHeader>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className={`p-2 sm:p-3 rounded-full shrink-0 ${categoryColors[selectedPlace.category]}`}>
                    {getCategoryIcon(selectedPlace.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-lg sm:text-xl break-words">{selectedPlace.name}</DialogTitle>
                    <div className="flex items-center space-x-1 sm:space-x-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {selectedPlace.category.toUpperCase()}
                      </Badge>
                      {selectedPlace.isVerified && (
                        <Badge variant="default" className="bg-success text-xs">
                          VERIFIED
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="break-words">{selectedPlace.address}</span>
                    {selectedPlace.distance && (
                      <span className="text-primary font-medium block sm:inline sm:ml-2 mt-1 sm:mt-0">
                        <span className="hidden sm:inline">• </span>{selectedPlace.distance}
                      </span>
                    )}
                  </div>
                </div>
                
                {selectedPlace.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="break-all">{selectedPlace.phone}</span>
                  </div>
                )}
                
                {selectedPlace.description && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Description</h4>
                    <p className="text-sm text-muted-foreground break-words">{selectedPlace.description}</p>
                  </div>
                )}
                
                {/* Helpfulness System */}
                <PlaceHelpfulness
                  place={selectedPlace}
                  onSubmitFeedback={submitFeedback}
                  onGetUserFeedback={getUserFeedback}
                  className="border-t pt-4"
                />
                
                <div className="flex flex-col space-y-3 pt-3 sm:pt-4">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      className="flex-1 h-10"
                      onClick={() => handleGetDirections(selectedPlace)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Get Directions
                    </Button>
                    {selectedPlace.phone && (
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10"
                        onClick={() => handleCall(selectedPlace.phone!)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                    )}
                  </div>
                  
                  {/* Delete button for personal places owned by current user */}
                  {selectedPlace.category === 'personal' && 
                   selectedPlace.userId === currentUser?.uid && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleDeletePlace(selectedPlace.id);
                        setIsDetailsModalOpen(false);
                      }}
                      className="w-full h-9"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete This Place
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SafePlaces;