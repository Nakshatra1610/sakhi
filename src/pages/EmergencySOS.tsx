import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSOS } from '@/hooks/useSOS';
import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle,
  Loader2,
  Shield,
  Bell,
  MapPin,
  Clock,
  Phone,
  Volume2,
  VolumeX,
  History,
  Calendar,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowLeft
} from 'lucide-react';

export default function EmergencySOS() {
  const navigate = useNavigate();
  const {
    activeAlerts,
    history,
    loading,
    error,
    isShakeEnabled,
    activateSOS,
    resolveAlert,
    cancelAlert,
    loadHistory,
    enableShakeDetection,
    disableShakeDetection
  } = useSOS();

  const { contacts, primaryContact, loading: contactsLoading } = useContacts();

  const [showCountdown, setShowCountdown] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [selectedMode, setSelectedMode] = useState<'silent' | 'loud'>('loud');
  const [isActivating, setIsActivating] = useState(false);
  const [sosError, setSOSError] = useState<string | null>(null);

  const activeAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  // Load history on mount
  useEffect(() => {
    loadHistory(30);
  }, [loadHistory]);

  // Countdown timer
  useEffect(() => {
    if (!showCountdown) return;

    if (countdown <= 0) {
      setShowCountdown(false);
      handleConfirmSOS();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCountdown, countdown]);

  const handleSOSButtonPress = () => {
    if (!primaryContact && contacts.length === 0) {
      alert('Please add at least one trusted contact before using SOS');
      navigate('/contacts');
      return;
    }

    setSOSError(null);
    setShowModeDialog(true);
  };

  const handleStartCountdown = (mode: 'silent' | 'loud') => {
    setSelectedMode(mode);
    setShowModeDialog(false);
    setCountdown(5);
    setShowCountdown(true);
  };

  const handleCancelCountdown = () => {
    setShowCountdown(false);
    setCountdown(5);
  };

  const handleConfirmSOS = async () => {
    setIsActivating(true);
    setSOSError(null);

    try {
      // Check for contacts first
      const selectedContacts = primaryContact 
        ? [{
            id: primaryContact.id,
            name: primaryContact.name,
            phoneNumber: primaryContact.phoneNumber
          }]
        : contacts.slice(0, 3).map(c => ({
            id: c.id,
            name: c.name,
            phoneNumber: c.phoneNumber
          }));

      if (selectedContacts.length === 0) {
        throw new Error('No contacts available. Please add at least one trusted contact.');
      }

      console.log('Activating SOS with contacts:', selectedContacts);

      await activateSOS({
        contacts: selectedContacts,
        mode: selectedMode,
        currentLocation: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() }
      });

      alert(`🚨 SOS ACTIVATED!\n\nEmergency alerts are being sent to your contacts.\n\nYour SMS app will open to send notifications.`);
    } catch (err) {
      console.error('SOS activation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate SOS';
      setSOSError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsActivating(false);
    }
  };

  const handleResolve = async () => {
    if (!activeAlert) return;

    const confirmed = window.confirm('Mark yourself as SAFE?\n\nThis will notify your contacts that the emergency is over.');
    if (!confirmed) return;

    try {
      await resolveAlert(activeAlert.id);
      alert('✅ You have been marked as safe!\n\nYour contacts have been notified.');
    } catch (err) {
      console.error('Error resolving SOS:', err);
    }
  };

  const handleCancel = async () => {
    if (!activeAlert) return;

    const confirmed = window.confirm('Cancel this SOS alert?\n\nThis was triggered by mistake.');
    if (!confirmed) return;

    try {
      await cancelAlert(activeAlert.id);
    } catch (err) {
      console.error('Error canceling SOS:', err);
    }
  };

  const formatTimeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading || contactsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-2" />
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
              <AlertTriangle className="h-8 w-8 text-red-600" />
              Emergency SOS
            </h1>
            <p className="text-gray-400 mt-2">Instant emergency alert to your contacts</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sosError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{sosError}</AlertDescription>
          </Alert>
        )}

        {/* Main SOS Button or Active Alert */}
        {!activeAlert ? (
          <Card className="border-4 border-red-600 bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Emergency SOS</CardTitle>
              <CardDescription className="text-gray-400">
                {primaryContact 
                  ? `Will alert ${primaryContact.name} ${contacts.length > 1 ? `and ${contacts.length - 1} others` : ''}`
                  : contacts.length > 0
                  ? `Will alert ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`
                  : 'Add contacts first'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Giant SOS Button */}
              <div className="flex justify-center py-4">
                <button
                  onClick={handleSOSButtonPress}
                  disabled={contacts.length === 0 || isActivating}
                  className="relative w-64 h-64 rounded-full bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:from-gray-600 disabled:to-gray-700 shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: contacts.length > 0 
                      ? '0 0 60px rgba(239, 68, 68, 0.5), 0 0 120px rgba(239, 68, 68, 0.3)' 
                      : 'none'
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AlertTriangle className="h-24 w-24 text-white mb-4" />
                    <span className="text-4xl font-bold text-white">SOS</span>
                    <span className="text-sm text-white/80 mt-2">HOLD FOR 2 SEC</span>
                  </div>
                  {contacts.length > 0 && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-20" />
                  )}
                </button>
              </div>

              {contacts.length === 0 && (
                <Button
                  onClick={() => navigate('/contacts')}
                  variant="outline"
                  className="w-full"
                >
                  Add Trusted Contacts First
                </Button>
              )}

              {/* Shake Detection Toggle */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="shake" className="text-white font-medium cursor-pointer">
                      Shake to Activate
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">
                      Shake your phone vigorously to trigger SOS
                    </p>
                  </div>
                  <Switch
                    id="shake"
                    checked={isShakeEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        enableShakeDetection();
                      } else {
                        disableShakeDetection();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="text-sm text-gray-400 space-y-2 bg-gray-700 border border-gray-600 p-4 rounded-lg">
                <p className="font-medium text-white mb-2">What happens when SOS is activated:</p>
                <div className="space-y-1">
                  <p>• Immediately alerts all your trusted contacts</p>
                  <p>• Sends your current location via SMS</p>
                  <p>• Starts continuous location tracking</p>
                  <p>• Updates location every 30 seconds</p>
                  <p>• Includes battery level in alerts</p>
                  <p>• {selectedMode === 'loud' ? 'Plays loud alarm sound' : 'Silent mode - no sound'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Active SOS Alert Card */
          <Card className="border-4 border-red-600 bg-gray-800 animate-pulse-slow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                  SOS ACTIVE
                </span>
                <Badge variant="destructive" className="text-lg px-4 py-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
                    EMERGENCY
                  </div>
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                {activeAlert.contactNames.join(', ')} have been alerted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active Since */}
              <div className="bg-red-900/50 border-2 border-red-700 rounded-lg p-6 text-center">
                <p className="text-sm text-red-300 mb-2">ACTIVE SINCE</p>
                <div className="text-3xl font-bold text-red-500">
                  {formatTimeSince(activeAlert.triggeredAt)}
                </div>
                <p className="text-xs text-red-300 mt-2">
                  Started: {activeAlert.triggeredAt.toLocaleTimeString()}
                </p>
              </div>

              {/* Status Info */}
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Tracking:
                  </span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    {activeAlert.mode === 'loud' ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    Mode:
                  </span>
                  <span className="text-white capitalize">{activeAlert.mode}</span>
                </div>
                {activeAlert.batteryLevel && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Battery:</span>
                    <span className="text-white">{Math.round(activeAlert.batteryLevel * 100)}%</span>
                  </div>
                )}
                {activeAlert.hasMovedSignificantly && (
                  <Alert className="bg-orange-900/50 border-orange-700">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <AlertDescription className="text-orange-300 text-sm">
                      Significant movement detected ({'>'}500m)
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Contacts Notified */}
              <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Contacts Notified
                </p>
                <div className="space-y-1">
                  {activeAlert.contactNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-blue-400" />
                      <span className="text-blue-200">{name}</span>
                      <span className="text-blue-400 text-xs">({activeAlert.contactPhones[idx]})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleResolve}
                  className="w-full h-16 bg-green-600 hover:bg-green-700 text-lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  I'M SAFE - End SOS
                </Button>

                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full border-gray-600 hover:bg-gray-700 text-white"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel (False Alarm)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SOS History */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <History className="h-5 w-5 text-pink-600" />
                  SOS History
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Past emergency alerts (last 30 days)
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
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No SOS history</p>
                  <p className="text-sm mt-1">Your emergency alerts will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-700 border border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.triggeredAt.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.triggeredAt.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>

                          <div className="text-sm">
                            <span className="text-gray-400">Contacted: </span>
                            <span className="text-white">{item.contactNames.join(', ')}</span>
                          </div>

                          {item.resolvedAt && (
                            <div className="text-sm text-gray-400">
                              Duration: {Math.round((item.resolvedAt.getTime() - item.triggeredAt.getTime()) / 60000)}m
                            </div>
                          )}
                        </div>

                        <div>
                          {item.status === 'resolved' ? (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : item.status === 'cancelled' ? (
                            <Badge variant="secondary" className="bg-gray-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancelled
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Countdown Dialog */}
        <Dialog open={showCountdown} onOpenChange={setShowCountdown}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl text-center">
                SOS ACTIVATING IN
              </DialogTitle>
            </DialogHeader>

            <div className="py-8">
              <div className="text-center">
                <div className="text-8xl font-bold text-red-600 animate-pulse">
                  {countdown}
                </div>
                <p className="text-gray-400 mt-4">Cancel if this was a mistake</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleCancelCountdown}
                variant="outline"
                className="w-full h-12 text-lg"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mode Selection Dialog */}
        <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Select SOS Mode</DialogTitle>
              <DialogDescription className="text-gray-400">
                Choose how the SOS alert should behave
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <button
                onClick={() => handleStartCountdown('loud')}
                className="w-full border-2 border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <Volume2 className="h-6 w-6 text-red-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-lg">Loud Mode</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Plays loud alarm sound and vibration. Use to attract attention or scare attacker.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleStartCountdown('silent')}
                className="w-full border-2 border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <VolumeX className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-lg">Silent Mode</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      No sound or alarm. Discreet mode for dangerous situations where alerting attacker is risky.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowModeDialog(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
