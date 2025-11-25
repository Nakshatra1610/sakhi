import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signUpWithEmail, signInWithEmail, SignUpData, SignInData } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { isValidEmail, validatePassword, isValidPhoneNumber } from "@/lib/authErrors";

const AuthSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Get the default tab from navigation state, default to "signin"
  const defaultTab = location.state?.defaultTab || "signin";
  
  // Sign In Form Data
  const [signInData, setSignInData] = useState<SignInData>({
    email: "",
    password: ""
  });
  
  // Sign Up Form Data
  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: ""
  });
  
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!signInData.email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(signInData.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!signInData.password.trim()) {
      setError("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmail(signInData);
      // User will be redirected automatically through auth state change
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!signUpData.fullName.trim()) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (signUpData.fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters long.");
      setLoading(false);
      return;
    }

    if (!signUpData.email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(signUpData.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!signUpData.phoneNumber.trim()) {
      setError("Please enter your phone number.");
      setLoading(false);
      return;
    }

    if (!isValidPhoneNumber(signUpData.phoneNumber)) {
      setError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    if (!signUpData.password) {
      setError("Please enter a password.");
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(signUpData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || "Please enter a valid password.");
      setLoading(false);
      return;
    }

    // Validate password match
    if (signUpData.password !== confirmPassword) {
      setError("Passwords do not match. Please make sure both passwords are identical.");
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(signUpData);
      // User will be redirected automatically through auth state change
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigate('/guest');
  };

  // Clear error when user starts typing
  const handleInputChange = (field: string, value: string, isSignUp: boolean = false) => {
    if (error) setError("");
    
    if (isSignUp) {
      setSignUpData({ ...signUpData, [field]: value });
    } else {
      setSignInData({ ...signInData, [field]: value });
    }
  };

  // Get input error state for styling
  const getInputClassName = (hasError: boolean = false) => {
    return hasError 
      ? "pl-10 border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "pl-10";
  };

  return (
    <section id="auth-section" className="py-8 sm:py-16 px-3 sm:px-4 bg-gradient-secondary">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Join Sakhi
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Create your account or sign in to access all safety features
          </p>
        </div>

        <Card className="shadow-elegant">
          {error && (
            <div className="p-3 sm:p-6 pb-0">
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 sm:h-auto">
              <TabsTrigger value="signin" className="text-sm sm:text-base">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm sm:text-base">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-xl sm:text-2xl text-center">Welcome Back</CardTitle>
                <CardDescription className="text-center text-sm">
                  Sign in to your Sakhi account
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 h-11 text-base"
                        value={signInData.email}
                        onChange={(e) => handleInputChange('email', e.target.value, false)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11 text-base"
                        value={signInData.password}
                        onChange={(e) => handleInputChange('password', e.target.value, false)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold" variant="default" size="lg" type="submit" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" className="text-sm text-muted-foreground h-auto p-0" type="button">
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="signup">
              <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-xl sm:text-2xl text-center">Create Account</CardTitle>
                <CardDescription className="text-center text-sm">
                  Join thousands of women staying safe with Sakhi
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10 h-11 text-base"
                        value={signUpData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value, true)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 h-11 text-base"
                        value={signUpData.email}
                        onChange={(e) => handleInputChange('email', e.target.value, true)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-phone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="pl-10 h-11 text-base"
                        value={signUpData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value, true)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="pl-10 pr-10 h-11 text-base"
                        value={signUpData.password}
                        onChange={(e) => handleInputChange('password', e.target.value, true)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10 h-11 text-base"
                        value={confirmPassword}
                        onChange={(e) => {
                          if (error) setError("");
                          setConfirmPassword(e.target.value);
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold" variant="default" size="lg" type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center leading-tight">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 sm:mt-8 text-center">
          <Button 
            variant="hero-outline" 
            size="lg" 
            className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold"
            onClick={handleContinueAsGuest}
          >
            Continue as Guest
          </Button>
          <p className="text-xs text-muted-foreground mt-2 px-2">
            Limited features available without an account
          </p>
        </div>
      </div>
    </section>
  );
};

export default AuthSection;