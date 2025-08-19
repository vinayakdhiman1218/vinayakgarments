import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Trash, Plus, Minus, ChevronRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
};

// Empty cart
const emptyCart: CartItem[] = [];

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>(emptyCart);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const { toast } = useToast();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0; // 10% discount with coupon
  const deliveryFee = subtotal > 1999 ? 0 : 99;
  const total = subtotal - discount + deliveryFee;

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
    
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "WELCOME10") {
      setCouponApplied(true);
      toast({
        title: "Coupon applied",
        description: "10% discount has been applied to your order.",
      });
    } else {
      toast({
        title: "Invalid coupon",
        description: "The coupon code you entered is invalid or has expired.",
        variant: "destructive"
      });
    }
  };

  const proceedToCheckout = () => {
    toast({
      title: "Proceeding to checkout",
      description: "You'll be redirected to the payment page.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-6">Your Shopping Cart</h1>
        
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                  <CardDescription>Review and modify your selected items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    {cartItems.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 border rounded-lg p-4 relative"
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                          <ShoppingBag className="text-gray-400" />
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                            
                            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.color && <span>• Color: {item.color}</span>}
                            </div>
                            
                            <p className="font-medium text-primary">₹{item.price.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <div className="h-8 px-3 flex items-center justify-center border-y border-input">
                                {item.quantity}
                              </div>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => window.location.href = '/products'}>
                    Continue Shopping
                  </Button>
                  <Button variant="outline" className="text-red-500" onClick={() => setCartItems([])}>
                    Clear Cart
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    
                    {couponApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount (10%)</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Fee</span>
                      <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                    
                    {subtotal < 1999 && (
                      <div className="text-sm text-blue-600 mt-1">
                        Add ₹{(1999 - subtotal).toFixed(2)} more to get free delivery!
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">Apply Coupon Code</p>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter code" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied}
                      />
                      <Button 
                        variant="outline" 
                        onClick={applyCoupon}
                        disabled={couponApplied || !couponCode}
                      >
                        Apply
                      </Button>
                    </div>
                    {couponApplied && (
                      <p className="text-xs text-green-600 mt-1">WELCOME10 coupon applied!</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 group"
                    onClick={proceedToCheckout}
                  >
                    <span>Proceed to Checkout</span>
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="mt-4 text-sm text-gray-500 space-y-2">
                <p>• Free delivery on orders above ₹1,999</p>
                <p>• Secure payment options available</p>
                <p>• Easy 7-day returns on most items</p>
              </div>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
                <Button onClick={() => window.location.href = '/products'}>
                  Explore Products
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}