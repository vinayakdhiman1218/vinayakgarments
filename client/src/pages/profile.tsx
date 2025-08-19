import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Profile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    mobileNumber: ""
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/users/profile"],
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false,
    onError: () => {
      // In case of error, we'll still display a placeholder profile
    }
  });

  useEffect(() => {
    if (userData?.user) {
      setFormData({
        displayName: userData.user.displayName || "",
        email: userData.user.email || "",
        mobileNumber: userData.user.mobileNumber || ""
      });
    } else {
      // Default data from the current session
      const checkAuth = async () => {
        try {
          const response = await fetch("/api/auth/check");
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setFormData(prev => ({
                ...prev,
                email: data.user.email || ""
              }));
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      };
      checkAuth();
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update the profile with the API
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          mobileNumber: formData.mobileNumber
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated."
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <Card className="animate-pulse">
            <CardHeader className="pb-0">
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Please wait</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="h-32 bg-gray-200 rounded-md"></div>
              <div className="h-20 bg-gray-200 rounded-md"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="pb-0">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">My Profile</CardTitle>
            <CardDescription>
              Manage your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <Avatar className="h-24 w-24 border-4 border-primary/10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-3xl">
                    {formData.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {userData?.user?.isVerified && (
                  <Badge className="absolute -bottom-2 right-0 bg-green-500 hover:bg-green-600">Verified</Badge>
                )}
              </motion.div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{formData.displayName || formData.email}</h3>
                <p className="text-gray-500 text-sm mb-2">{formData.email}</p>
                <div className="flex gap-2 flex-wrap">
                  {userData?.user?.isAdmin && (
                    <Badge variant="outline" className="border-primary/50 text-primary">Admin</Badge>
                  )}
                  <Badge variant="outline" className="border-primary/50 text-primary">Customer</Badge>
                </div>
              </div>
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="shrink-0"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>

            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4 border rounded-xl p-4 bg-gray-50/50">
                  <div className="grid gap-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your email"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed after registration</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="Your mobile number"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-xl p-4 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-500 mb-1">Display Name</p>
                    <p className="font-medium">{formData.displayName || "Not set"}</p>
                  </div>
                  <div className="border rounded-xl p-4 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                  <div className="border rounded-xl p-4 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-500 mb-1">Mobile Number</p>
                    <p className="font-medium">{formData.mobileNumber || "Not set"}</p>
                  </div>
                  <div className="border rounded-xl p-4 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
                    <p className="font-medium">{userData?.user?.createdAt ? new Date(userData.user.createdAt).toLocaleDateString() : "March 2025"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Account Management</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  Change Password
                </Button>
                <Button variant="outline" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                  Notification Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}