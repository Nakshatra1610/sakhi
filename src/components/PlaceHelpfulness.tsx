import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Plus, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SafePlace, PlaceHelpfulness } from '@/lib/safePlaces';
import { useAuth } from '@/hooks/useAuth';

interface PlaceHelpfulnessProps {
  place: SafePlace;
  onSubmitFeedback: (placeId: string, isHelpful: boolean, serviceTags?: string[]) => Promise<void>;
  onGetUserFeedback: (placeId: string) => Promise<PlaceHelpfulness | null>;
  className?: string;
}

// Predefined service tags for quick selection
const COMMON_SERVICE_TAGS = [
  '24/7 Service',
  'Women Staff',
  'Quick Response',
  'Multilingual Support',
  'Free Consultation',
  'Emergency Care',
  'Private Room',
  'Fast Response',
  'Supportive Staff',
  'Clean Facilities',
  'Safe Location',
  'Good Security',
  'Multilingual',
  'Wheelchair Accessible',
  'Free Service'
];

const PlaceHelpfulnessComponent: React.FC<PlaceHelpfulnessProps> = ({
  place,
  onSubmitFeedback,
  onGetUserFeedback,
  className = ""
}) => {
  const { currentUser } = useAuth();
  const [userFeedback, setUserFeedback] = useState<PlaceHelpfulness | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Show helpfulness for all categories except personal places
  const canGiveFeedback = place.category !== 'personal' && currentUser;
  const totalFeedback = place.totalFeedback || 0;
  const hasFeedback = totalFeedback > 0;
  const helpfulCount = place.helpfulCount || 0;
  const helpfulPercentage = hasFeedback ? Math.round(helpfulCount / totalFeedback * 100) : 0;
  const unifiedScore = place.helpfulnessScore || 0;
  const notHelpfulCount = place.notHelpfulCount || 0;
  const confidenceLevel = place.confidenceLevel || 'low';

  useEffect(() => {
    const loadUserFeedback = async () => {
      if (canGiveFeedback) {
        try {
          const feedback = await onGetUserFeedback(place.id);
          setUserFeedback(feedback);
          if (feedback && feedback.serviceTags) {
            setSelectedTags(feedback.serviceTags);
          }
        } catch (error) {
          console.error('Error loading user feedback:', error);
        }
      }
    };
    
    loadUserFeedback();
  }, [place.id, currentUser, canGiveFeedback, onGetUserFeedback]);

  const handleFeedbackSubmit = async (isHelpful: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmitFeedback(place.id, isHelpful, selectedTags);
      setFeedbackSubmitted(true);
      
      // Force a small delay to ensure Firestore has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload user feedback to get updated data
      const updatedFeedback = await onGetUserFeedback(place.id);
      setUserFeedback(updatedFeedback);
      
      // Hide tag input after submission
      setShowTagInput(false);
      
      // Show success message briefly
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 3) // Limit to 3 tags per user
    );
  };

  const handleAddCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 3) {
      setSelectedTags(prev => [...prev, tag]);
      setCustomTag('');
    }
  };

  const getRecentlyVerified = () => {
    if (!place.lastVerified) return false;
    const daysSinceVerified = Math.floor((Date.now() - place.lastVerified.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceVerified <= 30; // Recently verified if within 30 days
  };

  if (place.category === 'personal') {
    return null; // Don't show helpfulness for personal places
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Unified Community Score - Always Visible */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h3 className="font-semibold text-lg text-foreground">Community Score</h3>
          <div className="text-sm text-muted-foreground">
            {totalFeedback} {totalFeedback === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        
        {hasFeedback ? (
          <div className="space-y-4">
            {/* Enhanced Unified Score Display */}
            <div className="space-y-4">
              {/* Main Score Card */}
              <div className="bg-card p-4 sm:p-6 rounded-xl border-2 border-primary/20 shadow-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    {unifiedScore}/100
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-foreground">Community Score</p>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      confidenceLevel === 'high' ? 'bg-success/20 text-success' :
                      confidenceLevel === 'medium' ? 'bg-warning/20 text-warning' :
                      'bg-muted/60 text-muted-foreground'
                    }`}>
                      {confidenceLevel.toUpperCase()} CONFIDENCE
                    </div>
                  </div>
                </div>
                
                {/* Detailed Breakdown - Responsive Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="p-2 sm:p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1 mb-1 sm:mb-2">
                      <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                      <span className="text-lg sm:text-xl font-bold text-success">
                        {helpfulCount}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-success font-medium">Helpful</p>
                  </div>
                  
                  <div className="p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1 mb-1 sm:mb-2">
                      <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                      <span className="text-lg sm:text-xl font-bold text-destructive">
                        {notHelpfulCount}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-destructive font-medium">Not Helpful</p>
                  </div>
                  
                  <div className="p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-primary mb-1 sm:mb-2">
                      {totalFeedback}
                    </div>
                    <p className="text-xs sm:text-sm text-primary font-medium">Total Reviews</p>
                  </div>
                </div>
                
                {/* Recent Activity Indicator */}
                {place.recentFeedbackCount && place.recentFeedbackCount > 0 && (
                  <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg text-center">
                    <p className="text-xs sm:text-sm text-accent">
                      <span className="font-semibold">{place.recentFeedbackCount}</span> recent reviews (last 30 days)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Service Tags */}
            {place.serviceTags && place.serviceTags.length > 0 && (
              <div className="bg-card p-3 rounded-lg border border-primary/10">
                <h5 className="text-xs sm:text-sm font-medium text-foreground mb-2">What makes this place helpful:</h5>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {place.serviceTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 px-2 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-4 sm:p-6 bg-card rounded-lg border-2 border-dashed border-muted">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <ThumbsUp className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              <ThumbsDown className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-muted-foreground mb-2 text-sm sm:text-base">No Community Feedback Yet</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">Be the first to help others by sharing your experience!</p>
          </div>
        )}
      </div>

      {/* Recently Verified Badge */}
      {getRecentlyVerified() && (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-success border-success">
            <Check className="w-3 h-3 mr-1" />
            Recently Verified
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {Math.floor((Date.now() - place.lastVerified!.getTime()) / (1000 * 60 * 60 * 24))} days ago
          </span>
        </div>
      )}

      {/* User Feedback Section - More Prominent */}
      {canGiveFeedback && (
        <div className="space-y-4">
          {userFeedback ? (
            <div className="border-2 border-primary/30 rounded-xl p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-accent/10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="font-semibold text-base sm:text-lg text-primary">Your Contribution</h3>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {userFeedback.isHelpful ? (
                    <>
                      <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                      <span className="text-base sm:text-lg font-semibold text-success">Helpful</span>
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                      <span className="text-base sm:text-lg font-semibold text-destructive">Not Helpful</span>
                    </>
                  )}
                </div>
              </div>
              
              {userFeedback.serviceTags && userFeedback.serviceTags.length > 0 && (
                <div className="mb-4 p-3 bg-card rounded-lg">
                  <h5 className="text-sm font-medium text-primary mb-2">Your Tags:</h5>
                  <div className="flex flex-wrap gap-2">
                    {userFeedback.serviceTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-sm border-primary/30 text-primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-primary">
                  Thank you for helping the community! 
                  <span className="block text-xs text-primary/70 mt-1">
                    Submitted on {new Date(userFeedback.createdAt).toLocaleDateString()}
                  </span>
                </p>
                
                <Button
                  variant="outline"
                  onClick={() => setShowTagInput(true)}
                  className="border-primary/30 text-primary hover:bg-primary/5"
                >
                  Update Feedback
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-accent/30 rounded-xl p-4 sm:p-6 bg-gradient-to-r from-accent/5 to-primary/5 shadow-sm">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg sm:text-xl text-accent mb-2">Help Your Community!</h3>
                <p className="text-accent/80 text-xs sm:text-sm">
                  Share your experience to help other women stay safe
                </p>
              </div>
              
              {!showTagInput ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      onClick={() => handleFeedbackSubmit(true)}
                      disabled={isSubmitting}
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground h-10 sm:h-12 text-base sm:text-lg font-medium"
                    >
                      <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Yes, Helpful
                    </Button>
                    <Button
                      onClick={() => handleFeedbackSubmit(false)}
                      disabled={isSubmitting}
                      variant="outline"
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 h-10 sm:h-12 text-base sm:text-lg font-medium"
                    >
                      <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Not Helpful
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Button
                      onClick={() => setShowTagInput(true)}
                      variant="outline"
                      className="w-full sm:w-auto border-accent/30 text-accent hover:bg-accent/5"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service Details (Optional)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Service Tags Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block text-foreground">
                      What services or features make this place helpful? (Select up to 3)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
                      {COMMON_SERVICE_TAGS.map((tag) => (
                        <Button
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTagToggle(tag)}
                          disabled={!selectedTags.includes(tag) && selectedTags.length >= 3}
                          className={`text-xs p-2 h-auto ${
                            selectedTags.includes(tag)
                              ? 'bg-primary text-primary-foreground'
                              : 'border-primary/30 text-primary hover:bg-primary/5'
                          }`}
                        >
                          {selectedTags.includes(tag) && <Check className="w-3 h-3 mr-1" />}
                          {tag}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Custom Tag Input */}
                    <div className="flex space-x-2">
                      <Input
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder="Add custom service tag..."
                        disabled={selectedTags.length >= 3}
                        className="flex-1"
                        maxLength={30}
                      />
                      <Button
                        onClick={handleAddCustomTag}
                        disabled={!customTag.trim() || selectedTags.length >= 3}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {selectedTags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Selected tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-primary/10 text-primary pr-1">
                              {tag}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTagToggle(tag)}
                                className="ml-1 p-0 w-4 h-4 text-primary hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Feedback Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleFeedbackSubmit(true)}
                      disabled={isSubmitting}
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Helpful'}
                    </Button>
                    <Button
                      onClick={() => handleFeedbackSubmit(false)}
                      disabled={isSubmitting}
                      variant="outline"
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Not Helpful
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTagInput(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Success Message */}
          {feedbackSubmitted && (
            <div className="border-2 border-success/30 bg-gradient-to-r from-success/10 to-success/20 p-4 rounded-xl shadow-sm animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/20 rounded-full">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-success text-lg">Feedback Submitted!</h4>
                  <p className="text-success/80 text-sm">
                    Your contribution helps keep our community safe. The community score has been updated in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Message for non-authenticated users */}
      {!currentUser && (
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ThumbsUp className="w-5 h-5 text-muted-foreground" />
            <ThumbsDown className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Sign in to share if this place was helpful and add service tags
          </p>
          {hasFeedback && (
            <p className="text-xs text-muted-foreground">
              {helpfulPercentage}% of {place.totalFeedback} users found this place helpful
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceHelpfulnessComponent;