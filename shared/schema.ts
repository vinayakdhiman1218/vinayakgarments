import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  mobileNumber: text("mobile_number").default(""),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  isVerified: boolean("is_verified").default(false),
  isAdmin: boolean("is_admin").default(false),
  isSuspended: boolean("is_suspended").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  purchase_price: integer("purchase_price").notNull(),
  price: integer("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  featured: boolean("featured").default(false),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").default(5),
  tax: integer("tax").default(0),
  unit: text("unit"),
  barcode: text("barcode"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(), // Can be positive (stock added) or negative (stock removed)
  type: text("type").notNull(), // 'add', 'remove', 'adjust'
  note: text("note"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  orderUpdates: boolean("order_updates").default(true),
  promotions: boolean("promotions").default(false),
  accountAlerts: boolean("account_alerts").default(true),
  darkMode: boolean("dark_mode").default(false),
  language: text("language").default("en"),
  currency: text("currency").default("inr"),
});

export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").default("India"),
  isPrimary: boolean("is_primary").default(false),
  label: text("label").default("Home"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// For initial registration (email verification step)
export const registrationInitSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// For verifying email and completing registration
export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(6, "Invalid verification code"),
});

// For verifying WhatsApp and completing registration
export const verifyWhatsAppSchema = z.object({
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number is too long")
    .regex(/^\+?\d+$/, "Invalid mobile number format"),
  token: z.string().min(6, "Invalid verification code"),
});

// For completing registration after verification
export const completeRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users)
  .omit({ 
    id: true, 
    resetToken: true, 
    resetTokenExpiry: true,
    verificationToken: true,
    verificationTokenExpiry: true,
    isVerified: true
  })
  .extend({
    confirmPassword: z.string(),
    mobileNumber: z.string()
      .min(10, "Mobile number must be at least 10 digits")
      .max(15, "Mobile number is too long")
      .regex(/^\+?\d+$/, "Invalid mobile number format")
      .optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

// No internal schema version needed - handled directly in storage.ts

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true })
  .extend({
    minStock: z.number().min(0).default(5)
  });

export const insertInventoryLogSchema = createInsertSchema(inventoryLogs)
  .omit({ id: true, timestamp: true });

export const insertContactMessageSchema = createInsertSchema(contactMessages)
  .omit({ id: true });

export const insertUserPreferencesSchema = createInsertSchema(userPreferences)
  .omit({ id: true });

export const insertUserAddressSchema = createInsertSchema(userAddresses)
  .omit({ id: true, createdAt: true });

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyResetTokenSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(6, "Invalid verification code"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegistrationInit = z.infer<typeof registrationInitSchema>;
export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type VerifyWhatsApp = z.infer<typeof verifyWhatsAppSchema>;
export type CompleteRegistration = z.infer<typeof completeRegistrationSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferencesSchema>;
export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;