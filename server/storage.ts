import { 
  type User, type InsertUser,
  type Product, type InsertProduct,
  type ContactMessage, type InsertContactMessage,
  type UserPreference, type InsertUserPreference,
  type UserAddress, type InsertUserAddress,
  type InventoryLog, type InsertInventoryLog
} from "@shared/schema";

export interface IStorage {
  // User operations
  createUser(user: {
    email: string;
    password: string;
    mobileNumber?: string;
    isAdmin?: boolean;
    isSuspended?: boolean;
    isVerified?: boolean;
    verificationToken?: string | null;
    verificationTokenExpiry?: Date | null;
    createdAt?: Date;
    confirmPassword?: string; // Make this optional to support both interfaces
  }): Promise<User>;
  
  // Method to store just email with verification token before full registration
  createPendingUser(email: string, verificationToken: string, tokenExpiry: Date): Promise<Partial<User>>;
  
  // Gets a pending user verification by email
  getPendingUserByEmail(email: string): Promise<{
    email: string;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    mobileNumber?: string;
  } | undefined>;
  
  // Completes registration after verification
  completeUserRegistration(
    email: string, 
    password: string
  ): Promise<User>;
  
  // Verify a user's email verification token
  verifyEmailToken(email: string, token: string): Promise<boolean>;
  
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  toggleUserSuspension(id: number): Promise<User>;
  toggleUserAdmin(id: number): Promise<User>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Inventory operations
  getInventoryLogs(productId?: number): Promise<InventoryLog[]>;
  createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog>;
  updateProductStock(productId: number, quantityChange: number): Promise<Product>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;

  // Contact operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  
  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreference | undefined>;
  createUserPreferences(data: InsertUserPreference): Promise<UserPreference>;
  updateUserPreferences(userId: number, updates: Partial<UserPreference>): Promise<UserPreference>;
  
  // User addresses operations
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  createUserAddress(data: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(id: number, userId: number, updates: Partial<UserAddress>): Promise<UserAddress>;
  deleteUserAddress(id: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pendingUsers: Map<string, {
    email: string;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    mobileNumber?: string;
  }>;
  private products: Map<number, Product>;
  private messages: Map<number, ContactMessage>;
  private userPrefs: Map<number, UserPreference>;
  private addresses: Map<number, UserAddress>;
  private currentIds: {
    user: number;
    product: number;
    message: number;
    preference: number;
    address: number;
  };

  constructor() {
    this.users = new Map();
    this.pendingUsers = new Map();
    this.products = new Map();
    this.messages = new Map();
    this.userPrefs = new Map();
    this.addresses = new Map();
    this.currentIds = {
      user: 1,
      product: 1,
      message: 1,
      preference: 1,
      address: 1
    };

    // Initialize with test user
    this.createUser({
      email: "vinayak.dhiman.012@gmail.com",
      password: "admin123",
      mobileNumber: "+919467092793",
      confirmPassword: "admin123", // Add confirm password for schema validation
      isVerified: true // Admin is automatically verified
    });

    this.initializeProducts();
  }

  private initializeProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        name: "Classic Cotton Shirt",
        description: "Premium cotton formal shirt",
        price: 2999,
        imageUrl: "https://images.unsplash.com/photo-1603347585534-badcc8b973c0",
        category: "Formal Wear",
        featured: true,
        stock: 10,
        minStock: 5
      },
      {
        name: "Casual Denim Jacket",
        description: "Stylish denim jacket for casual occasions",
        price: 4999,
        imageUrl: "https://images.unsplash.com/photo-1527905804285-2f67b86e3bf6",
        category: "Casual Wear",
        featured: true,
        stock: 15,
        minStock: 5
      }
    ];

    sampleProducts.forEach(product => {
      this.createProduct(product);
    });
  }

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
    confirmPassword?: string; // Optional to handle test data
  }): Promise<User> {
    const id = this.currentIds.user++;
    // Handle the special case for admin user if isAdmin is not provided
    const isAdmin = userData.isAdmin !== undefined 
      ? userData.isAdmin 
      : userData.email === "vinayak.dhiman.012@gmail.com";
    
    const user: User = { 
      email: userData.email,
      password: userData.password,
      displayName: null,
      mobileNumber: userData.mobileNumber || "",
      id,
      resetToken: null,
      resetTokenExpiry: null,
      verificationToken: userData.verificationToken || null,
      verificationTokenExpiry: userData.verificationTokenExpiry || null,
      isVerified: userData.isVerified ?? false,
      isAdmin,
      isSuspended: userData.isSuspended ?? false,
      createdAt: userData.createdAt ?? new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  // Create a pending user with just email verification details
  async createPendingUser(email: string, verificationToken: string, tokenExpiry: Date): Promise<Partial<User>> {
    // Check if this email already exists as a full user
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    
    // Create or update the pending user
    const pendingUser = {
      email,
      verificationToken,
      verificationTokenExpiry: tokenExpiry
    };
    
    this.pendingUsers.set(email, pendingUser);
    return pendingUser;
  }
  
  // Get pending user by email
  async getPendingUserByEmail(email: string): Promise<{
    email: string;
    verificationToken: string | null;
    verificationTokenExpiry: Date | null;
    mobileNumber?: string;
  } | undefined> {
    return this.pendingUsers.get(email);
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
    
    // Create the full user
    const user = await this.createUser({
      email,
      password,
      isVerified: true,
    });
    
    // Remove from pending users
    this.pendingUsers.delete(email);
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    const users = Array.from(this.users.values());
    // Backup users to JSON file
    const fs = require('fs');
    const userBackup = {
      users: users,
      userPreferences: Array.from(this.userPrefs.values()),
      userAddresses: Array.from(this.addresses.values())
    };
    fs.writeFileSync('user.json', JSON.stringify(userBackup, null, 2));
    return users;
  }
  
  async toggleUserSuspension(id: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    return this.updateUser(id, { isSuspended: !user.isSuspended });
  }
  
  async toggleUserAdmin(id: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    return this.updateUser(id, { isAdmin: !user.isAdmin });
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.featured);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.category === category);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentIds.product++;
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date(),
      featured: product.featured ?? false,
      stock: product.stock ?? 0,
      minStock: product.minStock ?? 5
    };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error("Product not found");
    }
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    if (!this.products.has(id)) {
      return false;
    }
    return this.products.delete(id);
  }

  // Contact operations
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const id = this.currentIds.message++;
    const newMessage = { ...message, id };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    return this.userPrefs.get(userId);
  }

  async createUserPreferences(data: InsertUserPreference): Promise<UserPreference> {
    const id = this.currentIds.preference++;
    const newPrefs: UserPreference = {
      id,
      userId: data.userId,
      emailNotifications: data.emailNotifications ?? true,
      orderUpdates: data.orderUpdates ?? true,
      promotions: data.promotions ?? false,
      accountAlerts: data.accountAlerts ?? true,
      darkMode: data.darkMode ?? false,
      language: data.language ?? 'en',
      currency: data.currency ?? 'inr'
    };
    this.userPrefs.set(data.userId, newPrefs);
    return newPrefs;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreference>): Promise<UserPreference> {
    // Check if preferences exist
    let prefs = this.userPrefs.get(userId);
    
    if (!prefs) {
      // Create new preferences if they don't exist
      return this.createUserPreferences({
        userId,
        emailNotifications: true,
        orderUpdates: true,
        promotions: false,
        accountAlerts: true,
        darkMode: false,
        language: "en",
        currency: "inr",
        ...updates
      } as InsertUserPreference);
    }
    
    // Update existing preferences
    const updatedPrefs = { ...prefs, ...updates };
    this.userPrefs.set(userId, updatedPrefs);
    return updatedPrefs;
  }

  // User addresses operations
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return Array.from(this.addresses.values())
      .filter(addr => addr.userId === userId)
      .sort((a, b) => {
        // Sort by primary first, then by creation date
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        // Safely handle null createdAt values
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1; // If a has no date, put it last
        if (!b.createdAt) return -1; // If b has no date, put it last
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async createUserAddress(data: InsertUserAddress): Promise<UserAddress> {
    const id = this.currentIds.address++;
    
    // If this is the primary address, set all other addresses to non-primary
    if (data.isPrimary) {
      Array.from(this.addresses.values())
        .filter(addr => addr.userId === data.userId)
        .forEach(addr => {
          addr.isPrimary = false;
          this.addresses.set(addr.id, addr);
        });
    }
    
    const newAddress: UserAddress = {
      id,
      userId: data.userId,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country || null,
      isPrimary: data.isPrimary || null,
      label: data.label || null,
      phone: data.phone || null,
      createdAt: new Date()
    };
    
    this.addresses.set(id, newAddress);
    return newAddress;
  }

  async updateUserAddress(id: number, userId: number, updates: Partial<UserAddress>): Promise<UserAddress> {
    const address = Array.from(this.addresses.values())
      .find(addr => addr.id === id && addr.userId === userId);
    
    if (!address) {
      throw new Error("Address not found or doesn't belong to user");
    }
    
    // If updating to primary, set all other addresses to non-primary
    if (updates.isPrimary) {
      Array.from(this.addresses.values())
        .filter(addr => addr.userId === userId && addr.id !== id)
        .forEach(addr => {
          addr.isPrimary = false;
          this.addresses.set(addr.id, addr);
        });
    }
    
    const updatedAddress = { ...address, ...updates };
    this.addresses.set(id, updatedAddress);
    return updatedAddress;
  }

  async deleteUserAddress(id: number, userId: number): Promise<boolean> {
    const address = Array.from(this.addresses.values())
      .find(addr => addr.id === id && addr.userId === userId);
    
    if (!address) {
      return false;
    }
    
    return this.addresses.delete(id);
  }
  
  // Inventory operations
  private inventoryLogs: Map<number, InventoryLog> = new Map();
  private currentInventoryLogId = 1;
  
  async getInventoryLogs(productId?: number): Promise<InventoryLog[]> {
    const logs = Array.from(this.inventoryLogs.values());
    
    if (productId) {
      return logs
        .filter(log => log.productId === productId)
        .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    }
    
    return logs.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }
  
  async createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog> {
    const id = this.currentInventoryLogId++;
    const newLog: InventoryLog = {
      ...log,
      id,
      timestamp: new Date(),
      note: log.note || null
    };
    
    this.inventoryLogs.set(id, newLog);
    return newLog;
  }
  
  async updateProductStock(productId: number, quantityChange: number): Promise<Product> {
    const product = this.products.get(productId);
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Calculate new stock (never go below 0)
    const newStock = Math.max(0, product.stock + quantityChange);
    
    // Update product
    const updatedProduct = await this.updateProduct(productId, { stock: newStock });
    
    // Create log entry
    await this.createInventoryLog({
      productId,
      quantity: quantityChange,
      type: quantityChange > 0 ? 'add' : 'remove',
      note: `Stock updated by ${quantityChange > 0 ? 'adding' : 'removing'} ${Math.abs(quantityChange)} units`
    });
    
    return updatedProduct;
  }
  
  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => {
        if (threshold) {
          return product.stock <= threshold;
        }
        return product.stock <= (product.minStock || 5);
      })
      .sort((a, b) => a.stock - b.stock);
  }
}

import fs from 'fs/promises';
import path from 'path';

// Using MemStorage for development (no database required)
export const storage = new MemStorage();

// Backup user data to JSON file
export async function backupUserData() {
  try {
    const users = await storage.getAllUsers();
    const safeUsers = users.map(user => {
      const { password, resetToken, resetTokenExpiry, verificationToken, verificationTokenExpiry, ...safeUser } = user;
      return safeUser;
    });
    
    const userPreferences = await Promise.all(
      users.map(user => storage.getUserPreferences(user.id))
    );
    
    const userAddresses = await Promise.all(
      users.map(user => storage.getUserAddresses(user.id))
    );

    const data = {
      users: safeUsers,
      userPreferences,
      userAddresses
    };

    await fs.writeFile(
      path.join(process.cwd(), 'user.json'),
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error('Error backing up user data:', error);
  }
}

// Wrap all user-related methods to automatically backup data
const originalStorage = storage;

// User operations that need backup
const methodsToWrap = [
  'createUser',
  'updateUser',
  'toggleUserSuspension',
  'toggleUserAdmin',
  'createUserPreferences',
  'updateUserPreferences',
  'createUserAddress',
  'updateUserAddress',
  'deleteUserAddress'
];

// Wrap each method to include automatic backup
methodsToWrap.forEach(method => {
  const original = storage[method];
  storage[method] = async (...args) => {
    const result = await original.apply(storage, args);
    await backupUserData();
    return result;
  };
});

// Set up periodic backup every 5 minutes
setInterval(async () => {
  try {
    await backupUserData();
    console.log('Periodic backup completed:', new Date().toISOString());
  } catch (error) {
    console.error('Periodic backup failed:', error);
  }
}, 5 * 60 * 1000);

// Using DatabaseStorage for production
// export const storage = new DatabaseStorage();