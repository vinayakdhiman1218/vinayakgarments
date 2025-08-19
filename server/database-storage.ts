import { 
  type User, type InsertUser,
  type Product, type InsertProduct,
  type ContactMessage, type InsertContactMessage,
  type UserPreference, type InsertUserPreference,
  type UserAddress, type InsertUserAddress,
  type InventoryLog, type InsertInventoryLog,
  users, userPreferences, userAddresses, products, contactMessages, inventoryLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(userData: {
    email: string;
    password: string;
    mobileNumber?: string;
    isAdmin?: boolean;
    isSuspended?: boolean;
    isVerified?: boolean;
    verificationToken?: string | null;
    verificationTokenExpiry?: Date | null;
    createdAt?: Date;
    confirmPassword?: string;
  }): Promise<User> {
    // Handle the special case for admin user if isAdmin is not provided
    const isAdmin = userData.isAdmin !== undefined 
      ? userData.isAdmin 
      : userData.email === "vinayak.dhiman.012@gmail.com";
    
    const [user] = await db.insert(users).values({
      email: userData.email,
      password: userData.password,
      mobileNumber: userData.mobileNumber || "",
      verificationToken: userData.verificationToken || null,
      verificationTokenExpiry: userData.verificationTokenExpiry || null,
      isVerified: userData.isVerified ?? false,
      isAdmin,
      isSuspended: userData.isSuspended ?? false,
      createdAt: userData.createdAt
    }).returning();
    
    return user;
  }

  // Create a pending user with just email verification details
  async createPendingUser(email: string, verificationToken: string, tokenExpiry: Date): Promise<Partial<User>> {
    // Check if this email already exists as a full user
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    
    // We'll use the users table but only with partial data
    const [pendingUser] = await db.insert(users).values({
      email,
      // Use a placeholder password that will be replaced during complete registration
      password: "PENDING_REGISTRATION",
      verificationToken,
      verificationTokenExpiry: tokenExpiry,
      isVerified: false
    }).returning();
    
    return {
      email: pendingUser.email,
      verificationToken: pendingUser.verificationToken,
      verificationTokenExpiry: pendingUser.verificationTokenExpiry
    };
  }
  
  // Get pending user by email
  async getPendingUserByEmail(email: string): Promise<{
    email: string;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    mobileNumber?: string;
  } | undefined> {
    const [pendingUser] = await db
      .select({
        email: users.email,
        verificationToken: users.verificationToken,
        verificationTokenExpiry: users.verificationTokenExpiry,
        mobileNumber: users.mobileNumber
      })
      .from(users)
      .where(and(
        eq(users.email, email),
        eq(users.password, "PENDING_REGISTRATION")
      ));
      
    // Convert null mobileNumber to undefined to satisfy the interface
    if (pendingUser) {
      return {
        ...pendingUser,
        mobileNumber: pendingUser.mobileNumber || undefined
      };
    }
    
    return pendingUser;
  }
  
  // Verify email token
  async verifyEmailToken(email: string, token: string): Promise<boolean> {
    const pendingUser = await this.getPendingUserByEmail(email);
    
    if (!pendingUser || !pendingUser.verificationToken || !pendingUser.verificationTokenExpiry) {
      return false;
    }
    
    if (pendingUser.verificationToken !== token) {
      return false;
    }
    
    if (new Date() > pendingUser.verificationTokenExpiry) {
      return false;
    }
    
    return true;
  }
  
  // Complete user registration after verification
  async completeUserRegistration(
    email: string, 
    password: string
  ): Promise<User> {
    const pendingUser = await this.getPendingUserByEmail(email);
    
    if (!pendingUser) {
      throw new Error("No pending registration found for this email");
    }
    
    // Update the pending user
    const [user] = await db
      .update(users)
      .set({
        password,
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      })
      .where(eq(users.email, email))
      .returning();
    
    return user;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return user;
  }

  // Update user
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  // Get all users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  
  // Toggle user suspension
  async toggleUserSuspension(id: number): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return this.updateUser(id, { isSuspended: !user.isSuspended });
  }
  
  // Toggle user admin status
  async toggleUserAdmin(id: number): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return this.updateUser(id, { isAdmin: !user.isAdmin });
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.category, category))
      .orderBy(asc(products.name));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({
        ...product,
        featured: product.featured ?? false,
        stock: product.stock ?? 0,
        minStock: product.minStock ?? 5
      })
      .returning();
    
    return newProduct;
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    
    if (!updatedProduct) {
      throw new Error("Product not found");
    }
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    
    return !!result;
  }

  // Contact operations
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  // User preference operations (extended functionality)
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    return preferences;
  }

  async createUserPreferences(data: InsertUserPreference): Promise<UserPreference> {
    const [preferences] = await db
      .insert(userPreferences)
      .values(data)
      .returning();
    
    return preferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreference>): Promise<UserPreference> {
    // Check if preferences exist
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (!existingPrefs) {
      // Create new preferences if they don't exist
      return this.createUserPreferences({
        userId,
        ...updates
      } as InsertUserPreference);
    }
    
    // Update existing preferences
    const [updatedPrefs] = await db
      .update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, userId))
      .returning();
    
    return updatedPrefs;
  }

  // User addresses operations
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, userId))
      .orderBy(desc(userAddresses.isPrimary), asc(userAddresses.createdAt));
  }

  async createUserAddress(data: InsertUserAddress): Promise<UserAddress> {
    // If this is the primary address, set all other addresses to non-primary
    if (data.isPrimary) {
      await db
        .update(userAddresses)
        .set({ isPrimary: false })
        .where(eq(userAddresses.userId, data.userId));
    }
    
    const [address] = await db
      .insert(userAddresses)
      .values(data)
      .returning();
    
    return address;
  }

  async updateUserAddress(id: number, userId: number, updates: Partial<UserAddress>): Promise<UserAddress> {
    // If updating to primary, set all other addresses to non-primary
    if (updates.isPrimary) {
      await db
        .update(userAddresses)
        .set({ isPrimary: false })
        .where(eq(userAddresses.userId, userId));
    }
    
    const [updatedAddress] = await db
      .update(userAddresses)
      .set(updates)
      .where(and(
        eq(userAddresses.id, id),
        eq(userAddresses.userId, userId)
      ))
      .returning();
    
    if (!updatedAddress) {
      throw new Error("Address not found or doesn't belong to user");
    }
    
    return updatedAddress;
  }

  async deleteUserAddress(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(userAddresses)
      .where(and(
        eq(userAddresses.id, id),
        eq(userAddresses.userId, userId)
      ));
    
    return !!result;
  }

  // Inventory operations
  async getInventoryLogs(productId?: number): Promise<InventoryLog[]> {
    if (productId) {
      return await db
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.productId, productId))
        .orderBy(desc(inventoryLogs.timestamp));
    } else {
      return await db
        .select()
        .from(inventoryLogs)
        .orderBy(desc(inventoryLogs.timestamp));
    }
  }

  async createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog> {
    const [newLog] = await db
      .insert(inventoryLogs)
      .values({
        ...log,
        timestamp: new Date()
      })
      .returning();
    
    return newLog;
  }

  async updateProductStock(productId: number, quantityChange: number): Promise<Product> {
    // First get the current product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Calculate new stock quantity
    const newStock = Math.max(0, product.stock + quantityChange);
    
    // Update the product stock
    const [updatedProduct] = await db
      .update(products)
      .set({ stock: newStock })
      .where(eq(products.id, productId))
      .returning();
    
    // Create an inventory log
    await this.createInventoryLog({
      productId,
      quantity: quantityChange,
      type: quantityChange > 0 ? 'add' : 'remove',
      note: `Stock updated by ${quantityChange > 0 ? 'adding' : 'removing'} ${Math.abs(quantityChange)} units`
    });
    
    return updatedProduct;
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const allProducts = await db.select().from(products);
    
    // Filter products with low stock
    if (threshold) {
      return allProducts
        .filter(product => product.stock <= threshold)
        .sort((a, b) => a.stock - b.stock);
    } else {
      return allProducts
        .filter(product => product.stock <= (product.minStock || 5))
        .sort((a, b) => a.stock - b.stock);
    }
  }
}