import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RegisterFlow } from "./register-flow";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Settings, ShoppingCart, Package, LogOut } from "lucide-react";

type User = {
  email: string;
};

type LoginButtonProps = {
  onLogout?: () => void;
}

export function LoginButton({ onLogout }: LoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
  });
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetFormData, setResetFormData] = useState({ email: "", token: "", newPassword: "", confirmPassword: "" });
  const [resetVerificationSent, setResetVerificationSent] = useState(false);
  const [showNewRegistration, setShowNewRegistration] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<{ user: User | null }>({
    queryKey: ["/api/auth/check"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleResetFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetFormData({
      ...resetFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
      setIsOpen(false);
      setFormData({ email: "", password: "", confirmPassword: "", mobileNumber: "" });
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  // Handle new account registration via OTP
  const handleStartRegistration = () => {
    setShowNewRegistration(true);
  };
  
  // Handle completion of new registration flow
  const handleRegistrationComplete = () => {
    setShowNewRegistration(false);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
      window.location.href = "/";
      toast({
        title: "Goodbye!",
        description: "You have been successfully logged out.",
      });
      if (onLogout) onLogout();
    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!resetVerificationSent) {
        // Request verification code
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetFormData.email }),
        });

        if (!response.ok) {
          throw new Error("Failed to send verification code");
        }

        setResetVerificationSent(true);
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code.",
        });
      } else {
        // Reset password
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resetFormData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to reset password");
        }

        setForgotPasswordOpen(false);
        setResetVerificationSent(false);
        setResetFormData({
          email: "",
          token: "",
          newPassword: "",
          confirmPassword: "",
        });

        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (user?.user) {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-primary/10 px-3 py-1 rounded-full text-primary font-medium flex items-center gap-2 cursor-pointer hover:bg-primary/20 transition-colors"
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-white">
                  {user.user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">{user.user.email}</span>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/orders">
              <DropdownMenuItem className="cursor-pointer">
                <Package className="mr-2 h-4 w-4" />
                <span>Orders</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/cart">
              <DropdownMenuItem className="cursor-pointer">
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>Cart</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <>
      <Button
        className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300"
        onClick={() => setIsOpen(true)}
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-violet-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
        <span className="relative">Sign In</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="w-[350px] shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Welcome to Vinayak Garments</CardTitle>
                  <CardDescription>Sign in to your account or create a new one</CardDescription>
                </CardHeader>
                <Tabs defaultValue="login" className="px-6">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Create Account</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <form onSubmit={handleLogin}>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="hello@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Button
                              type="button"
                              variant="link"
                              className="px-0 font-normal text-xs"
                              onClick={() => setForgotPasswordOpen(true)}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 transition-all duration-300"
                        >
                          Sign In
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="register">
                    <div className="flex flex-col gap-2 py-2">
                      <p className="text-sm text-center mb-4">
                        Create a secure account with email verification to get started
                      </p>
                      <Button
                        type="button"
                        className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 transition-all duration-300"
                        onClick={handleStartRegistration}
                      >
                        Create Account
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        We'll send a verification code to your email to ensure account security
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                <CardFooter className="text-xs text-muted-foreground text-center mt-4">
                  By continuing, you agree to our Terms and Privacy Policy
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a verification code.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="hello@example.com"
                  value={resetFormData.email}
                  onChange={handleResetFormChange}
                  required
                />
              </div>
              {resetVerificationSent && (
                <div className="grid gap-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    name="token"
                    placeholder="Enter code"
                    value={resetFormData.token}
                    onChange={handleResetFormChange}
                    required
                  />
                </div>
              )}
              {resetVerificationSent && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      name="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={resetFormData.newPassword}
                      onChange={handleResetFormChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={resetFormData.confirmPassword}
                      onChange={handleResetFormChange}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForgotPasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {resetVerificationSent ? 'Reset Password' : 'Send Code'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* New Registration Flow Dialog */}
      <Dialog open={showNewRegistration} onOpenChange={setShowNewRegistration}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Your Account</DialogTitle>
            <DialogDescription>
              Follow the steps to create your account with email verification.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <RegisterFlow onRegistrationComplete={handleRegistrationComplete} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}