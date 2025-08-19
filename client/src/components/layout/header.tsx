import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Header({user}: {user: any}) {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update the navItems array to include admin link when user is admin
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    ...(user?.isAdmin ? [{ name: "Admin", href: "/admin" }] : [])
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }
      // Redirect to login page after successful logout.
      window.location.href = '/'; 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="group flex items-center gap-2 cursor-pointer">
              <motion.div
                whileHover={{ rotate: 5 }}
                className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-md flex items-center justify-center text-white font-bold text-lg"
              >
                VG
              </motion.div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent transition-all duration-300 group-hover:from-blue-600 group-hover:to-purple-600">
                Vinayak Garments
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative px-3 py-2 rounded-md group cursor-pointer">
                <Link href={item.href}>
                  {location === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-md"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 font-medium transition-colors",
                      location === item.href
                        ? "text-primary"
                        : "text-gray-600 group-hover:text-primary"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LoginButton onLogout={handleLogout} />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <motion.div
                animate={mobileMenuOpen ? "open" : "closed"}
                className="w-6 h-6 flex flex-col justify-center items-center"
              >
                <motion.span
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: 45, y: 2 }
                  }}
                  className="w-5 h-0.5 bg-current block mb-1 transition-all"
                />
                <motion.span
                  variants={{
                    closed: { opacity: 1 },
                    open: { opacity: 0 }
                  }}
                  className="w-5 h-0.5 bg-current block mb-1 transition-all"
                />
                <motion.span
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: -45, y: -2 }
                  }}
                  className="w-5 h-0.5 bg-current block transition-all"
                />
              </motion.div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.nav
        initial="closed"
        animate={mobileMenuOpen ? "open" : "closed"}
        variants={{
          open: { height: "auto", opacity: 1 },
          closed: { height: 0, opacity: 0 }
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-3 flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "px-3 py-2 block rounded-md transition-colors",
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </motion.nav>
    </motion.header>
  );
}