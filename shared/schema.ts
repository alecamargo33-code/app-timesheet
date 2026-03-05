import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#3b82f6").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeLogs = pgTable("time_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
});

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  user: one(users, {
    fields: [timeLogs.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [timeLogs.taskId],
    references: [tasks.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertTimeLogSchema = createInsertSchema(timeLogs).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TimeLog = typeof timeLogs.$inferSelect;
export type InsertTimeLog = z.infer<typeof insertTimeLogSchema>;

export type UpdateUserRequest = Partial<InsertUser>;
export type UpdateCategoryRequest = Partial<InsertCategory>;
export type UpdateTaskRequest = Partial<InsertTask>;
export type UpdateTimeLogRequest = Partial<InsertTimeLog>;

export type TimeLogWithRelations = TimeLog & { user: User; task: Task & { category: Category } };
export type TaskWithCategory = Task & { category: Category };
