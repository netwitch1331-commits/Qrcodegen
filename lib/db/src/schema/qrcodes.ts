import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const qrCodesTable = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  style: jsonb("style").notNull().default({}),
  isDynamic: boolean("is_dynamic").notNull().default(false),
  dynamicUrl: text("dynamic_url"),
  scans: integer("scans").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scanEventsTable = pgTable("scan_events", {
  id: serial("id").primaryKey(),
  qrCodeId: integer("qr_code_id").notNull().references(() => qrCodesTable.id, { onDelete: "cascade" }),
  geo: text("geo"),
  device: text("device"),
  userAgent: text("user_agent"),
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
});

export const insertQrCodeSchema = createInsertSchema(qrCodesTable).omit({ id: true, scans: true, createdAt: true, updatedAt: true });
export const insertScanEventSchema = createInsertSchema(scanEventsTable).omit({ id: true, scannedAt: true });

export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type QrCode = typeof qrCodesTable.$inferSelect;
export type InsertScanEvent = z.infer<typeof insertScanEventSchema>;
export type ScanEvent = typeof scanEventsTable.$inferSelect;
