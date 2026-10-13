import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  churchKey: text("church_key").notNull().default("midway"),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  contact: text("contact").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  preferredContact: text("preferred_contact").notNull().default(""),
  assignedTo: text("assigned_to").notNull().default(""),
  dueDate: text("due_date").notNull().default(""),
  priority: text("priority").notNull().default("normal"),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(""),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [index("idx_items_church_key").on(table.churchKey)]);

export const churches = sqliteTable("churches", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const memberships = sqliteTable("memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  churchKey: text("church_key").notNull(),
  role: text("role").notNull().default("editor"),
}, table => [uniqueIndex("idx_memberships_email_church").on(table.email, table.churchKey)]);

export const participation = sqliteTable("participation", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id").notNull(),
  churchKey: text("church_key").notNull(),
  updatedAt: text("updated_at").notNull().default(""),
}, table => [uniqueIndex("idx_participation_opportunity_church").on(table.opportunityId, table.churchKey)]);

export const localUsers = sqliteTable("local_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  salt: text("salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const loginInvites = sqliteTable("login_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const localSessions = sqliteTable("local_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [index("idx_local_sessions_user").on(table.userId)]);
export const loginAttempts = sqliteTable("login_attempts", {
  email: text("email").primaryKey(),
  failedCount: integer("failed_count").notNull().default(0),
  windowStart: integer("window_start").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
});
