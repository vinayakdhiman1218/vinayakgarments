import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  resetPasswordSchema, 
  verifyResetTokenSchema, 
  insertContactMessageSchema,
  registrationInitSchema,
  verifyEmailSchema,
  completeRegistrationSchema
} from "@shared/schema";
import { z } from "zod";
import inventoryRoutes from "./routes/inventory";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "./email";

declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      email: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get("/api/auth/check", async (req, res) => {
    const user = req.session?.user;
    
    if (user) {
      // Get the full user from storage to check admin and suspension status
      const fullUser = await storage.getUserByEmail(user.email);
      
      if (!fullUser) {
        req.session.destroy(() => {});
        return res.json({ user: null });
      }
      
      res.json({ 
        user: { 
          id: fullUser.id,
          email: fullUser.email, 
          isAdmin: fullUser.isAdmin 
        } 
      });
    } else {
      res.json({ user: null });
    }
  });

  // New registration flow: Step 1 - Initialize registration with email
  app.post("/api/auth/register/init", async (req, res) => {
    try {
      const { email } = registrationInitSchema.parse(req.body);
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Generate a verification code (OTP)
      const verificationToken = randomBytes(3).toString('hex').toUpperCase();
      const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      // Create a pending user
      await storage.createPendingUser(email, verificationToken, tokenExpiry);
      
      // Send verification via both email and WhatsApp
      const emailSent = await sendVerificationEmail(email, verificationToken, 'registration');
      const whatsappSent = await sendWhatsAppOTP(mobileNumber, verificationToken);
      
      if (!emailSent && !whatsappSent) {
        return res.status(500).json({ message: "Failed to send verification code" });
      }
      
      res.json({ 
        message: "Verification code sent to your email", 
        email 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid email address", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Registration initialization failed" });
    }
  });
  
  // Step 2 - Verify email with OTP
  app.post("/api/auth/register/verify", async (req, res) => {
    try {
      const { email, token } = verifyEmailSchema.parse(req.body);
      
      // Verify the token
      const isValid = await storage.verifyEmailToken(email, token);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      res.json({ 
        message: "Email verification successful", 
        email 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid form data", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      res.status(500).json({ message: "Verification failed" });
    }
  });
  
  // Step 3 - Complete registration
  app.post("/api/auth/register/complete", async (req, res) => {
    try {
      const formData = completeRegistrationSchema.parse(req.body);
      
      // Complete the registration 
      const user = await storage.completeUserRegistration(
        formData.email,
        formData.password,
        formData.mobileNumber
      );
      
      // Log the user in
      req.session.user = { id: user.id, email: user.email };
      
      // Return the user data
      const isAdmin = user.email === "vinayak.dhiman.012@gmail.com";
      res.json({ user: { email: user.email, isAdmin: user.isAdmin ?? isAdmin } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid form data", 
          errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  // Registration is now handled via the multi-step OTP flow above

  // Password Reset Routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = resetPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Generate a 6-digit verification code
      const resetToken = randomBytes(3).toString('hex').toUpperCase();
      const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store the reset token
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry
      });

      // Send verification email
      const emailSent = await sendVerificationEmail(email, resetToken);

      if (!emailSent) {
        res.status(500).json({ message: "Failed to send verification email" });
        return;
      }

      res.json({ 
        message: "Reset instructions sent to your email"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid email address" });
        return;
      }
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = verifyResetTokenSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user || !user.resetToken || !user.resetTokenExpiry) {
        res.status(400).json({ message: "Invalid or expired reset token" });
        return;
      }

      if (user.resetToken !== token) {
        res.status(400).json({ message: "Invalid verification code" });
        return;
      }

      if (new Date() > new Date(user.resetTokenExpiry)) {
        res.status(400).json({ message: "Reset token has expired" });
        return;
      }

      // Update password and clear reset token
      await storage.updateUser(user.id, {
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      res.json({ message: "Password reset successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid form data" });
        return;
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string()
      });
      
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      
      // Check if account is suspended
      if (user.isSuspended) {
        res.status(403).json({ message: "Your account has been suspended. Please contact support." });
        return;
      }

      req.session.user = { id: user.id, email: user.email };
      res.json({ user: { email: user.email, isAdmin: user.isAdmin } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid form data" });
        return;
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  // Product routes
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/featured", async (_req, res) => {
    const products = await storage.getFeaturedProducts();
    res.json(products);
  });

  app.get("/api/products/category/:category", async (req, res) => {
    const category = req.params.category;
    const products = await storage.getProductsByCategory(category);
    res.json(products);
  });

  // Contact route
  app.post("/api/contact", async (req, res) => {
    try {
      const message = insertContactMessageSchema.parse(req.body);
      const result = await storage.createContactMessage(message);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid form data" });
        return;
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin routes - User management
  const isAdmin = (req: any, res: any, next: any) => {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ message: "Please login to access this feature" });
    }
    
    if (user.email !== "vinayak.dhiman.012@gmail.com" && !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };
  
  app.get("/api/admin/users", isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send password hashes to client
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.post("/api/admin/users/:id/toggle-suspension", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedUser = await storage.toggleUserSuspension(id);
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.post("/api/admin/users/:id/toggle-admin", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedUser = await storage.toggleUserAdmin(id);
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Mock endpoint for user orders - in a real app, this would fetch from an orders table
  app.get("/api/admin/users/:id/orders", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    // Mock order data
    res.json([
      { 
        id: 1, 
        userId, 
        products: [
          { id: 1, name: "Classic Cotton Shirt", quantity: 2, price: 2999 }
        ], 
        total: 5998, 
        status: "delivered", 
        date: new Date() 
      }
    ]);
  });
  
  // Mock sales data endpoint
  app.get("/api/admin/sales/daily", isAdmin, async (_req, res) => {
    res.json([
      { 
        id: 1, 
        productId: 1, 
        customerName: "Sample Customer", 
        totalAmount: 2999, 
        saleDate: new Date() 
      }
    ]);
  });
  
  // Add inventory routes
  app.use("/api/inventory", inventoryRoutes);

  const httpServer = createServer(app);
  return httpServer;
}