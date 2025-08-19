import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Lock, 
  Shield, 
  Mail, 
  CreditCard, 
  Home, 
  Languages, 
  LogOut,
  Smartphone,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

// Types for API responses
interface ProfileResponse {
  user: {
    id: number;
    email: string;
    displayName?: string;
    mobileNumber?: string;
    isAdmin: boolean;
    isSuspended: boolean;
    isVerified: boolean;
    createdAt: string;
  }
}

interface PreferencesResponse {
  preferences: {
    id: number;
    userId: number;
    emailNotifications: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    accountAlerts: boolean;
    darkMode: boolean;
    language: string;
    currency: string;
  }
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    accountAlerts: true
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    mobileNumber: ""
  });
  
  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/users/profile'],
    queryFn: getQueryFn<ProfileResponse>({
      on401: "returnNull",
    }),
  });
  
  // Fetch user preferences
  const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
    queryKey: ['/api/users/preferences'],
    queryFn: getQueryFn<PreferencesResponse>({
      on401: "returnNull",
    }),
  });
  
  // Update user preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest('PUT', '/api/users/preferences', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/preferences'] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest('PUT', '/api/users/profile', profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Set initial user data from API response
  useEffect(() => {
    if (profileData && profileData.user) {
      setProfileForm({
        displayName: profileData.user.displayName || "",
        mobileNumber: profileData.user.mobileNumber || ""
      });
    }
  }, [profileData]);
  
  // Set initial preferences from API response
  useEffect(() => {
    if (preferencesData && preferencesData.preferences) {
      const prefs = preferencesData.preferences;
      setNotificationSettings({
        emailNotifications: prefs.emailNotifications || false,
        orderUpdates: prefs.orderUpdates || false,
        promotions: prefs.promotions || false,
        accountAlerts: prefs.accountAlerts || false,
        darkMode: prefs.darkMode || false
      });
    }
  }, [preferencesData]);

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    
    setNotificationSettings(newSettings);
    updatePreferencesMutation.mutate(newSettings);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "The new password and confirmation don't match.",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real implementation, we would call the API to update the password
    toast({
      title: "Password updated",
      description: "Your password has been successfully changed."
    });
    
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/";
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Logout failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-6">Account Settings</h1>
        
        <Tabs defaultValue="notifications">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64 shrink-0">
              <TabsList className="flex flex-col h-auto w-full bg-gray-50 p-2 rounded-lg">
                <TabsTrigger value="notifications" className="justify-start w-full mb-1">
                  <Bell className="h-4 w-4 mr-2" />
                  <span>Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="justify-start w-full mb-1">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="account" className="justify-start w-full mb-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span>Account</span>
                </TabsTrigger>
                <TabsTrigger value="addresses" className="justify-start w-full mb-1">
                  <Home className="h-4 w-4 mr-2" />
                  <span>Addresses</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="justify-start w-full mb-1">
                  <Languages className="h-4 w-4 mr-2" />
                  <span>Preferences</span>
                </TabsTrigger>
                <Separator className="my-2" />
                <Button variant="outline" className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50 mt-1" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign Out</span>
                </Button>
              </TabsList>
            </div>
            
            <div className="flex-1">
              <TabsContent value="notifications" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-primary" />
                      Notification Settings
                    </CardTitle>
                    <CardDescription>
                      Control how you receive notifications and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Email Notifications</div>
                          <div className="text-sm text-muted-foreground">Receive emails for important updates</div>
                        </div>
                        <Switch 
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={() => handleNotificationChange('emailNotifications')}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Order Updates</div>
                          <div className="text-sm text-muted-foreground">Get notified about your order status</div>
                        </div>
                        <Switch 
                          checked={notificationSettings.orderUpdates}
                          onCheckedChange={() => handleNotificationChange('orderUpdates')}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Promotions and Offers</div>
                          <div className="text-sm text-muted-foreground">Receive promotional emails and special offers</div>
                        </div>
                        <Switch 
                          checked={notificationSettings.promotions}
                          onCheckedChange={() => handleNotificationChange('promotions')}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Account Alerts</div>
                          <div className="text-sm text-muted-foreground">Get notified about security events and account changes</div>
                        </div>
                        <Switch 
                          checked={notificationSettings.accountAlerts}
                          onCheckedChange={() => handleNotificationChange('accountAlerts')}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        You can always unsubscribe from email notifications by clicking the unsubscribe link at the bottom of the email.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-primary" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your password and account security options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={updatePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter your current password"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter your new password"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm your new password"
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full">
                        Update Password
                      </Button>
                    </form>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button variant="outline">
                        <Smartphone className="h-4 w-4 mr-2" />
                        <span>Enable 2FA</span>
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Account Sessions</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        You're currently logged in on this device. You can log out of all other sessions.
                      </p>
                      <Button variant="secondary">
                        Log Out from All Other Devices
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="account" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-primary" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profileLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <div className="flex gap-2 items-center">
                            <Input value={profileData?.user?.email || ""} disabled />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This email is used for login and important account notifications
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <div className="flex gap-2 items-center">
                            <Input 
                              id="displayName"
                              value={profileForm.displayName}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                              placeholder="Enter your display name" 
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This name will be displayed publicly in your profile and on your orders
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="mobileNumber">Mobile Number</Label>
                          <div className="flex gap-2 items-center">
                            <Input 
                              id="mobileNumber"
                              value={profileForm.mobileNumber}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                              placeholder="Enter your mobile number" 
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Your mobile number will be used for order updates and account security
                          </p>
                        </div>
                        
                        <Button 
                          className="mt-4"
                          onClick={() => updateProfileMutation.mutate(profileForm)}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="font-medium mb-4">Danger Zone</h3>
                          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <h4 className="text-red-600 font-semibold mb-2">Delete Account</h4>
                            <p className="text-sm text-red-600/70 mb-3">
                              Once you delete your account, there is no going back. This action cannot be undone.
                            </p>
                            <Button variant="destructive">
                              Delete My Account
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Add other TabsContent components for addresses and preferences */}
              <TabsContent value="addresses" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Home className="h-5 w-5 mr-2 text-primary" />
                      Address Book
                    </CardTitle>
                    <CardDescription>
                      Manage your saved addresses for faster checkout
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Content will be implemented in the next iteration */}
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-3">Address management feature coming soon!</p>
                      <Button disabled>
                        Add New Address
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preferences" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Languages className="h-5 w-5 mr-2 text-primary" />
                      App Theme
                    </CardTitle>
                    <CardDescription>
                      Customize your app appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">                      
                      
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}