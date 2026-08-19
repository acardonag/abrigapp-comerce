import { pgTable, uuid, varchar, text, timestamp, boolean, decimal } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  otpCode: varchar("otp_code", { length: 10 }),
  otpExpiresAt: timestamp("otp_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  description: text("description"),
  city: varchar("city", { length: 255 }),
  categoryId: uuid("category_id").references(() => categories.id),
  logoUrl: varchar("logo_url", { length: 1024 }),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  instagramUrl: varchar("instagram_url", { length: 1024 }),
  facebookUrl: varchar("facebook_url", { length: 1024 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").references(() => businesses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: varchar("image_url", { length: 1024 }),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const volunteers = pgTable("volunteers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supportCases = pgTable("support_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  status: varchar("status", { length: 50 }).default("Aplicado").notNull(), // Aplicado, En revision, Aprobado, Rechazado, Expirado
  magicToken: varchar("magic_token", { length: 255 }),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  
  // Volunteer filled data
  supportType: varchar("support_type", { length: 255 }), // especie, economica, etc
  youtubeUrl: varchar("youtube_url", { length: 1024 }),
  imageUrls: text("image_urls"), // JSON stringified array
  donationAccount: text("donation_account"),
  
  publishedAt: timestamp("published_at"), // set when status = Aprobado
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

