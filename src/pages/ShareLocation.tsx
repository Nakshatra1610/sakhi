import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationShare } from '@/hooks/useLocationShare';
import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  MapPin, 
  AlertCircle,
  Loader2,
  Share2,
  StopCircle,
  CheckCircle2,
  ExternalLink,
  Clock,
  MessageSquare,
  History,
  User,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { getGoogleMapsLink } from '@/lib/location';

export default function ShareLocation() {
  const navigate = useNavigate();
  const {
    activeShares,
    history,
    currentLocation,
    loading,
    error,
    createShare,
    stopShare,
    checkInShare,
    refreshLocation,
    loadHistory
  } = useLocationShare();

  const { primaryContact, loading: contactsLoading } = useContacts();

  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const [showLocationPermissionAlert, setShowLocationPermissionAlert] = useState(false);
  const [duration, setDuration] = useState('30');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const activeShare = activeShares.length > 0 ? activeShares[0] : null;

  // Load history on mount
  useEffect(() => {
    loadHistory(30); // Load last 30 days
  }, [loadHistory]);

  // Main handler - one click to share
  const handleShareLocation = async () => {
    // Check if primary contact exists
    if (!primaryContact) {
      alert('Please add a primary contact first to share your location.');
      navigate('/contacts');
      return;
    }

    setShareError(null);
    setIsSharing(true);

    try {
      // Try to get current location
      const location = await refreshLocation();
      
      if (!location) {
        setShowLocationPermissionAlert(true);
        return;
      }

      // Show duration selection dialog
      setShowDurationDialog(true);
    } catch (err) {
      // Location permission denied or error
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg.includes('permission') || errorMsg.includes('denied') || errorMsg.includes('Location')) {
        setShowLocationPermissionAlert(true);
      } else {
        setShareError(err instanceof Error ? err.message : 'Failed to access location');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Actually create the share after duration is selected
  const handleConfirmShare = async () => {
    if (!primaryContact || !currentLocation) return;

    setIsSharing(true);
    setShareError(null);

    try {
      await createShare({
        sharedWith: [{
          id: primaryContact.id,
          name: primaryContact.name,
          phoneNumber: primaryContact.phoneNumber
        }],
        duration: parseInt(duration),
        shareType: 'timed',
        checkInRequired: true,
        currentLocation: currentLocation
      });

      setShowDurationDialog(false);
      
      // Show success message
      alert(`✅ Location sharing started!\n\nYour SMS app will open to send the location to ${primaryContact.name}.\n\nPlease send the pre-filled message to complete the notification.`);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to share location');
    } finally {
      setIsSharing(false);
    }
  };

  const handleStopSharing = async () => {
    if (!activeShare) return;

    try {
      await stopShare(activeShare.id, false);
    } catch (err) {
      console.error('Error stopping share:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!activeShare) return;

    try {
      await checkInShare(activeShare.id);
      alert('You have been marked as safe! Your contacts have been notified.');
    } catch (err) {
      console.error('Error checking in:', err);
    }
  };

  const formatTimeRemaining = (endTime?: Date): string => {
    if (!endTime) return 'Indefinite';
    const now = new Date();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    
    // If time has expired
    if (remaining === 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Update timer every minute when there's an active share
  useEffect(() => {
    if (!activeShare || !activeShare.endTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      if (activeShare.endTime && activeShare.endTime <= now) {
        // Time expired - force re-render to show updated status
        setShareError('Location sharing has expired');
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [activeShare]);

  if (loading || contactsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-2" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute left-0 top-1 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <MapPin className="h-8 w-8 text-pink-600" />
              Share Location
            </h1>
            <p className="text-gray-400 mt-2">Share your live location with your primary contact</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {shareError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{shareError}</AlertDescription>
          </Alert>
        )}

        {/* Main Action Card */}
        {!activeShare ? (
          <Card className="border-2 border-pink-600 bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Quick Share</CardTitle>
              <CardDescription className="text-gray-400">
                {primaryContact 
                  ? `Share your location with ${primaryContact.name}`
                  : 'Set up a primary contact first'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Contact Info */}
              {primaryContact && (
                <div className="bg-gray-700 rounded-lg p-4 text-center border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">Sharing with:</p>
                  <p className="text-lg font-semibold text-white">{primaryContact.name}</p>
                  <p className="text-sm text-gray-400">{primaryContact.phoneNumber}</p>
                </div>
              )}

              {/* Share Button */}
              <Button
                onClick={handleShareLocation}
                disabled={!primaryContact || isSharing}
                className="w-full h-16 text-lg bg-pink-600 hover:bg-pink-700"
                size="lg"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5 mr-2" />
                    Share My Location
                  </>
                )}
              </Button>

              {!primaryContact && (
                <Button
                  onClick={() => navigate('/contacts')}
                  variant="outline"
                  className="w-full"
                >
                  Add Primary Contact First
                </Button>
              )}

              {/* Info */}
              <div className="text-sm text-gray-400 space-y-2 bg-gray-700 border border-gray-600 p-4 rounded-lg">
                <p className="font-medium text-white mb-2">How it works:</p>
                <div className="space-y-1">
                  <p>1. Click "Share My Location"</p>
                  <p>2. Allow location access if prompted</p>
                  <p>3. Choose how long to share (15min - 4 hours)</p>
                  <p>4. Your contact receives an SMS with your live location</p>
                  <p>5. Click "I'm Safe" when you arrive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Active Share Card */
          <Card className="border-2 border-green-500 bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-green-500" />
                  Location Sharing Active
                </span>
                <Badge variant="default" className="bg-green-600">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    Live
                  </div>
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Shared with {activeShare.contactNames.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Expiration Warning */}
              {activeShare.endTime && (() => {
                const now = new Date();
                const remaining = Math.max(0, activeShare.endTime.getTime() - now.getTime());
                const minutesLeft = Math.floor(remaining / 60000);
                
                if (minutesLeft <= 5 && minutesLeft > 0) {
                  return (
                    <Alert className="bg-orange-900/50 border-orange-700">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <AlertDescription className="text-orange-300">
                        Location sharing will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}!
                      </AlertDescription>
                    </Alert>
                  );
                } else if (minutesLeft === 0) {
                  return (
                    <Alert className="bg-red-900/50 border-red-700">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-300">
                        Location sharing has expired and will stop automatically.
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}

              {/* Time Info */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Time Remaining:</span>
                  <span className="text-lg font-bold text-green-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatTimeRemaining(activeShare.endTime)}
                  </span>
                </div>
                {activeShare.endTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Will End At:</span>
                    <span className="font-medium text-white">
                      {activeShare.endTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Started:</span>
                  <span className="font-medium text-white">
                    {activeShare.startTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Last Update:</span>
                  <span className="font-medium text-white">
                    {activeShare.lastUpdated.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Location Link */}
              {activeShare.currentLocation && (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Current Location:</p>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 hover:bg-gray-700 text-white"
                    onClick={() => window.open(
                      getGoogleMapsLink(
                        activeShare.currentLocation.latitude,
                        activeShare.currentLocation.longitude
                      ),
                      '_blank'
                    )}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                </div>
              )}

              {/* Message Sent Info */}
              <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-300">Message Sent</p>
                  <p className="text-xs text-blue-400 mt-1">
                    Your contact received a text message with your live location link
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleCheckIn}
                  className="h-12 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  I'm Safe
                </Button>
                <Button
                  onClick={handleStopSharing}
                  variant="destructive"
                  className="h-12"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop Sharing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duration Selection Dialog */}
        <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">How long should we share your location?</DialogTitle>
              <DialogDescription className="text-gray-400">
                Choose a duration based on your expected travel time
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RadioGroup value={duration} onValueChange={setDuration}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="15" id="15min" />
                    <Label htmlFor="15min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">15 minutes</span>
                      <p className="text-sm text-gray-400">Quick errand or short walk</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="30" id="30min" />
                    <Label htmlFor="30min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">30 minutes</span>
                      <p className="text-sm text-gray-400">Walking home or local travel</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="60" id="60min" />
                    <Label htmlFor="60min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">1 hour</span>
                      <p className="text-sm text-gray-400">Commute or medium distance</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="120" id="120min" />
                    <Label htmlFor="120min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">2 hours</span>
                      <p className="text-sm text-gray-400">Long journey or evening out</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="240" id="240min" />
                    <Label htmlFor="240min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">4 hours</span>
                      <p className="text-sm text-gray-400">Extended travel or night out</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDurationDialog(false)}
                disabled={isSharing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmShare}
                disabled={isSharing}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Location
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Location Permission Alert Dialog */}
        <Dialog open={showLocationPermissionAlert} onOpenChange={setShowLocationPermissionAlert}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Location Access Required
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Please enable location access to share your location
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  To share your location, you need to:
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-300 mt-2 space-y-1">
                  <li>Allow location access when prompted by your browser</li>
                  <li>Make sure location services are enabled on your device</li>
                  <li>Try the "Share My Location" button again</li>
                </ol>
              </div>

              <div className="text-sm text-gray-400">
                <p className="font-medium text-white mb-2">Why we need this:</p>
                <p>
                  Your location data is used only to share with your trusted contact. 
                  We never store or share your location with anyone else.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowLocationPermissionAlert(false)}
                className="w-full"
              >
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share History Section */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <History className="h-5 w-5 text-pink-600" />
                  Share History
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Past location shares (last 30 days)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-pink-600 hover:text-pink-700 hover:bg-gray-700"
              >
                {showHistory ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>

          {showHistory && (
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No share history yet</p>
                  <p className="text-sm mt-1">Your past location shares will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left side - Contact info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-pink-600" />
                            <span className="font-medium text-white">
                              {item.contactNames.join(', ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.startTime.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.startTime.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white font-medium">
                              {item.duration < 60 
                                ? `${item.duration}m` 
                                : `${Math.floor(item.duration / 60)}h ${item.duration % 60}m`}
                            </span>
                          </div>
                        </div>

                        {/* Right side - Status badge */}
                        <div className="flex flex-col items-end gap-2">
                          {item.checkedIn ? (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Checked In
                            </Badge>
                          ) : item.completedSuccessfully ? (
                            <Badge className="bg-blue-600 hover:bg-blue-700">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-600">
                              Stopped
                            </Badge>
                          )}
                          
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {item.shareType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
