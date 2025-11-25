import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, MapPin, Phone, LogOut, User } from "lucide-react";
import { signOutUser } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground truncate max-w-32">
                  {currentUser?.displayName || currentUser?.email}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Welcome to Your Safety Dashboard
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              Your personal safety companion is ready to help you stay secure.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="shadow-elegant hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-2 sm:pb-3 flex-grow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">Safe Places</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Find and save safe locations near you
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 mt-auto">
                <Button 
                  className="w-full h-9 sm:h-10 text-sm" 
                  variant="outline"
                  onClick={() => navigate('/safe-places')}
                >
                  Explore Places
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-2 sm:pb-3 flex-grow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-full flex items-center justify-center mb-2">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <CardTitle className="text-base sm:text-lg">Emergency SOS</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Quick access to emergency contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 mt-auto">
                <Button className="w-full h-9 sm:h-10 text-sm" variant="outline">
                  Setup SOS
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-2 sm:pb-3 flex-grow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/20 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                </div>
                <CardTitle className="text-base sm:text-lg">Trusted Contacts</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manage your emergency contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 mt-auto">
                <Button 
                  className="w-full h-9 sm:h-10 text-sm" 
                  variant="outline"
                  onClick={() => navigate('/contacts')}
                >
                  Add Contacts
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-2 sm:pb-3 flex-grow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/20 rounded-full flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                </div>
                <CardTitle className="text-base sm:text-lg">Safety Tips</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Learn essential safety practices
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 mt-auto">
                <Button 
                  className="w-full h-9 sm:h-10 text-sm" 
                  variant="outline"
                  onClick={() => navigate('/safety-tips')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-elegant">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              <CardDescription className="text-sm">
                Essential features at your fingertips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  className="h-12 sm:h-16 text-sm sm:text-base bg-red-600 hover:bg-red-700"
                  onClick={() => navigate('/emergency-sos')}
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Emergency SOS
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 sm:h-16 text-sm sm:text-base"
                  onClick={() => navigate('/share-location')}
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Share Location
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 sm:h-16 text-sm sm:text-base"
                  onClick={() => navigate('/safety-check')}
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Safety Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
