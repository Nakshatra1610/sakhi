import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, MapPin, Phone, UserPlus, Lock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const GuestDashboard = () => {
  const navigate = useNavigate();
  const [showEmergencyInfo, setShowEmergencyInfo] = useState(false);

  const handleSignUp = () => {
    navigate("/auth", { state: { defaultTab: "signup" } });
  };

  const handleEmergencyCall = () => {
    window.location.href = 'tel:100';
  };

  const emergencyNumbers = [
    { name: "Police", number: "100", color: "text-blue-600" },
    { name: "Ambulance", number: "102", color: "text-red-600" },
    { name: "Women Helpline", number: "1091", color: "text-purple-600" },
    { name: "National Emergency", number: "112", color: "text-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sakhi</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Guest Mode</span>
              </div>
              <Button variant="default" size="sm" onClick={handleSignUp} className="shrink-0">
                <UserPlus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Up</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-4">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>Guest Mode:</strong> You can access basic safety features. Sign up for emergency contacts, location sharing, and personalized safety tools.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Welcome to Sakhi Safety Portal
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground px-2">
                Your safety companion with quick access to emergency services.
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Safe Places</CardTitle>
                <CardDescription className="min-h-[40px]">
                  Discover police stations & hospitals near you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/safe-places')}
                >
                  Explore Now
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-2">
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Emergency Numbers</CardTitle>
                <CardDescription className="min-h-[40px]">
                  Quick access to emergency helplines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowEmergencyInfo(!showEmergencyInfo)}
                >
                  View Numbers
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow relative">
              <Badge className="absolute top-3 right-3 bg-orange-500">Premium</Badge>
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-lg">Trusted Contacts</CardTitle>
                <CardDescription className="min-h-[40px]">
                  Add emergency contacts who care about you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" disabled>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign Up Required
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-warning" />
                </div>
                <CardTitle className="text-lg">Safety Tips</CardTitle>
                <CardDescription className="min-h-[40px]">
                  Learn essential safety practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate('/safety-tips')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Numbers Section */}
          {showEmergencyInfo && (
            <Card className="shadow-elegant mb-6 border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                    Emergency Helpline Numbers (India)
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowEmergencyInfo(false)}
                  >
                    Close
                  </Button>
                </div>
                <CardDescription>
                  Tap any number to call instantly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {emergencyNumbers.map((emergency) => (
                    <Button
                      key={emergency.number}
                      variant="outline"
                      size="lg"
                      className="h-16 justify-between hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => window.location.href = `tel:${emergency.number}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm text-muted-foreground">{emergency.name}</span>
                        <span className={`text-xl font-bold ${emergency.color}`}>{emergency.number}</span>
                      </div>
                      <Phone className="w-5 h-5" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions for Guests */}
          <Card className="shadow-elegant mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Available Now (No Account Needed)
              </CardTitle>
              <CardDescription>
                Essential safety features accessible to everyone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  size="lg" 
                  className="h-16 bg-red-600 hover:bg-red-700"
                  onClick={handleEmergencyCall}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency Call (100)
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-16"
                  onClick={() => navigate('/safe-places')}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Find Safe Places
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-16"
                  onClick={() => navigate('/safety-tips')}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Safety Tips
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Call-to-Action Card */}
          <Card className="shadow-elegant bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl sm:text-2xl">🔓 Unlock Full Safety Features</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Create your free account to access advanced safety tools and emergency features
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="flex flex-col items-center space-y-1 p-3 bg-background/50 rounded-lg">
                  <Users className="w-6 h-6 text-success mb-1" />
                  <span className="text-sm font-semibold">Emergency Contacts</span>
                  <span className="text-xs text-muted-foreground">Auto-notify loved ones</span>
                </div>
                <div className="flex flex-col items-center space-y-1 p-3 bg-background/50 rounded-lg">
                  <MapPin className="w-6 h-6 text-primary mb-1" />
                  <span className="text-sm font-semibold">Live Location Sharing</span>
                  <span className="text-xs text-muted-foreground">Real-time tracking</span>
                </div>
                <div className="flex flex-col items-center space-y-1 p-3 bg-background/50 rounded-lg">
                  <Shield className="w-6 h-6 text-warning mb-1" />
                  <span className="text-sm font-semibold">Safety Profile</span>
                  <span className="text-xs text-muted-foreground">Personalized alerts</span>
                </div>
              </div>
              <Button size="lg" onClick={handleSignUp} className="min-w-[200px] h-12">
                <UserPlus className="w-5 h-5 mr-2" />
                Create Free Account
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                ✓ Free forever · ✓ No credit card · ✓ Setup in 2 minutes
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GuestDashboard;