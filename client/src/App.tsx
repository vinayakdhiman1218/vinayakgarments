import { Suspense, useEffect, useState } from "react";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Pages
import Home from "@/pages/home";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Products from "@/pages/products";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminInventory from "@/pages/admin/inventory";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/profile"; 
import Orders from "@/pages/orders";
import Cart from "@/pages/cart";
import Settings from "@/pages/settings";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        if (typeof queryKey[0] === "string" && queryKey[0].startsWith("/")) {
          const response = await fetch(queryKey[0]);
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }
          return response.json();
        }
        return undefined;
      },
    },
  },
});

export default function App() {
  const [user, setUser] = useState<{ email: string; isAdmin: boolean } | null>(null);

  // Add smooth scrolling
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Header user={user} />
        <main className="flex-grow">
          <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/products" component={Products} />
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/profile">
                {user ? <Profile /> : <div className="p-12 text-center">Please login to view your profile</div>}
              </Route>
              <Route path="/orders">
                {user ? <Orders /> : <div className="p-12 text-center">Please login to view your orders</div>}
              </Route>
              <Route path="/cart">
                {user ? <Cart /> : <div className="p-12 text-center">Please login to view your cart</div>}
              </Route>
              <Route path="/settings">
                {user ? <Settings /> : <div className="p-12 text-center">Please login to access settings</div>}
              </Route>
              <Route path="/admin">
                {user?.isAdmin ? (
                  <AdminDashboard />
                ) : (
                  <div className="p-12 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p>You do not have permission to access the admin panel.</p>
                  </div>
                )}
              </Route>
              <Route path="/admin/inventory">
                {user?.isAdmin ? (
                  <AdminInventory />
                ) : (
                  <div className="p-12 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p>You do not have permission to access the admin panel.</p>
                  </div>
                )}
              </Route>
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}