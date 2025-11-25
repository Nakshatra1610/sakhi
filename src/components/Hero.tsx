import { Button } from "@/components/ui/button";
import { Shield, Users, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const navigate = useNavigate();
  
  const scrollToAuthSection = () => {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContinueAsGuest = () => {
    navigate('/guest');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-8 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo/Title */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground mb-3 sm:mb-4 tracking-tight">
              Sakhi
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium px-2">
              Your trusted safety companion
            </p>
          </div>

          {/* Hero Description */}
          <div className="mb-8 sm:mb-12">
            <p className="text-base sm:text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto leading-relaxed px-2">
              Stay safe with our comprehensive women's safety portal. Find safe places, 
              get emergency contacts, and share your location with trusted ones.
            </p>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 px-2">
            <button 
              onClick={() => navigate('/safe-places')}
              className="flex flex-col items-center space-y-2 hover:scale-105 transition-transform cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <p className="text-xs sm:text-sm text-foreground/80 font-medium text-center leading-tight group-hover:text-foreground transition-colors">Safe Places</p>
            </button>
            <button 
              onClick={() => navigate('/emergency-sos')}
              className="flex flex-col items-center space-y-2 hover:scale-105 transition-transform cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/20 rounded-full flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <p className="text-xs sm:text-sm text-foreground/80 font-medium text-center leading-tight group-hover:text-foreground transition-colors">Emergency SOS</p>
            </button>
            <button 
              onClick={() => navigate('/contacts')}
              className="flex flex-col items-center space-y-2 hover:scale-105 transition-transform cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/20 rounded-full flex items-center justify-center group-hover:bg-success/30 transition-colors">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <p className="text-xs sm:text-sm text-foreground/80 font-medium text-center leading-tight group-hover:text-foreground transition-colors">Trusted Contacts</p>
            </button>
            <button 
              onClick={() => navigate('/safety-tips')}
              className="flex flex-col items-center space-y-2 hover:scale-105 transition-transform cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/20 rounded-full flex items-center justify-center group-hover:bg-warning/30 transition-colors">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              </div>
              <p className="text-xs sm:text-sm text-foreground/80 font-medium text-center leading-tight group-hover:text-foreground transition-colors">Safety Tips</p>
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
            <Button 
              variant="hero" 
              size="xl" 
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] h-14 sm:h-16 text-lg sm:text-xl font-bold"
              onClick={scrollToAuthSection}
            >
              Get Started
            </Button>
            <Button 
              variant="hero-outline" 
              size="xl" 
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] h-14 sm:h-16 text-lg sm:text-xl font-bold"
              onClick={handleContinueAsGuest}
            >
              Continue as Guest
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 sm:mt-16 text-center px-4">
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              Trusted by thousands of women across India
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs">Real-time Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;