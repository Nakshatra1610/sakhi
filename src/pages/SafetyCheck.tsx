import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafetyCheck } from '@/hooks/useSafetyCheck';
import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  MessageSquare,
  History,
  User,
  Calendar,
  Timer,
  Bell,
  AlertTriangle,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { getCurrentLocation } from '@/lib/location';

export default function SafetyCheck() {
  const navigate = useNavigate();
  const {
    activeChecks,
    history,
    loading,
    error,
    createCheck,
    performCheckIn,
    extendCheckDeadline,
    cancelCheck,
    sendAlert,
    loadHistory
  } = useSafetyCheck();

  const { primaryContact, loading: contactsLoading } = useContacts();

  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [duration, setDuration] = useState('60');
  const [extensionTime, setExtensionTime] = useState('30');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);

  const activeCheck = activeChecks.length > 0 ? activeChecks[0] : null;

  // Load history on mount
  useEffect(() => {
    loadHistory(30);
  }, [loadHistory]);

  // Update timer display every second when there's an active check
  useEffect(() => {
    if (!activeCheck) return;

    const timer = setInterval(() => {
      const now = new Date();
      if (activeCheck.checkInDeadline && activeCheck.checkInDeadline <= now) {
        setCheckError('Safety check deadline has passed!');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCheck]);

  const handleStartCheck = () => {
    if (!primaryContact) {
      alert('Please add a primary contact first to use safety check.');
      navigate('/contacts');
      return;
    }

    setCheckError(null);
    setShowDurationDialog(true);
  };

  const handleConfirmCreate = async () => {
    if (!primaryContact) return;

    setIsCreating(true);
    setCheckError(null);

    try {
      // Try to get current location
      let location;
      try {
        location = await getCurrentLocation();
      } catch (err) {
        console.log('Could not get location:', err);
      }

      await createCheck({
        contacts: [{
          id: primaryContact.id,
          name: primaryContact.name,
          phoneNumber: primaryContact.phoneNumber
        }],
        duration: parseInt(duration),
        notes: notes || undefined,
        currentLocation: location || undefined
      });

      setShowDurationDialog(false);
      setNotes('');
      
      alert(`✅ Safety Check Started!\n\nYour SMS app will open to notify ${primaryContact.name}.\n\nRemember to check in within ${duration} minutes!`);
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Failed to start safety check');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckIn = async () => {
    if (!activeCheck) return;

    try {
      await performCheckIn(activeCheck.id);
      alert('✅ You have checked in successfully!\n\nYour contacts have been notified that you are safe.');
    } catch (err) {
      console.error('Error checking in:', err);
    }
  };

  const handleExtend = () => {
    if (!activeCheck) return;
    setSelectedCheckId(activeCheck.id);
    setShowExtendDialog(true);
  };

  const handleConfirmExtend = async () => {
    if (!selectedCheckId) return;

    try {
      await extendCheckDeadline(selectedCheckId, parseInt(extensionTime));
      setShowExtendDialog(false);
      setSelectedCheckId(null);
      alert(`⏰ Deadline extended by ${extensionTime} minutes!`);
    } catch (err) {
      console.error('Error extending deadline:', err);
    }
  };

  const handleSendAlert = async () => {
    if (!activeCheck) return;

    const confirmed = window.confirm(
      '🚨 SEND EMERGENCY ALERT?\n\nThis will immediately notify your contacts that you need help.\n\nAre you sure?'
    );

    if (!confirmed) return;

    try {
      await sendAlert(activeCheck.id);
      alert('🚨 Emergency alert sent to your contacts!');
    } catch (err) {
      console.error('Error sending alert:', err);
    }
  };

  const handleCancel = async () => {
    if (!activeCheck) return;

    const confirmed = window.confirm('Cancel this safety check?');
    if (!confirmed) return;

    try {
      await cancelCheck(activeCheck.id);
    } catch (err) {
      console.error('Error canceling check:', err);
    }
  };

  const formatTimeRemaining = (deadline: Date): string => {
    const now = new Date();
    const remaining = Math.max(0, deadline.getTime() - now.getTime());
    
    if (remaining === 0) return 'Overdue!';
    
    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

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
              <Shield className="h-8 w-8 text-pink-600" />
              Safety Check
            </h1>
            <p className="text-gray-400 mt-2">Set a check-in timer for your safety</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {checkError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{checkError}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {!activeCheck ? (
          <Card className="border-2 border-pink-600 bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Start Safety Check</CardTitle>
              <CardDescription className="text-gray-400">
                {primaryContact 
                  ? `${primaryContact.name} will be notified if you don't check in`
                  : 'Set up a primary contact first'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {primaryContact && (
                <div className="bg-gray-700 rounded-lg p-4 text-center border border-gray-600">
                  <p className="text-sm text-gray-400 mb-1">Will notify:</p>
                  <p className="text-lg font-semibold text-white">{primaryContact.name}</p>
                  <p className="text-sm text-gray-400">{primaryContact.phoneNumber}</p>
                </div>
              )}

              <Button
                onClick={handleStartCheck}
                disabled={!primaryContact || isCreating}
                className="w-full h-16 text-lg bg-pink-600 hover:bg-pink-700"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Timer className="h-5 w-5 mr-2" />
                    Start Safety Check
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

              <div className="text-sm text-gray-400 space-y-2 bg-gray-700 border border-gray-600 p-4 rounded-lg">
                <p className="font-medium text-white mb-2">How it works:</p>
                <div className="space-y-1">
                  <p>1. Set how long until you need to check in</p>
                  <p>2. Your contact receives a notification</p>
                  <p>3. Timer counts down - you'll get reminders</p>
                  <p>4. Click "I'm Safe" before time runs out</p>
                  <p>5. If you don't check in, contacts are alerted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Active Check Card */
          <Card className="border-2 border-orange-500 bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5 text-orange-500 animate-pulse" />
                  Safety Check Active
                </span>
                <Badge variant="default" className="bg-orange-600">
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    Active
                  </div>
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Check in with {activeCheck.contactNames.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deadline Warning */}
              {(() => {
                const now = new Date();
                const remaining = Math.max(0, activeCheck.checkInDeadline.getTime() - now.getTime());
                const minutesLeft = Math.floor(remaining / 60000);
                
                if (minutesLeft <= 5 && minutesLeft > 0) {
                  return (
                    <Alert className="bg-orange-900/50 border-orange-700">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <AlertDescription className="text-orange-300">
                        Only {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} left to check in!
                      </AlertDescription>
                    </Alert>
                  );
                } else if (minutesLeft === 0 || remaining === 0) {
                  return (
                    <Alert className="bg-red-900/50 border-red-700">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-300">
                        Check-in deadline has passed! Your contacts will be alerted.
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}

              {/* Countdown Timer */}
              <div className="bg-gray-700 border-2 border-orange-500 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400 mb-2">Time Remaining</p>
                <div className="text-4xl font-bold text-orange-500 font-mono">
                  {formatTimeRemaining(activeCheck.checkInDeadline)}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Check in by {activeCheck.checkInDeadline.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Notes */}
              {activeCheck.notes && (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Note:</p>
                  <p className="text-white">{activeCheck.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleCheckIn}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  I'm Safe - Check In
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleExtend}
                    variant="outline"
                    className="h-12 border-gray-600 hover:bg-gray-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Need More Time
                  </Button>
                  <Button
                    onClick={handleSendAlert}
                    variant="destructive"
                    className="h-12"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Send Alert
                  </Button>
                </div>

                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  Cancel Check
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Section */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <History className="h-5 w-5 text-pink-600" />
                  Check-In History
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Past safety checks (last 30 days)
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
                  <p>No check-in history yet</p>
                  <p className="text-sm mt-1">Your past safety checks will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
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

                        <div>
                          {item.status === 'completed' ? (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Checked In
                            </Badge>
                          ) : item.status === 'alerted' ? (
                            <Badge className="bg-red-600 hover:bg-red-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Alerted
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-600">
                              Missed
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

        {/* Duration Selection Dialog */}
        <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">How long until you check in?</DialogTitle>
              <DialogDescription className="text-gray-400">
                Choose when you expect to check in as safe
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <RadioGroup value={duration} onValueChange={setDuration}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="30" id="30min" />
                    <Label htmlFor="30min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">30 minutes</span>
                      <p className="text-sm text-gray-400">Quick errand or walk</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="60" id="60min" />
                    <Label htmlFor="60min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">1 hour</span>
                      <p className="text-sm text-gray-400">Commute or meeting</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="120" id="120min" />
                    <Label htmlFor="120min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">2 hours</span>
                      <p className="text-sm text-gray-400">Longer activity or travel</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="180" id="180min" />
                    <Label htmlFor="180min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">3 hours</span>
                      <p className="text-sm text-gray-400">Evening out</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="240" id="240min" />
                    <Label htmlFor="240min" className="flex-1 cursor-pointer">
                      <span className="font-medium text-white">4 hours</span>
                      <p className="text-sm text-gray-400">Extended event</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-white">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Where are you going? (e.g., 'Walking home from work')"
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDurationDialog(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCreate}
                disabled={isCreating}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4 mr-2" />
                    Start Safety Check
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Deadline Dialog */}
        <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Extend Check-In Time</DialogTitle>
              <DialogDescription className="text-gray-400">
                How much more time do you need?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RadioGroup value={extensionTime} onValueChange={setExtensionTime}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="15" id="ext15" />
                    <Label htmlFor="ext15" className="flex-1 cursor-pointer text-white">
                      15 minutes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="30" id="ext30" />
                    <Label htmlFor="ext30" className="flex-1 cursor-pointer text-white">
                      30 minutes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-gray-600 rounded-lg p-3 hover:bg-gray-700 cursor-pointer">
                    <RadioGroupItem value="60" id="ext60" />
                    <Label htmlFor="ext60" className="flex-1 cursor-pointer text-white">
                      1 hour
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowExtendDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmExtend}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Extend Time
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
