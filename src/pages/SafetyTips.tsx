import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Shield,
  Phone,
  AlertTriangle,
  Home,
  Briefcase,
  Car,
  Users,
  MapPin,
  Clock,
  MessageSquare,
  Lock,
  Eye,
  Heart,
  BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SafetyTip {
  icon: React.ElementType;
  title: string;
  tips: string[];
  color: string;
}

const SafetyTips = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("general");

  const emergencyNumbers = [
    { name: "Women Helpline", number: "1091", available: "24x7" },
    { name: "National Emergency", number: "112", available: "24x7" },
    { name: "Police", number: "100", available: "24x7" },
    { name: "Ambulance", number: "102", available: "24x7" },
    { name: "Domestic Abuse Helpline", number: "181", available: "24x7" }
  ];

  const safetyCategories: Record<string, SafetyTip[]> = {
    general: [
      {
        icon: Shield,
        title: "Personal Safety Basics",
        color: "text-primary",
        tips: [
          "Always trust your instincts - if something feels wrong, it probably is",
          "Keep your phone charged and easily accessible at all times",
          "Share your location with trusted family members or friends",
          "Avoid wearing expensive jewelry or displaying valuables in public",
          "Walk confidently and be aware of your surroundings",
          "Keep emergency numbers saved and easily accessible on your phone",
          "Inform someone about your whereabouts and expected return time"
        ]
      },
      {
        icon: Phone,
        title: "Digital Safety",
        color: "text-accent",
        tips: [
          "Never share personal information with strangers online",
          "Use strong, unique passwords for all accounts",
          "Enable two-factor authentication on all important accounts",
          "Be cautious about sharing your location on social media",
          "Block and report any harassment or suspicious behavior online",
          "Regularly review privacy settings on social media platforms",
          "Don't accept friend requests from unknown people"
        ]
      }
    ],
    travel: [
      {
        icon: Car,
        title: "Public Transport Safety",
        color: "text-warning",
        tips: [
          "Sit near the driver or conductor in buses",
          "Book verified cabs through trusted apps only",
          "Share your trip details and live location with family/friends",
          "Avoid empty compartments in trains and metros",
          "Keep your belongings close and secure",
          "Note down vehicle registration numbers before boarding",
          "If uncomfortable, exit at a busy public place"
        ]
      },
      {
        icon: MapPin,
        title: "Walking & Street Safety",
        color: "text-destructive",
        tips: [
          "Stick to well-lit, populated areas, especially after dark",
          "Avoid shortcuts through isolated areas",
          "Walk facing traffic so vehicles cannot approach from behind",
          "Keep one earbud out to stay aware of your surroundings",
          "Carry a whistle or personal alarm device",
          "If followed, walk into a busy shop or public place",
          "Cross the street if you feel uncomfortable about someone ahead"
        ]
      },
      {
        icon: Clock,
        title: "Night Safety",
        color: "text-purple-500",
        tips: [
          "Avoid traveling alone late at night when possible",
          "Use well-known, busy routes even if they take longer",
          "Book rides instead of walking late at night",
          "Keep your keys ready before reaching your door",
          "Call a trusted person and stay on the phone while traveling",
          "If driving, keep doors locked and windows up",
          "Park in well-lit areas close to building entrances"
        ]
      }
    ],
    workplace: [
      {
        icon: Briefcase,
        title: "Workplace Safety",
        color: "text-success",
        tips: [
          "Know your company's harassment policies and reporting procedures",
          "Document any incidents of harassment or discrimination",
          "Avoid working late alone in the office",
          "Report any uncomfortable situations to HR immediately",
          "Keep your workspace secure and don't share access codes",
          "Be professional but firm in setting boundaries",
          "Join or create a women's support network at work"
        ]
      },
      {
        icon: Users,
        title: "Professional Interactions",
        color: "text-blue-500",
        tips: [
          "Schedule meetings in public or common areas when possible",
          "Inform colleagues about your meeting locations and times",
          "Maintain professional boundaries with colleagues",
          "Trust your instincts if someone makes you uncomfortable",
          "Keep written records of important conversations",
          "Don't feel pressured to share personal contact information",
          "Report any quid pro quo or hostile work environment situations"
        ]
      }
    ],
    home: [
      {
        icon: Home,
        title: "Home Security",
        color: "text-orange-500",
        tips: [
          "Install good quality locks and consider a peephole",
          "Don't open the door to strangers without verifying identity",
          "Keep emergency numbers near your phone",
          "Inform neighbors about your safety concerns",
          "Install security cameras or video doorbells if possible",
          "Have a safe room or escape plan in case of emergencies",
          "Keep curtains closed at night for privacy"
        ]
      },
      {
        icon: Lock,
        title: "Domestic Safety",
        color: "text-pink-500",
        tips: [
          "You have the right to feel safe in your own home",
          "Domestic violence is a crime - don't hesitate to report it",
          "Keep copies of important documents in a secure location",
          "Have a trusted person you can call in emergencies",
          "Know the location of nearest police station and women's shelter",
          "Document any incidents with photos, dates, and details",
          "Remember: abuse is never your fault"
        ]
      }
    ],
    emergency: [
      {
        icon: AlertTriangle,
        title: "If You're Being Followed",
        color: "text-destructive",
        tips: [
          "Don't go home - head to a busy, public place",
          "Call someone and speak loudly so the follower knows you're connected",
          "Cross the street multiple times to confirm you're being followed",
          "Enter a shop, restaurant, or police station",
          "Call police immediately (dial 100 or 112)",
          "Make noise and draw attention if in immediate danger",
          "Note the person's appearance and any vehicle details"
        ]
      },
      {
        icon: Eye,
        title: "Dealing with Harassment",
        color: "text-yellow-500",
        tips: [
          "Make it clear the behavior is unwelcome - say 'NO' firmly",
          "Document everything: dates, times, witnesses, evidence",
          "Report to authorities - police, college, workplace HR",
          "Don't engage with or respond to harassing messages",
          "Block the person on all platforms",
          "Seek support from family, friends, or counselors",
          "Remember: harassment is illegal and punishable by law"
        ]
      },
      {
        icon: MessageSquare,
        title: "Legal Rights & Resources",
        color: "text-cyan-500",
        tips: [
          "Know your rights under Indian law (IPC sections 354, 509, etc.)",
          "You can file FIR at any police station, regardless of jurisdiction",
          "Police stations must have women officers for women complainants",
          "Free legal aid is available through various NGOs and government schemes",
          "You can file complaints online through cyber crime portals",
          "Preservation of evidence is crucial - don't delete messages/photos",
          "Seek help from women's organizations and support groups"
        ]
      }
    ],
    mental: [
      {
        icon: Heart,
        title: "Mental Health & Self-Care",
        color: "text-rose-500",
        tips: [
          "Your mental health is as important as physical safety",
          "Talk to trusted friends, family, or professional counselors",
          "Don't blame yourself for others' harmful actions",
          "Practice self-care and stress-relief activities",
          "Join support groups to share experiences and get help",
          "Seek professional help if experiencing trauma or anxiety",
          "Remember: asking for help is a sign of strength, not weakness"
        ]
      },
      {
        icon: BookOpen,
        title: "Know Your Rights",
        color: "text-indigo-500",
        tips: [
          "Sexual harassment at workplace is punishable under POSH Act, 2013",
          "Stalking is a criminal offense under IPC Section 354D",
          "Voyeurism and sharing intimate images without consent is illegal",
          "Right to free legal aid is available to all women",
          "Zero FIR can be filed at any police station for cognizable offenses",
          "Women can file complaints even without their husband's permission",
          "Know about women-centric laws: Domestic Violence Act, Dowry Prohibition Act"
        ]
      }
    ]
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ElementType> = {
      general: Shield,
      travel: Car,
      workplace: Briefcase,
      home: Home,
      emergency: AlertTriangle,
      mental: Heart
    };
    return icons[category] || Shield;
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Safety Tips</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Essential safety information for women</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Emergency Numbers - Always Visible */}
        <Alert className="mb-4 sm:mb-6 bg-destructive/10 border-destructive/50">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm">
            <div className="font-semibold mb-2 text-destructive">Emergency Helpline Numbers</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {emergencyNumbers.map((item, idx) => (
                <a
                  key={idx}
                  href={`tel:${item.number}`}
                  className="flex flex-col p-2 bg-background/50 rounded-md hover:bg-background transition-colors"
                >
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="font-bold text-destructive text-sm sm:text-base">{item.number}</span>
                  <span className="text-xs text-success">{item.available}</span>
                </a>
              ))}
            </div>
          </AlertDescription>
        </Alert>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-1 h-auto bg-muted/50 p-1">
            <TabsTrigger value="general" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
              <Shield className="w-4 h-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="travel" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
              <Car className="w-4 h-4" />
              <span>Travel</span>
            </TabsTrigger>
            <TabsTrigger value="workplace" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
              <Briefcase className="w-4 h-4" />
              <span>Work</span>
            </TabsTrigger>
            <TabsTrigger value="home" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency</span>
            </TabsTrigger>
            <TabsTrigger value="mental" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm py-2">
              <Heart className="w-4 h-4" />
              <span>Mental Health</span>
            </TabsTrigger>
          </TabsList>

          {Object.entries(safetyCategories).map(([category, sections]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {sections.map((section, idx) => {
                const IconComponent = section.icon;
                return (
                  <Card key={idx} className="shadow-elegant hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${section.color}/20 rounded-full flex items-center justify-center shrink-0`}>
                          <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${section.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            {section.tips.length} essential tips
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2.5">
                        {section.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="flex gap-2.5 text-sm">
                            <span className={`${section.color} font-bold shrink-0 mt-0.5`}>•</span>
                            <span className="text-muted-foreground leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>

        {/* Important Note */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Remember:</p>
                <p>Safety is not about living in fear, but about being prepared and aware. These tips are meant to empower you to make informed decisions.</p>
                <p className="italic">If you or someone you know is in immediate danger, call emergency services immediately.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SafetyTips;
