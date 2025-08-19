import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type User, type Product } from "@shared/schema";

// Define Sale type since it's not in schema.ts
type Sale = {
  id: number;
  productId: number;
  customerName?: string;
  totalAmount: number;
  saleDate?: Date;
};
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  FileText,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";

// Type for orders
type Order = {
  id: number;
  userId: number;
  products: { id: number; name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  date: Date;
};

export default function AdminDashboard() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        if (!data.user || !data.user.isAdmin) {
          navigate("/");
          toast({
            title: "Access Denied",
            description: "Only authorized administrators can access this page.",
            variant: "destructive",
          });
        }
      } catch (error) {
        navigate("/");
      }
    };
    checkAdmin();
  }, [navigate, toast]);

  // Fetch today's sales
  const { data: dailySales } = useQuery<Sale[]>({
    queryKey: ["/api/admin/sales/daily"]
  });
  
  // Fetch all users
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"]
  });
  
  // Fetch user orders when a user is selected
  const { data: userOrders } = useQuery<Order[]>({
    queryKey: ["/api/admin/users", selectedUserId, "orders"],
    enabled: !!selectedUserId
  });

  // Calculate total sales
  const totalSales = dailySales?.reduce((sum, sale) => sum + sale.totalAmount, 0) || 0;
  
  // Function to toggle user suspension
  const toggleUserSuspension = async (userId: number) => {
    try {
      await fetch(`/api/admin/users/${userId}/toggle-suspension`, {
        method: 'POST'
      });
      
      // Refresh users data
      toast({
        title: "Success",
        description: "User suspension status updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };
  
  // Function to toggle admin status
  const toggleUserAdmin = async (userId: number) => {
    try {
      await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST'
      });
      
      // Refresh users data
      toast({
        title: "Success",
        description: "Admin privileges updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      });
    }
  };
  
  // Function to view user orders
  const viewUserOrders = (userId: number) => {
    setSelectedUserId(userId);
    setActiveTab("userOrders");
  };
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-screen-xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Sales
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Today's Sales</CardTitle>
                <CardDescription>Total revenue generated today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{(totalSales / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Orders Today</CardTitle>
                <CardDescription>Number of orders processed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dailySales?.length || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Users</CardTitle>
                <CardDescription>Registered customer accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest transactions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySales?.map((sale) => (
                      <tr key={sale.id} className="border-b">
                        <td className="py-2">{sale.customerName || 'Anonymous'}</td>
                        <td className="py-2">Product #{sale.productId}</td>
                        <td className="py-2">₹{(sale.totalAmount / 100).toFixed(2)}</td>
                        <td className="py-2">
                          {new Date(sale.saleDate!).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {(!dailySales || dailySales.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">
                          No sales today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Products Tab - Placeholder */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Manage your store's inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">This feature will allow you to add, edit, and remove products from your inventory.</p>
              <Button onClick={() => navigate("/admin/inventory")}>Go to Inventory</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sales Tab - Placeholder */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Reports</CardTitle>
              <CardDescription>View and analyze your sales data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed sales reports and analytics will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage customer accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">User</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Mobile</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Role</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {user.email.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">User #{user.id}</span>
                          </div>
                        </td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">{user.mobileNumber}</td>
                        <td className="py-3">
                          {user.isSuspended ? (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 border-red-200">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border-green-200">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 border-blue-200">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 border-gray-200">
                              Customer
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewUserOrders(user.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>View Orders</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleUserSuspension(user.id)}>
                                {user.isSuspended ? (
                                  <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    <span>Activate Account</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    <span>Suspend Account</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleUserAdmin(user.id)}>
                                {user.isAdmin ? (
                                  <>
                                    <X className="mr-2 h-4 w-4" />
                                    <span>Remove Admin</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    <span>Make Admin</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {(!users || users.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Orders Tab */}
        <TabsContent value="userOrders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Orders</CardTitle>
                <CardDescription>
                  Viewing orders for User #{selectedUserId}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("users")}>
                Back to Users
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-left py-2">Products</th>
                      <th className="text-left py-2">Total</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders?.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-2">{order.id}</td>
                        <td className="py-2">
                          <ul>
                            {order.products.map((product) => (
                              <li key={product.id}>
                                {product.name} x{product.quantity}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-2">₹{(order.total / 100).toFixed(2)}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border-green-200">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {(!userOrders || userOrders.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500">
                          No orders found for this user
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}