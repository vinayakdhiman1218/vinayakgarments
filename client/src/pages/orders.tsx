import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Package, Truck, Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Order = {
  id: number;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
};

// Empty order data
const emptyOrders: Order[] = [];

export default function Orders() {
  const [orders] = useState<Order[]>(emptyOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return <Info className="text-blue-500" />;
      case 'shipped':
        return <Truck className="text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="text-green-500" />;
      case 'cancelled':
        return <Info className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="outline" className="border-blue-200 text-blue-500 bg-blue-50">Processing</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="border-orange-200 text-orange-500 bg-orange-50">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="border-green-200 text-green-500 bg-green-50">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-200 text-red-500 bg-red-50">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toString().includes(searchQuery) || 
    order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTrackOrder = (orderId: number) => {
    toast({
      title: "Tracking Information",
      description: `Order #${orderId} tracking details have been sent to your email.`
    });
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">My Orders</CardTitle>
            <CardDescription>
              View and track your order history
            </CardDescription>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search orders by ID or product name" 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="pt-4">
                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                              {getStatusText(order.status)}
                            </div>
                            <p className="text-gray-500 text-sm">{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <p className="font-semibold">Total: ₹{order.total.toFixed(2)}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleTrackOrder(order.id)}
                              className="ml-2"
                            >
                              Track Order
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                              <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-medium">₹{item.price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 flex items-center text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span>
                              {order.status === 'processing' && 'Your order is being processed'}
                              {order.status === 'shipped' && 'Your order is on the way'}
                              {order.status === 'delivered' && 'Your order has been delivered'}
                              {order.status === 'cancelled' && 'Your order has been cancelled'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No orders found matching your search.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="processing" className="pt-4">
                {filteredOrders.filter(o => o.status === 'processing').length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders
                      .filter(o => o.status === 'processing')
                      .map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Same order content as above */}
                          <div className="flex flex-col md:flex-row justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                                {getStatusText(order.status)}
                              </div>
                              <p className="text-gray-500 text-sm">{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                              <p className="font-semibold">Total: ₹{order.total.toFixed(2)}</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTrackOrder(order.id)}
                                className="ml-2"
                              >
                                Track Order
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                                  <Package size={20} className="text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium">₹{item.price.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No orders currently being processed.</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Similar TabsContent for shipped and delivered */}
              <TabsContent value="shipped" className="pt-4">
                {filteredOrders.filter(o => o.status === 'shipped').length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders
                      .filter(o => o.status === 'shipped')
                      .map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Same order content */}
                          <div className="flex flex-col md:flex-row justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                                {getStatusText(order.status)}
                              </div>
                              <p className="text-gray-500 text-sm">{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                              <p className="font-semibold">Total: ₹{order.total.toFixed(2)}</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTrackOrder(order.id)}
                                className="ml-2"
                              >
                                Track Order
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                                  <Package size={20} className="text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium">₹{item.price.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-3 flex items-center text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              <span>Your order is on the way</span>
                            </div>
                          </div>
                        </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No orders currently being shipped.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="delivered" className="pt-4">
                {filteredOrders.filter(o => o.status === 'delivered').length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders
                      .filter(o => o.status === 'delivered')
                      .map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Same order content */}
                          <div className="flex flex-col md:flex-row justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                                {getStatusText(order.status)}
                              </div>
                              <p className="text-gray-500 text-sm">{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                              <p className="font-semibold">Total: ₹{order.total.toFixed(2)}</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="ml-2"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                                  <Package size={20} className="text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium">₹{item.price.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-3 flex items-center text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              <span>Your order has been delivered</span>
                            </div>
                          </div>
                        </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No delivered orders found.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}